<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\CheckSchoolActive;
use App\Http\Middleware\SuperAdminMiddleware;
use App\Http\Middleware\SchoolAdminMiddleware;
use App\Http\Middleware\CheckMadrasahSchool;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('web')
                ->group(base_path('routes/super-admin.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'school.active' => CheckSchoolActive::class,
            'super.admin' => SuperAdminMiddleware::class,
            'school.admin' => SchoolAdminMiddleware::class,
            'madrasah.only' => CheckMadrasahSchool::class,
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