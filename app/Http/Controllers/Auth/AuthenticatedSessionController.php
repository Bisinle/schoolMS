<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\ActivityLog;
use App\Enums\ActivityType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Get authenticated user
        $user = Auth::user();

        // Update last login timestamp (only if field exists)
        if (method_exists($user, 'updateLastLogin')) {
            $user->updateLastLogin();
        }

        // Log successful login (only if ActivityLog model exists)
        if (class_exists(ActivityLog::class) && class_exists(ActivityType::class)) {
            try {
                ActivityLog::createLog(
                    ActivityType::LOGIN->value,
                    $user->id,
                    $user->id,
                    "User logged in successfully",
                    null
                );
            } catch (\Exception $e) {
                // Silently fail if activity logging fails
                // This prevents login from failing if activity log table doesn't exist yet
            }
        }

        // Redirect based on user role
        if ($user->isSuperAdmin()) {
            return redirect()->intended(route('super-admin.dashboard', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Log logout (only if ActivityLog model exists)
        if (Auth::check() && class_exists(ActivityLog::class) && class_exists(ActivityType::class)) {
            try {
                ActivityLog::createLog(
                    ActivityType::LOGOUT->value,
                    Auth::id(),
                    Auth::id(),
                    "User logged out",
                    null
                );
            } catch (\Exception $e) {
                // Silently fail if activity logging fails
            }
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        // Redirect to login page instead of root to avoid hitting central API routes
        return redirect()->route('login');
    }
}