<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use App\Services\UserManagementService;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;

class UserController extends Controller
{
    protected UserManagementService $userService;

    public function __construct(UserManagementService $userService)
    {
        $this->middleware(['auth', 'role:admin']);
        $this->userService = $userService;
    }

    /**
     * Display a listing of users
     */
    public function index(Request $request)
    {
        $query = User::with(['creator'])
            ->withCount(['activityLogs', 'createdUsers']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Filter by status
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Sort
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Paginate
        $users = $query->paginate(15)->withQueryString();

        // Get statistics
        $stats = [
            'total' => User::count(),
            'active' => User::where('is_active', true)->count(),
            'inactive' => User::where('is_active', false)->count(),
            'by_role' => User::select('role', \DB::raw('count(*) as count'))
                ->groupBy('role')
                ->pluck('count', 'role')
                ->toArray(),
        ];

        return Inertia::render('Users/Index', [
            'users' => $users,
            'stats' => $stats,
            'filters' => $request->only(['search', 'role', 'status', 'sort_field', 'sort_direction']),
            'roles' => UserRole::toArray(),
        ]);
    }

    /**
     * Show the form for creating a new user
     */
    public function create()
    {
        return Inertia::render('Users/Create', [
            'roles' => UserRole::toArray(),
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'string', 'in:' . implode(',', UserRole::values())],
            'password_setup_method' => ['required', 'in:generate,send_email,custom'],
            'password' => ['required_if:password_setup_method,custom', 'nullable', 'string', Rules\Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()],
            'password_confirmation' => ['required_if:password_setup_method,custom', 'nullable', 'same:password'],
            'must_change_password' => ['boolean'],
        ]);

        // Prevent creating another admin (optional security measure)
        // Uncomment if you want only one admin
        // if ($validated['role'] === 'admin' && User::where('role', 'admin')->exists()) {
        //     return back()->withErrors(['role' => 'An admin user already exists.']);
        // }

        $result = $this->userService->createUser($validated, Auth::user());

        if ($result['success']) {
            // Store password in session for display on next page
            return redirect()->route('users.show', $result['user'])
                ->with('success', $result['message'])
                ->with('generated_password', $result['password']);
        }

        return back()->withErrors(['error' => $result['message']])->withInput();
    }

    /**
     * Display the specified user
     */
    public function show(User $user)
    {
        $user->load(['creator', 'createdUsers', 'activityLogs.causer']);
        
        $recentActivity = ActivityLog::where('user_id', $user->id)
            ->with('causer')
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('Users/Show', [
            'user' => $user,
            'recentActivity' => $recentActivity,
            'roles' => UserRole::toArray(),
        ]);
    }

    /**
     * Show the form for editing the specified user
     */
    public function edit(User $user)
    {
        // Prevent editing own account through this interface
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot edit your own account through this interface.']);
        }

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => UserRole::toArray(),
        ]);
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, User $user)
    {
        // Prevent editing own account
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot edit your own account.']);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'string', 'in:' . implode(',', UserRole::values())],
            'is_active' => ['required', 'boolean'],
        ]);

        $result = $this->userService->updateUser($user, $validated, Auth::user());

        if ($result['success']) {
            return redirect()->route('users.show', $user)
                ->with('success', $result['message']);
        }

        return back()->withErrors(['error' => $result['message']])->withInput();
    }

    /**
     * Remove the specified user
     */
    public function destroy(User $user)
    {
        // Prevent deleting own account
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot delete your own account.']);
        }

        // Prevent deleting the last admin
        if ($user->role === 'admin' && User::where('role', 'admin')->count() <= 1) {
            return back()->withErrors(['error' => 'Cannot delete the last admin user.']);
        }

        $result = $this->userService->deleteUser($user, Auth::user());

        if ($result['success']) {
            return redirect()->route('users.index')
                ->with('success', $result['message']);
        }

        return back()->withErrors(['error' => $result['message']]);
    }

    /**
     * Reset user password
     */
    public function resetPassword(User $user)
    {
        // Prevent resetting own password through this interface
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot reset your own password through this interface.']);
        }

        $result = $this->userService->resetPassword($user, Auth::user());

        if ($result['success']) {
            return back()
                ->with('success', $result['message'])
                ->with('generated_password', $result['password']);
        }

        return back()->withErrors(['error' => $result['message']]);
    }

    /**
     * Toggle user active status
     */
    public function toggleStatus(User $user)
    {
        // Prevent deactivating own account
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'You cannot deactivate your own account.']);
        }

        $result = $this->userService->updateUser(
            $user,
            ['is_active' => !$user->is_active],
            Auth::user()
        );

        if ($result['success']) {
            $status = $user->fresh()->is_active ? 'activated' : 'deactivated';
            return back()->with('success', "User {$status} successfully.");
        }

        return back()->withErrors(['error' => $result['message']]);
    }
}