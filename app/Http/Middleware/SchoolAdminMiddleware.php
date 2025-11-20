<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SchoolAdminMiddleware
{
    /**
     * Handle an incoming request.
     * Ensures user has a school_id and is not a super admin
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user();

        // Super admins should not access school routes directly
        if ($user->isSuperAdmin()) {
            return redirect()->route('super-admin.dashboard');
        }

        // School users must have a school_id
        if (!$user->school_id) {
            abort(403, 'No school assigned to your account.');
        }

        return $next($request);
    }
}

