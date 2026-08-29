<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Extracted from RoleMiddleware (2026-08-26, Phase 5 of the Spatie
 * migration) so the deactivated-user logout check keeps applying to every
 * route that used to carry `role:...` middleware, once those routes switch
 * to permission-based middleware instead. This is the ONLY place in the app
 * that enforces `is_active` on the requesting user (confirmed via a
 * repo-wide search before extracting) — deliberately kept as its own
 * middleware, stacked alongside `permission:...`, rather than folded into
 * a broader/global check, so its scope stays exactly what it was before:
 * only the routes that previously had `role:...`.
 */
class CheckUserActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            return redirect()->route('login');
        }

        if (isset($request->user()->is_active) && ! $request->user()->is_active) {
            auth()->logout();

            return redirect()->route('login')->withErrors([
                'email' => 'Your account has been deactivated. Please contact the administrator.',
            ]);
        }

        return $next($request);
    }
}
