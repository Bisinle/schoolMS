<?php

namespace App\Http\Controllers;

use App\Models\DocumentCategory;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class DocumentCategoryController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', DocumentCategory::class);

        $query = DocumentCategory::withCount('documents');

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by entity type
        if ($request->filled('entity_type') && $request->entity_type !== 'all') {
            if ($request->entity_type === 'global') {
                $query->whereNull('entity_type');
            } else {
                $query->where('entity_type', $request->entity_type);
            }
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Sort
        $sortField = $request->get('sort_field', 'sort_order');
        $sortDirection = $request->get('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $categories = $query->paginate(15)->withQueryString();

        return Inertia::render('Documents/Categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'entity_type', 'status', 'sort_field', 'sort_direction']),
            'entityTypes' => ['Teacher', 'Student', 'Guardian', 'User'],
        ]);
    }

    public function create()
    {
        $this->authorize('create', DocumentCategory::class);

        return Inertia::render('Documents/Categories/Create', [
            'entityTypes' => ['Teacher', 'Student', 'Guardian', 'User'],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', DocumentCategory::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'entity_type' => 'nullable|in:Teacher,Student,Guardian,User',
            'is_required' => 'boolean',
            'description' => 'nullable|string',
            'max_file_size' => 'required|integer|min:1|max:51200', // Max 50MB
            'allowed_extensions' => 'nullable|array',
            'allowed_extensions.*' => 'string|in:pdf,doc,docx,jpg,jpeg,png,gif,zip',
            'expires' => 'boolean',
            'expiry_alert_days' => 'nullable|integer|min:1|max:365',
            'sort_order' => 'integer|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        DocumentCategory::create($validated);

        return redirect()->route('Documents/Categories/index')
            ->with('success', 'Document category created successfully.');
    }

    public function show(DocumentCategory $documentCategory)
    {
        $this->authorize('view', $documentCategory);

        $documentCategory->loadCount([
            'documents',
            'documents as pending_count' => function ($query) {
                $query->where('status', 'pending');
            },
            'documents as verified_count' => function ($query) {
                $query->where('status', 'verified');
            },
            'documents as rejected_count' => function ($query) {
                $query->where('status', 'rejected');
            },
            'documents as expired_count' => function ($query) {
                $query->where('status', 'expired');
            },
        ]);

        return Inertia::render('Documents/Categories/Show', [
            'category' => $documentCategory,
        ]);
    }

    public function edit(DocumentCategory $documentCategory)
    {
        $this->authorize('update', $documentCategory);

        return Inertia::render('Documents/Categories/Edit', [
            'category' => $documentCategory,
            'entityTypes' => ['Teacher', 'Student', 'Guardian', 'User'],
        ]);
    }

    public function update(Request $request, DocumentCategory $documentCategory)
    {
        $this->authorize('update', $documentCategory);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'entity_type' => 'nullable|in:Teacher,Student,Guardian,User',
            'is_required' => 'boolean',
            'description' => 'nullable|string',
            'max_file_size' => 'required|integer|min:1|max:51200',
            'allowed_extensions' => 'nullable|array',
            'allowed_extensions.*' => 'string|in:pdf,doc,docx,jpg,jpeg,png,gif,zip',
            'expires' => 'boolean',
            'expiry_alert_days' => 'nullable|integer|min:1|max:365',
            'sort_order' => 'integer|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        $documentCategory->update($validated);

        return redirect()->route('Documents/Categories/index')
            ->with('success', 'Document category updated successfully.');
    }

    public function destroy(DocumentCategory $documentCategory)
    {
        $this->authorize('delete', $documentCategory);

        if ($documentCategory->documents()->count() > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete category with existing documents. Please reassign or delete documents first.'
            ]);
        }

        $documentCategory->delete();

        return redirect()->route('Documents/Categories/.index')
            ->with('success', 'Document category deleted successfully.');
    }
}