<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ImpersonationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class ImpersonationController extends Controller
{
    /**
     * Start impersonating a user
     */
    public function start(Request $request, User $user)
    {
        // Only admins can impersonate
        if (!Auth::user()->isAdmin()) {
            return back()->withErrors(['error' => 'Unauthorized action.']);
        }

        // Cannot impersonate another admin
        if ($user->isAdmin()) {
            return back()->withErrors(['error' => 'Cannot impersonate another administrator.']);
        }

        // Cannot impersonate yourself
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'Cannot impersonate yourself.']);
        }

        // Store original admin info in session
        Session::put('impersonating', true);
        Session::put('impersonated_by', Auth::id());
        Session::put('impersonation_started_at', now());

        // Create impersonation log
        $log = ImpersonationLog::create([
            'admin_id' => Auth::id(),
            'user_id' => $user->id,
            'started_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        Session::put('impersonation_log_id', $log->id);

        // Login as the target user
        Auth::loginUsingId($user->id);

        // Redirect to their dashboard
        return redirect()->route('dashboard')
            ->with('success', "Now viewing system as {$user->name}");
    }

    /**
     * Stop impersonating and return to admin
     */
    public function stop(Request $request)
    {
        if (!Session::has('impersonating')) {
            return redirect()->route('dashboard');
        }

        $originalAdminId = Session::get('impersonated_by');
        $logId = Session::get('impersonation_log_id');

        // Update the impersonation log
        if ($logId) {
            $log = ImpersonationLog::find($logId);
            if ($log) {
                $log->update([
                    'ended_at' => now(),
                ]);
            }
        }

        // Clear impersonation session data
        Session::forget('impersonating');
        Session::forget('impersonated_by');
        Session::forget('impersonation_started_at');
        Session::forget('impersonation_log_id');

        // Login back as admin
        Auth::loginUsingId($originalAdminId);

        return redirect()->route('users.index')
            ->with('success', 'Returned to admin mode.');
    }

    /**
     * View impersonation logs (optional admin page)
     */
    public function logs(Request $request)
    {
        if (!Auth::user()->role === 'admin')) {
        
            abort(403);
        }

        $query = ImpersonationLog::with(['admin', 'user'])
            ->latest('started_at');

        // Filter by admin
        if ($request->filled('admin_id')) {
            $query->where('admin_id', $request->admin_id);
        }

        // Filter by user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('started_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('started_at', '<=', $request->date_to);
        }

        $logs = $query->paginate(20)->withQueryString();

        $admins = User::where('role', 'admin')->get(['id', 'name']);
        $users = User::where('role', '!=', 'admin')->get(['id', 'name', 'role']);

        return Inertia::render('Admin/ImpersonationLogs', [
            'logs' => $logs,
            'admins' => $admins,
            'users' => $users,
            'filters' => $request->only(['admin_id', 'user_id', 'date_from', 'date_to']),
        ]);
    }
}