<?php

use App\Http\Middleware\CheckMadrasahSchool;
use App\Http\Middleware\CheckSchoolActive;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\SchoolAdminMiddleware;
use App\Http\Middleware\SuperAdminMiddleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
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
                'message' => 'Page not found',
            ])
                ->toResponse($request)
                ->setStatusCode(404);
        });

        // A TokenMismatchException is NOT an HttpException by class — but
        // Laravel's own Handler::prepareException() (Handler.php:673,
        // confirmed directly in vendor/laravel/framework) unconditionally
        // converts it into `new HttpException(419, $e->getMessage(), $e)`
        // BEFORE any render() callback ever runs — the exact same pattern
        // used for AuthorizationException -> AccessDeniedHttpException.
        // A callback typed `TokenMismatchException $e` would therefore
        // never match (verified empirically: it silently never fires,
        // falling through to Laravel's raw 419 response). We instead key
        // off the *converted* HttpException's status code here.
        //
        // The request that throws this exception never reaches
        // VerifyCsrfToken's own cookie-refresh code (it only runs in the
        // success branch of that middleware's handle() method — verified
        // in vendor/laravel/framework/.../VerifyCsrfToken.php:79-95), so
        // the client's XSRF-TOKEN cookie is never resynced by the framework
        // on this exact response. We fix that here by explicitly attaching
        // a freshly-constructed cookie using the *current*, still-valid
        // session token (no rotation) — mirroring
        // VerifyCsrfToken::newCookie()'s exact construction, so this
        // introduces no new security posture. Net effect: even a client
        // whose cookie was stale/evicted self-heals after one retry.
        $exceptions->render(function (HttpException $e, $request) {
            if ($e->getStatusCode() !== 419) {
                return null;
            }

            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your session expired. Please try again.',
                ], 419);
            }

            // This cookie's value must be PLAIN (unencrypted) here — do
            // not encrypt it by hand. Verified directly, live, against a
            // running server (not just by reading source): a render()
            // callback registered via $exceptions->render() is invoked
            // from Illuminate\Routing\Pipeline::handleException()
            // (Routing/Pipeline.php:36-51), which each pipeline "slice"
            // wraps in its own try/catch (Pipeline::carry(),
            // Pipeline.php:192-224) — so the exception thrown deep inside
            // ValidateCsrfToken is caught and converted into a Response
            // value THERE, which is then returned normally back out
            // through every outer middleware's own $next(...) call,
            // INCLUDING EncryptCookies::handle()'s
            // `return $this->encrypt($next(...));` (EncryptCookies.php:70).
            // EncryptCookies DOES still run its after-phase on this
            // response. An earlier version of this fix manually replicated
            // EncryptCookies::encrypt()'s transformation here, reasoning
            // from Kernel::handle()'s OUTER try/catch (which is only a
            // last-resort safety net for exceptions that escape the whole
            // pipeline, not the normal per-middleware path) — that
            // produced a double-encrypted cookie: EncryptCookies encrypted
            // the already-encrypted value a second time, and the client's
            // one-decrypt-pass retry failed identically to the original
            // bug. Confirmed by capturing a live 419 response's Set-Cookie
            // header and decrypting it server-side: the plain construction
            // below decrypts in exactly one pass to the real session
            // token, matching a genuinely pipeline-issued cookie.
            $config = config('session');

            $cookie = new Cookie(
                'XSRF-TOKEN',
                $request->session()->token(),
                time() + 60 * $config['lifetime'],
                $config['path'],
                $config['domain'],
                $config['secure'],
                false,
                false,
                $config['same_site'] ?? null,
                $config['partitioned'] ?? false
            );

            // 303 (not the default 302) forces the browser to always
            // follow this redirect as a safe GET — a 302 on a
            // PUT/PATCH/DELETE Inertia request is method-preserving per
            // fetch semantics, which would re-issue the original mutating
            // request against the back-URL instead of landing safely on
            // the form page.
            return redirect()->back(303)
                ->with('error', 'Your session expired. Please try again.')
                ->withCookie($cookie);
        });

        // Covers both a direct abort(403)/abort(429)/abort(502)/abort(503)
        // call (throws a plain HttpException with that status — confirmed
        // via Application::abort(), which only special-cases 404) and a
        // Policy/$this->authorize() failure (Laravel converts
        // AuthorizationException to AccessDeniedHttpException, an
        // HttpException subclass, before any render() callback runs).
        // Registered after NotFoundHttpException so a real 404 is still
        // claimed by the more specific handler first. Returning null for
        // any other status (including 500) lets dispatch fall through to
        // the Throwable catch-all below.
        $exceptions->render(function (HttpException $e, $request) {
            $status = $e->getStatusCode();

            $copy = match ($status) {
                403 => ['title' => 'Access Denied', 'message' => "You don't have permission to view this page.", 'showRetry' => false],
                429 => ['title' => 'Too Many Requests', 'message' => 'Please wait a moment and try again.', 'showRetry' => true],
                502 => ['title' => 'Service Temporarily Unavailable', 'message' => 'Something went wrong on our end. Please try again.', 'showRetry' => true],
                503 => ['title' => 'Service Temporarily Unavailable', 'message' => 'The application is temporarily unavailable. Please try again shortly.', 'showRetry' => true],
                default => null,
            };

            if ($copy === null) {
                return null;
            }

            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $copy['message'],
                ], $status);
            }

            return Inertia::render('Errors/GenericError', [
                'status' => $status,
                'title' => $copy['title'],
                'message' => $copy['message'],
                'showRetry' => $copy['showRetry'],
                'showDashboard' => true,
            ])
                ->toResponse($request)
                ->setStatusCode($status);
        });

        // Final catch-all for any uncaught Throwable (registered last,
        // since Throwable matches everything above too). Gated on
        // config('app.debug'): returning null when debug is on lets
        // dispatch fall through to Laravel's own default rendering, which
        // produces its normal debug page (stack trace, source context) —
        // this handler must never mask that during local development.
        // When debug is off, no stack trace or exception message is ever
        // exposed to the client.
        $exceptions->render(function (\Throwable $e, $request) {
            if (config('app.debug')) {
                return null;
            }

            // Laravel's Handler::render() dispatches to these render()
            // callbacks (via renderViaCallbacks()) BEFORE its own
            // match(true) block that specially handles these exception
            // types (Handler.php:600-628) — HttpResponseException,
            // AuthenticationException, and ValidationException all need
            // Laravel's own handling (redirect-back-with-errors, the
            // login redirect, etc.), not our generic 500 page. Symfony's
            // HttpExceptionInterface covers HttpException and its
            // subclasses (404/403/419/429/503/... — including anything
            // not already claimed by the more specific handlers above),
            // which Laravel's default handler also renders correctly on
            // its own.
            if ($e instanceof HttpExceptionInterface
                || $e instanceof ValidationException
                || $e instanceof AuthenticationException
                || $e instanceof HttpResponseException) {
                return null;
            }

            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Something went wrong. Please try again.',
                ], 500);
            }

            return Inertia::render('Errors/GenericError', [
                'status' => 500,
                'title' => 'Something Went Wrong',
                'message' => 'Something went wrong on our end. Please try again.',
                'showRetry' => true,
                'showDashboard' => true,
            ])
                ->toResponse($request)
                ->setStatusCode(500);
        });
    })
    ->create();
