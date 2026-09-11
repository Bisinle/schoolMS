<?php

namespace App\Http\Middleware;

use App\Models\School;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeeModule
{
    /**
     * Handle an incoming request.
     * Ensures the school's fee_module matches the value required by the
     * route (e.g. 'termly' or 'monthly') before allowing access.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $required): Response
    {
        if (! auth()->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user();

        // Super admins should not access school routes directly
        if ($user->isSuperAdmin()) {
            abort(404);
        }

        // School users must have a school_id
        if (! $user->school_id) {
            abort(404);
        }

        $school = School::find($user->school_id);

        if (! $school || $school->fee_module !== $required) {
            abort(404);
        }

        return $next($request);
    }
}
