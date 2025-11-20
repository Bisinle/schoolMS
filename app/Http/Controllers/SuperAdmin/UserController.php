<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\School;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Mail\UserPasswordResetMail;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('school:id,name')
            ->whereNotNull('school_id'); // Exclude super admins

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by school
        if ($request->filled('school_id')) {
            $query->where('school_id', $request->school_id);
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Filter by active/inactive
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Sort
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $users = $query->paginate(20)->withQueryString();

        // Get schools for filter dropdown
        $schools = School::orderBy('name')->get(['id', 'name']);

        return Inertia::render('SuperAdmin/Users/Index', [
            'users' => $users,
            'schools' => $schools,
            'filters' => $request->only(['search', 'school_id', 'role', 'is_active', 'sort', 'direction']),
        ]);
    }

    public function show(User $user)
    {
        $user->load(['school:id,name', 'teacher', 'guardian']);

        return Inertia::render('SuperAdmin/Users/Show', [
            'user' => $user,
        ]);
    }

    public function resetPassword(User $user)
    {
        $newPassword = Str::random(12);
        $user->update([
            'password' => Hash::make($newPassword),
            'must_change_password' => true,
        ]);

        // Send email with new password (synchronously, not queued)
        $emailSent = false;
        try {
            $loginUrl = url('/login');
            Mail::to($user->email)->send(new UserPasswordResetMail($user, $newPassword, $loginUrl));
            $emailSent = true;
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        $message = "Password reset successfully!";
        if ($emailSent) {
            $message .= " An email with the new password has been sent to {$user->email}.";
        } else {
            $message .= " New password: {$newPassword} (Please save this!)";
        }

        return back()->with('success', $message);
    }

    public function toggleActive(User $user)
    {
        $user->update([
            'is_active' => !$user->is_active,
        ]);

        $status = $user->is_active ? 'activated' : 'suspended';

        return back()->with('success', "User {$status} successfully!");
    }

    public function destroy(User $user)
    {
        // Prevent deleting super admins
        if ($user->isSuperAdmin()) {
            return back()->withErrors(['error' => 'Cannot delete super admin users.']);
        }

        try {
            $user->delete();

            return redirect()->route('super-admin.users.index')
                ->with('success', 'User deleted successfully!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete user: ' . $e->getMessage()]);
        }
    }
}

