<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\RoleMiddleware;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        using: function () {
            /**
             * CENTRAL ROUTES (API + WEB)
             * In local development, don't restrict by domain
             * In production, use central_domains config
             */
            
            // Central web routes - simple, no domain restriction in local
            Route::middleware('web')
                ->group(base_path('routes/web.php'));

            // Central API routes - NO domain restriction in local dev
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