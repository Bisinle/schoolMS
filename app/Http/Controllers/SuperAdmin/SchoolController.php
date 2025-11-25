<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\SchoolAdminWelcomeMail;
use Illuminate\Validation\Rule;

class SchoolController extends Controller
{
    public function index(Request $request)
    {
        $query = School::query()->withCount(['users', 'students', 'teachers', 'guardians']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('admin_email', 'like', "%{$search}%")
                  ->orWhere('domain', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by active/inactive
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Sort
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $schools = $query->paginate(15)->withQueryString();

        return Inertia::render('SuperAdmin/Schools/Index', [
            'schools' => $schools,
            'filters' => $request->only(['search', 'status', 'is_active', 'sort', 'direction']),
        ]);
    }

    public function create()
    {
        return Inertia::render('SuperAdmin/Schools/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:schools,slug',
            'domain' => 'nullable|string|max:255|unique:schools,domain',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status' => 'required|in:trial,active,suspended,cancelled',
            'school_type' => 'required|in:islamic_school,madrasah',
            'trial_ends_at' => 'nullable|date',
            'password_option' => 'required|in:auto,manual',
            'admin_password' => 'required_if:password_option,manual|nullable|string|min:8',
            'send_email' => 'boolean',
        ]);

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Generate domain if not provided
        if (empty($validated['domain'])) {
            $validated['domain'] = $validated['slug'] . '.localhost';
        }

        DB::beginTransaction();
        try {
            // Create school
            $school = School::create([
                'name' => $validated['name'],
                'slug' => $validated['slug'],
                'domain' => $validated['domain'],
                'admin_name' => $validated['admin_name'],
                'admin_email' => $validated['admin_email'],
                'admin_phone' => $validated['admin_phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'status' => $validated['status'],
                'school_type' => $validated['school_type'],
                'is_active' => true,
                'trial_ends_at' => $validated['trial_ends_at'] ?? now()->addDays(30),
                'current_student_count' => 0,
            ]);

            // Determine password based on option
            if ($validated['password_option'] === 'manual') {
                $password = $validated['admin_password'];
            } else {
                $password = Str::random(12);
            }

            // Create school admin user with employee number
            $user = User::create([
                'school_id' => $school->id,
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'password' => Hash::make($password),
                'role' => 'admin',
                'employee_number' => \App\Services\UniqueIdentifierService::generateAdminEmployeeNumber($school->id),
                'is_active' => true,
                'email_verified_at' => now(),
                'must_change_password' => $validated['password_option'] === 'auto', // Only require change for auto-generated passwords
            ]);

            DB::commit();

            // Send email if requested
            $emailSent = false;
            if ($validated['send_email'] ?? false) {
                try {
                    // Determine login URL
                    $loginUrl = url('/login');

                    // Send email synchronously (not queued) as per user's memory
                    Mail::to($user->email)->send(new SchoolAdminWelcomeMail($school, $password, $loginUrl));
                    $emailSent = true;
                } catch (\Exception $e) {
                    Log::error('Failed to send school admin welcome email', [
                        'school_id' => $school->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $message = "School created successfully!";
            if ($emailSent) {
                $message .= " Welcome email sent to {$user->email}.";
            } else {
                $message .= " Admin password: {$password} (Please save this!)";
            }

            return redirect()->route('super-admin.schools.show', $school)
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create school: ' . $e->getMessage()]);
        }
    }

    public function show(School $school)
    {
        $school->load(['users', 'students', 'teachers', 'guardians']);
        $school->loadCount(['users', 'students', 'teachers', 'guardians', 'grades']);

        return Inertia::render('SuperAdmin/Schools/Show', [
            'school' => $school,
        ]);
    }

    public function edit(School $school)
    {
        return Inertia::render('SuperAdmin/Schools/Edit', [
            'school' => $school,
        ]);
    }

    public function update(Request $request, School $school)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('schools')->ignore($school->id)],
            'domain' => ['nullable', 'string', 'max:255', Rule::unique('schools')->ignore($school->id)],
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email',
            'admin_phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status' => 'required|in:trial,active,suspended,cancelled',
            'school_type' => 'required|in:islamic_school,madrasah',
            'is_active' => 'required|boolean',
            'trial_ends_at' => 'nullable|date',
        ]);

        $school->update($validated);

        return redirect()->route('super-admin.schools.show', $school)
            ->with('success', 'School updated successfully!');
    }

    public function destroy(School $school)
    {
        try {
            $school->delete();

            return redirect()->route('super-admin.schools.index')
                ->with('success', 'School deleted successfully!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete school: ' . $e->getMessage()]);
        }
    }

    public function toggleActive(School $school)
    {
        try {
            $school->update([
                'is_active' => !$school->is_active,
            ]);

            $status = $school->is_active ? 'activated' : 'deactivated';

            return redirect()->route('super-admin.schools.show', $school)
                ->with('success', "School {$status} successfully!");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to toggle school status: ' . $e->getMessage()]);
        }
    }

    public function impersonate(School $school)
    {
        // Find the school admin
        $admin = $school->users()->where('role', 'admin')->first();

        if (!$admin) {
            return back()->withErrors(['error' => 'No admin found for this school.']);
        }

        // Impersonate the school admin
        auth()->user()->impersonate($admin);

        return redirect()->route('dashboard')
            ->with('success', "Now viewing as {$school->name} admin");
    }
}

