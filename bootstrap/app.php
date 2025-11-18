<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\CheckSchoolActive;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        using: function () {
            /**
             * CENTRAL ROUTES (API + WEB)
             * Only load on central domains (localhost, 127.0.0.1, etc.)
             * NOT on tenant domains (subdomain.localhost)
             */

            $centralDomains = config('tenancy.central_domains', [
                '127.0.0.1',
                'localhost',
                'localhost:8002',
                '127.0.0.1:8002',
            ]);

            $currentHost = request()->getHost();
            $currentHostWithPort = request()->getHost() . (request()->getPort() ? ':' . request()->getPort() : '');

            // Only load central routes if we're on a central domain
            if (in_array($currentHost, $centralDomains) || in_array($currentHostWithPort, $centralDomains)) {
                // Central web routes - only on central domains
                Route::middleware('web')
                    ->group(base_path('routes/web.php'));
            }

            // Central API routes - available on ALL domains (central and tenant)
            Route::prefix('api')
                ->middleware('api')
                ->group(base_path('routes/api.php'));

            /**
             * TENANT ROUTES
             * Registered automatically by TenancyServiceProvider
             * These are in routes/tenant.php and use:
             * - InitializeTenancyByDomain middleware
             * - PreventAccessFromCentralDomains middleware
             */
        }
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'school.active' => CheckSchoolActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (NotFoundHttpException $e, $request) {
            // API routes get JSON 404
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource not found',
                ], 404);
            }

            // Web routes get Inertia 404 page
            return Inertia::render('Errors/404', [
                'status' => 404,
                'message' => 'Page not found'
            ])
                ->toResponse($request)
                ->setStatusCode(404);
        });
    })
    ->create();