<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

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

        // Only check if we're in a tenant context
        if (!tenancy()->initialized) {
            return $next($request);
        }

        // Get the current tenant
        $tenant = tenancy()->tenant;

        if (!$tenant) {
            return $next($request);
        }

        // Check if school is active in the central database
        try {
            $isActive = DB::connection('central')->table('schools')
                ->where('subdomain', $tenant->id)
                ->value('is_active');

            if ($isActive === false || $isActive === 0 || $isActive === null) {
                // Log out the user if they're authenticated
                if (Auth::check()) {
                    Auth::logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                }

                // Redirect to the school inactive page
                return redirect()->route('school.inactive');
            }
        } catch (\Exception $e) {
            // If we can't check, allow the request to proceed
            // This prevents breaking the app if central DB is unavailable
            Log::warning('Could not check school active status', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage()
            ]);
        }

        return $next($request);
    }
}
