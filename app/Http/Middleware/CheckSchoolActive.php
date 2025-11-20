<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use App\Models\School;

class CheckSchoolActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip check if accessing the inactive page itself (prevent redirect loop)
        if ($request->routeIs('school.inactive')) {
            return $next($request);
        }

        // Only check if user is authenticated
        if (!Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();

        // Skip check if user has no school_id (super admin)
        if (!$user->school_id) {
            return $next($request);
        }

        // Check if school is active
        try {
            $school = School::find($user->school_id);

            if (!$school || !$school->isActive()) {
                // Log out the user
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                // Redirect to the school inactive page
                return redirect()->route('school.inactive');
            }
        } catch (\Exception $e) {
            // If we can't check, allow the request to proceed
            // This prevents breaking the app if there's an issue
            Log::warning('Could not check school active status', [
                'school_id' => $user->school_id,
                'error' => $e->getMessage()
            ]);
        }

        return $next($request);
    }
}
