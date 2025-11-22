<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\School;

class CheckMadrasahSchool
{
    /**
     * Handle an incoming request.
     * Ensures the school type is 'madrasah' before allowing access.
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
            abort(404);
        }

        // School users must have a school_id
        if (!$user->school_id) {
            abort(404);
        }

        // Check if school type is madrasah
        $school = School::find($user->school_id);

        if (!$school || $school->school_type !== 'madrasah') {
            abort(404);
        }

        return $next($request);
    }
}

