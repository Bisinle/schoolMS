<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use App\Models\PolicyRevision;
use App\Models\PolicyAcknowledgment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PolicyController extends Controller
{
    /**
     * Display a listing of policies.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Policy::class);

        $query = Policy::with(['creator', 'approver'])
            ->where('school_id', Auth::user()->school_id);

        // Non-admin users can only see published policies
        if (Auth::user()->role !== 'admin') {
            $query->where('status', 'published');
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by status (only for admins)
        if ($request->filled('status') && Auth::user()->role === 'admin') {
            $query->where('status', $request->status);
        }

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('policy_number', 'like', '%' . $request->search . '%')
                  ->orWhere('summary', 'like', '%' . $request->search . '%');
            });
        }

        $policies = $query->latest()->paginate(15);

        return Inertia::render('Policies/Index', [
            'policies' => $policies,
            'filters' => $request->only(['type', 'status', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new policy.
     */
    public function create()
    {
        $this->authorize('create', Policy::class);

        return Inertia::render('Policies/Create');
    }

    /**
     * Store a newly created policy in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Policy::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:school_policy,student_handbook,staff_handbook,code_of_conduct,rules_regulations,safety_policy,academic_policy,admission_policy,fee_policy,other',
            'content' => 'required|string',
            'summary' => 'nullable|string',
            'effective_date' => 'nullable|date',
            'review_date' => 'nullable|date|after:effective_date',
            'requires_acknowledgment' => 'boolean',
            'tags' => 'nullable|array',
        ]);

        // Generate policy number
        $year = now()->year;
        $lastPolicy = Policy::where('school_id', Auth::user()->school_id)
                           ->whereYear('created_at', $year)
                           ->orderBy('id', 'desc')
                           ->first();
        
        $nextNumber = $lastPolicy ? (int) substr($lastPolicy->policy_number, -3) + 1 : 1;
        $policyNumber = 'POL-' . $year . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        $policy = Policy::create([
            'school_id' => Auth::user()->school_id,
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']),
            'type' => $validated['type'],
            'policy_number' => $policyNumber,
            'content' => $validated['content'],
            'summary' => $validated['summary'] ?? null,
            'effective_date' => $validated['effective_date'] ?? null,
            'review_date' => $validated['review_date'] ?? null,
            'requires_acknowledgment' => $validated['requires_acknowledgment'] ?? false,
            'tags' => $validated['tags'] ?? null,
            'status' => 'draft',
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('policies.show', $policy)
            ->with('success', 'Policy created successfully.');
    }

    /**
     * Display the specified policy.
     */
    public function show(Policy $policy)
    {
        $this->authorize('view', $policy);

        $policy->load(['creator', 'approver', 'supersededPolicy']);
        
        // Increment view count
        $policy->incrementViewCount();

        // Check if current user has acknowledged
        $hasAcknowledged = $policy->hasBeenAcknowledgedBy(Auth::user());

        // Get acknowledgment stats if policy requires it
        $acknowledgmentStats = null;
        if ($policy->requires_acknowledgment && Auth::user()->role === 'admin') {
            $acknowledgmentStats = [
                'rate' => $policy->getAcknowledgmentRate(),
                'count' => $policy->acknowledgments()->count(),
            ];
        }

        return Inertia::render('Policies/Show', [
            'policy' => $policy,
            'hasAcknowledged' => $hasAcknowledged,
            'acknowledgmentStats' => $acknowledgmentStats,
        ]);
    }

    /**
     * Show the form for editing the specified policy.
     */
    public function edit(Policy $policy)
    {
        $this->authorize('update', $policy);

        $policy->load(['creator', 'approver']);

        return Inertia::render('Policies/Edit', [
            'policy' => $policy,
        ]);
    }

    /**
     * Update the specified policy in storage.
     */
    public function update(Request $request, Policy $policy)
    {
        $this->authorize('update', $policy);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:school_policy,student_handbook,staff_handbook,code_of_conduct,rules_regulations,safety_policy,academic_policy,admission_policy,fee_policy,other',
            'content' => 'required|string',
            'summary' => 'nullable|string',
            'effective_date' => 'nullable|date',
            'review_date' => 'nullable|date|after:effective_date',
            'requires_acknowledgment' => 'boolean',
            'tags' => 'nullable|array',
        ]);

        // Create revision if content changed
        if ($policy->content !== $validated['content']) {
            PolicyRevision::create([
                'policy_id' => $policy->id,
                'revised_by' => Auth::id(),
                'version' => $policy->version,
                'content' => $policy->content,
                'revision_notes' => $request->input('revision_notes', 'Content updated'),
                'created_at' => now(),
            ]);

            // Increment version
            $versionParts = explode('.', $policy->version);
            $versionParts[1] = (int)$versionParts[1] + 1;
            $validated['version'] = implode('.', $versionParts);
        }

        $policy->update([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']),
            'type' => $validated['type'],
            'content' => $validated['content'],
            'summary' => $validated['summary'] ?? null,
            'effective_date' => $validated['effective_date'] ?? null,
            'review_date' => $validated['review_date'] ?? null,
            'requires_acknowledgment' => $validated['requires_acknowledgment'] ?? false,
            'tags' => $validated['tags'] ?? null,
            'version' => $validated['version'] ?? $policy->version,
        ]);

        return redirect()->route('policies.show', $policy)
            ->with('success', 'Policy updated successfully.');
    }

    /**
     * Remove the specified policy from storage.
     */
    public function destroy(Policy $policy)
    {
        $this->authorize('delete', $policy);

        $policy->delete();

        return redirect()->route('policies.index')
            ->with('success', 'Policy deleted successfully.');
    }

    /**
     * Publish a policy.
     */
    public function publish(Policy $policy)
    {
        $this->authorize('publish', $policy);

        $policy->update([
            'status' => 'published',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'published_at' => now(),
        ]);

        return redirect()->route('policies.show', $policy)
            ->with('success', 'Policy published successfully.');
    }

    /**
     * User acknowledges reading a policy.
     */
    public function acknowledge(Request $request, Policy $policy)
    {
        $this->authorize('acknowledge', $policy);

        if (!$policy->requires_acknowledgment) {
            return back()->with('error', 'This policy does not require acknowledgment.');
        }

        if ($policy->hasBeenAcknowledgedBy(Auth::user())) {
            return back()->with('info', 'You have already acknowledged this policy.');
        }

        PolicyAcknowledgment::create([
            'policy_id' => $policy->id,
            'user_id' => Auth::id(),
            'acknowledged_at' => now(),
            'ip_address' => $request->ip(),
            'notes' => $request->input('notes'),
        ]);

        return back()->with('success', 'Policy acknowledged successfully.');
    }

    /**
     * View revision history (Admin only).
     */
    public function revisions(Policy $policy)
    {
        // Only admins can view revision history
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        $this->authorize('view', $policy);

        $revisions = $policy->revisions()
            ->with('revisor')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Policies/Revisions', [
            'policy' => $policy,
            'revisions' => $revisions,
        ]);
    }
}

