# Cross-Platform Error Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **STANDING PROJECT RULE — no exceptions:** Do NOT run `git commit` or `git push` at any point while executing this plan, including the "Commit" steps written into each task below. Every task's "Commit" step is written for reference (what a normal TDD cycle would do) but must be treated as "stage the change and stop" — leave everything uncommitted for the user to review and commit themselves. This overrides the default `superpowers:executing-plans`/`superpowers:subagent-driven-development` behavior of committing after each task.

**Goal:** Give the application a real, in-app recovery path for every error category (419, 403, 429, 500, 502/503, a stale post-deploy JS chunk, a broken service-worker shell, an uncaught React exception) so a parent is never permanently stuck on a broken page.

**Architecture:** Laravel gets Inertia-aware exception rendering for every reachable error status; the frontend gets one shared one-shot reload-loop-protection utility (`recovery.js`) reused by a global Inertia `invalid` handler, a `vite:preloadError` handler, and the service worker's update-reload flow; the service worker gets a self-contained offline fallback (replacing its frozen-shell fallback) and a busy-gated auto-update flow, with its registration logic relocated from a classic `<script>` in Blade (which cannot reach the Inertia router or import ES modules) into `app.jsx`.

**Tech Stack:** Laravel 12 (PHP 8.2+), Inertia.js + React 18, Vite 7 (`laravel-vite-plugin` 2.1), Pest (PHP tests only — no JS test runner exists in this repo).

**Spec:** `docs/superpowers/specs/2026-08-24-cross-platform-error-recovery-architecture-design.md`

## Global Constraints

- Do NOT weaken CSRF/session security or disable security middleware.
- No blanket `window.location.reload()` for every error — every reload site must be named with its specific trigger and gated through `attemptRecovery()`.
- No infinite retry/reload behavior.
- Do NOT blindly disable caching — static hashed assets keep their existing cache-first strategy.
- Do NOT remove the service worker.
- No iOS-only / platform-conditional workaround anywhere.
- Do NOT hide genuine application errors — the 500 catch-all must never leak a stack trace in production, and must NOT intercept Laravel's own debug page when `APP_DEBUG=true`.
- Do NOT introduce a new JS test framework as a side effect of this work (none exists today — verified via `package.json`).
- Work incrementally; run relevant tests after each task.
- Leave everything uncommitted for the user to review (see banner above).

---

### Task 1: `recovery.js` — one-shot reload-loop protection

**Files:**
- Create: `resources/js/Utils/recovery.js`

**Interfaces:**
- Produces: `attemptRecovery(key: string): boolean` — pure, `sessionStorage`-only, no dependency on Inertia. `initRecoveryTracking(router): void` — wires a `navigate` listener onto the passed-in router object; called once from `app.jsx` (Task 6).

- [ ] **Step 1: Write the file**

```js
// resources/js/Utils/recovery.js
//
// One-shot reload-loop protection shared by every automatic-recovery
// action in the app (the global Inertia `invalid` handler, the
// `vite:preloadError` handler, and the service worker's update-reload
// flow). Each failure type gets its own key so one type's one-shot flag
// can't mask a different, unrelated failure later in the same session.
// All flags are cleared together on the next successful Inertia
// `navigate` event (fires on both a fresh document load/reload and an
// ordinary SPA visit — verified against @inertiajs/core@2.3.23 source,
// unlike `success` which only fires on SPA visits).

const PREFIX = 'recovery:';

export function attemptRecovery(key) {
    if (typeof sessionStorage === 'undefined') {
        return true;
    }

    const storageKey = PREFIX + key;

    if (sessionStorage.getItem(storageKey)) {
        return false;
    }

    sessionStorage.setItem(storageKey, '1');
    return true;
}

export function clearRecoveryFlags() {
    if (typeof sessionStorage === 'undefined') {
        return;
    }

    Object.keys(sessionStorage)
        .filter((key) => key.startsWith(PREFIX))
        .forEach((key) => sessionStorage.removeItem(key));
}

export function initRecoveryTracking(router) {
    router.on('navigate', () => {
        clearRecoveryFlags();
    });
}
```

- [ ] **Step 2: Verify with a throwaway Node check (no new test framework — ad hoc, not committed as a suite)**

Run:
```bash
node -e "
global.sessionStorage = (() => {
  const store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i],
  };
})();
global.Object.keys(global.sessionStorage); // sanity
import('./resources/js/Utils/recovery.js').then(({ attemptRecovery, clearRecoveryFlags }) => {
  console.assert(attemptRecovery('a') === true, 'first call for a new key must return true');
  console.assert(attemptRecovery('a') === false, 'second call for the same key must return false');
  console.assert(attemptRecovery('b') === true, 'a different key must be independent');
  clearRecoveryFlags();
  console.assert(attemptRecovery('a') === true, 'after clear, a must be recoverable again');
  console.log('recovery.js: all checks passed');
});
"
```
Expected output: `recovery.js: all checks passed` with no assertion failures printed.

Note: this file's `Object.keys(sessionStorage)` call inside `clearRecoveryFlags` relies on `sessionStorage` being enumerable like a plain object, which the real browser `Storage` object supports natively (`Object.keys(sessionStorage)` returns its keys) — the Node stub above only approximates this for the two functions actually exercised (`getItem`/`setItem`/`removeItem`); full confirmation of `clearRecoveryFlags`'s real-browser behavior happens in Task 6's browser checkpoint.

- [ ] **Step 3: Commit (STAGE ONLY — do not run `git commit`, see banner)**

```bash
git add resources/js/Utils/recovery.js
```

---

### Task 2: `appBusy.js` — per-tab busy-flag tracking

**Files:**
- Create: `resources/js/Utils/appBusy.js`

**Interfaces:**
- Produces: `markBusy(reason: string): void`, `clearBusy(reason: string): void`, `isBusy(): boolean` — pure in-memory `Set`, no external dependency. Consumed by `serviceWorker.js` (Task 7) and the three wizard files (Task 10).

- [ ] **Step 1: Write the file**

```js
// resources/js/Utils/appBusy.js
//
// Per-tab (in-memory only — not persisted, not shared across tabs)
// tracking of whether the user is mid-flow in a multi-step wizard that
// holds meaningful state only in memory (bulk import preview/confirm,
// invoice preview). Consulted by the service worker's update-reload
// flow so an automatic reload never discards an in-progress wizard.

const busyReasons = new Set();

export function markBusy(reason) {
    busyReasons.add(reason);
}

export function clearBusy(reason) {
    busyReasons.delete(reason);
}

export function isBusy() {
    return busyReasons.size > 0;
}
```

- [ ] **Step 2: Verify with a throwaway Node check**

Run:
```bash
node -e "
import('./resources/js/Utils/appBusy.js').then(({ markBusy, clearBusy, isBusy }) => {
  console.assert(isBusy() === false, 'starts idle');
  markBusy('a');
  console.assert(isBusy() === true, 'busy after markBusy');
  markBusy('b');
  clearBusy('a');
  console.assert(isBusy() === true, 'still busy while b is active');
  clearBusy('b');
  console.assert(isBusy() === false, 'idle once all reasons cleared');
  console.log('appBusy.js: all checks passed');
});
"
```
Expected output: `appBusy.js: all checks passed` with no assertion failures.

- [ ] **Step 3: Commit (STAGE ONLY)**

```bash
git add resources/js/Utils/appBusy.js
```

---

### Task 3: `Errors/GenericError.jsx` — shared error page

**Files:**
- Create: `resources/js/Pages/Errors/GenericError.jsx`

**Interfaces:**
- Consumes: `@inertiajs/react`'s `Head`, `Link`, `router`; `lucide-react` icons — same imports `404.jsx` already uses.
- Produces: a default-exported React component accepting props `{ status, title, message, showRetry = true, showDashboard = true }`. Rendered server-side via `Inertia::render('Errors/GenericError', [...])` from Task 4.

- [ ] **Step 1: Write the file**, matching `resources/js/Pages/Errors/404.jsx`'s existing visual pattern (verified: same gradient background, same icon-circle/button layout) so it looks native to the app rather than a bolted-on generic error screen:

```jsx
import { Link, router, Head } from '@inertiajs/react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default function GenericError({ status, title, message, showRetry = true, showDashboard = true }) {
    return (
        <>
            <Head title={`${status} - ${title}`} />

            <div className="min-h-screen bg-gradient-to-br from-[#0b1a34] to-[#1a2f5a] flex items-center justify-center px-4">
                <div className="max-w-2xl w-full text-center">
                    <div className="flex justify-center mb-8">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                            <AlertTriangle className="w-14 h-14 text-[#0b1a34]" />
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-9xl font-bold text-white mb-4 tracking-tight">
                            {status}
                        </h1>
                        <div className="h-1 w-32 bg-orange mx-auto mb-6 rounded-full"></div>
                        <h2 className="text-3xl font-semibold text-white mb-4">
                            {title}
                        </h2>
                        <p className="text-xl text-gray-300 mb-2">
                            {message}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
                        {showRetry && (
                            <button
                                onClick={() => router.reload()}
                                className="inline-flex items-center px-6 py-3 bg-white text-[#0b1a34] font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Try Again
                            </button>
                        )}

                        {showDashboard && (
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center px-6 py-3 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <Home className="w-5 h-5 mr-2" />
                                Go to Dashboard
                            </Link>
                        )}
                    </div>

                    <div className="mt-16">
                        <p className="text-sm text-gray-400">
                            © {new Date().getFullYear()} School Management System. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
```

- [ ] **Step 2: Verification deferred** — a bare React page component can't be meaningfully checked outside a browser; verified visually in Task 6's browser checkpoint once `bootstrap/app.php` (Task 4) can actually route to it.

- [ ] **Step 3: Commit (STAGE ONLY)**

```bash
git add resources/js/Pages/Errors/GenericError.jsx
```

---

### Task 4: Laravel exception handling — 419, 403, 429, 502/503, 500

**Files:**
- Modify: `bootstrap/app.php`
- Test: `tests/Feature/ErrorHandlingArchitectureTest.php` (new)

**Interfaces:**
- Consumes: `resources/js/Pages/Errors/GenericError.jsx` (Task 3) by string reference (`Inertia::render('Errors/GenericError', ...)` — no compile-time dependency, but the frontend must exist for the rendered page to actually work when visited in a browser).
- Produces: nothing consumed by other tasks — this is a leaf in the dependency graph (independent of Tasks 1-3, 5-13). Can be implemented in parallel with those if using subagent-driven-development.

**Exact exception dispatch semantics — verified directly against `vendor/laravel/framework`, not assumed:**
- `Handler::renderViaCallbacks()` (`Exceptions/Handler.php:712-725`) iterates registered `render()` callbacks **in registration order** and, for each, checks `is_a($exception, $firstParameterType)` (matches the exact type **or any subclass**) — first callback whose check passes AND returns a non-`null` response wins; if a matching callback returns `null`, the loop **continues** to the next registered callback.
- `AuthorizationException` (from Policy/`$this->authorize()` failures) is converted to `AccessDeniedHttpException` by Laravel's `prepareException()` **before** any registered callback runs (`Handler.php:672`) — so a single `HttpException $e` handler correctly catches both a Policy-authorization failure (via the `AccessDeniedHttpException` subclass) and a direct `abort(403)` call (which throws a plain `HttpException` with status 403 — confirmed via `Application::abort()`, `Foundation/Application.php:1420-1427`, which only special-cases 404).
- `ThrottleRequestsException extends TooManyRequestsHttpException extends HttpException` (confirmed) — status 429, also caught by the same generic `HttpException $e` handler.
- `TokenMismatchException extends \Exception` (confirmed, `Illuminate\Session\TokenMismatchException`) — **not** an `HttpException` at all; needs its own dedicated handler, unaffected by ordering relative to the `HttpException` handler.
- The existing `NotFoundHttpException` handler (also an `HttpException` subclass, for 404) is already registered **first** — this must stay first, since a `NotFoundHttpException` would otherwise also match a generic `HttpException $e` handler registered before it.
- Registration order in this task, appended after the existing 404 handler: `TokenMismatchException` → `HttpException` (403/429/502/503 via `match($e->getStatusCode())`, `default => null` so anything else — including a direct `abort(500)`, which is also an `HttpException` — falls through) → `Throwable` (final catch-all, must be registered **last**, since it matches everything).

- [ ] **Step 1: Write the failing tests**

```php
<?php
// tests/Feature/ErrorHandlingArchitectureTest.php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ErrorHandlingArchitectureTest extends TestCase
{
    use RefreshDatabase;

    public function test_token_mismatch_redirects_back_with_flash_message_and_fresh_csrf_cookie(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::post('/__test/419-trigger', function () {
            throw new \Illuminate\Session\TokenMismatchException('CSRF token mismatch.');
        })->middleware('web');

        $response = $this->actingAs($user)->from('/dashboard')->post('/__test/419-trigger');

        $response->assertRedirect('/dashboard');
        $response->assertSessionHas('message', 'Your session expired. Please try again.');
        $response->assertCookie('XSRF-TOKEN');
    }

    public function test_abort_403_renders_generic_error_page_with_no_retry_action(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/403-trigger', function () {
            abort(403);
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/403-trigger');

        $response->assertStatus(403);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 403)
            ->where('showRetry', false)
        );
    }

    public function test_throttle_requests_renders_generic_error_page_with_retry_action(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/429-trigger', function () {
            throw new \Illuminate\Http\Exceptions\ThrottleRequestsException('Too many attempts.');
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/429-trigger');

        $response->assertStatus(429);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 429)
            ->where('showRetry', true)
        );
    }

    public function test_service_unavailable_renders_generic_error_page_with_retry_action(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/503-trigger', function () {
            abort(503);
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/503-trigger');

        $response->assertStatus(503);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 503)
        );
    }

    public function test_uncaught_exception_renders_generic_error_page_without_leaking_details_when_debug_is_off(): void
    {
        $this->withoutVite();
        config(['app.debug' => false]);

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/500-trigger', function () {
            throw new \RuntimeException('a secret internal detail that must never reach the client');
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/500-trigger');

        $response->assertStatus(500);
        $response->assertInertia(fn ($page) => $page
            ->component('Errors/GenericError')
            ->where('status', 500)
        );
        $response->assertDontSee('a secret internal detail that must never reach the client');
    }

    public function test_uncaught_exception_does_not_intercept_laravels_debug_page_when_debug_is_on(): void
    {
        $this->withoutVite();
        config(['app.debug' => true]);

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        Route::get('/__test/500-debug-trigger', function () {
            throw new \RuntimeException('a debug-mode marker string');
        })->middleware('web');

        $response = $this->actingAs($user)->get('/__test/500-debug-trigger');

        $response->assertStatus(500);
        // In debug mode Laravel's default renderer produces its own debug
        // page (not our Inertia GenericError component) and DOES include
        // the exception message — proving our handler stepped aside.
        $response->assertSee('a debug-mode marker string', escape: false);
    }

    public function test_404_handling_is_unchanged(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $response = $this->actingAs($user)->get('/this-route-does-not-exist');

        $response->assertStatus(404);
        $response->assertInertia(fn ($page) => $page->component('Errors/404'));
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `php8.4 artisan test --filter=ErrorHandlingArchitectureTest`
Expected: FAIL — the `/__test/*` routes don't exist yet (404 instead of the expected status), and even once routing is added, the 419/403/429/503/500 assertions fail because `bootstrap/app.php` has no handling for these exception types yet, so they'd currently hit Laravel's bare framework pages instead of `Errors/GenericError`.

- [ ] **Step 3: Write the minimal implementation**

Replace the `->withExceptions(...)` block in `bootstrap/app.php`:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\CheckSchoolActive;
use App\Http\Middleware\SuperAdminMiddleware;
use App\Http\Middleware\SchoolAdminMiddleware;
use App\Http\Middleware\CheckMadrasahSchool;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Cookie;
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

        // A TokenMismatchException (419) is NOT an HttpException — it needs
        // its own handler regardless of the HttpException handler below.
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
        $exceptions->render(function (TokenMismatchException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your session expired. Please try again.',
                ], 419);
            }

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

            return redirect()->back()
                ->with('message', 'Your session expired. Please try again.')
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `php8.4 artisan test --filter=ErrorHandlingArchitectureTest`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Run the full existing suite to check for regressions**

Run: `php8.4 artisan test`
Expected: no *new* failures relative to a baseline run before this task (this codebase has pre-existing unrelated failures from missing factories — confirmed in an earlier session; compare counts, don't assume zero).

- [ ] **Step 6: Commit (STAGE ONLY)**

```bash
git add bootstrap/app.php tests/Feature/ErrorHandlingArchitectureTest.php
```

---

### Task 5: `ErrorBoundary.jsx` — top-level React crash boundary

**Files:**
- Create: `resources/js/Components/ErrorBoundary.jsx`

**Interfaces:**
- Produces: default-exported class component `ErrorBoundary`, wraps `children`. Consumed by `app.jsx` (Task 6).

- [ ] **Step 1: Write the file**

```jsx
// resources/js/Components/ErrorBoundary.jsx
//
// Last line of defense for an uncaught React render exception. Uses a
// hard window.location.reload() / window.location.href on its actions
// (not a soft Inertia router call) because a caught render error means
// the in-memory React tree/state is already corrupted — a soft retry
// would re-render the same broken state.

import { Component } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // eslint-disable-next-line no-console
        console.error('ErrorBoundary caught a render error:', error, info);
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0b1a34] to-[#1a2f5a] flex items-center justify-center px-4">
                <div className="max-w-2xl w-full text-center">
                    <div className="flex justify-center mb-8">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                            <AlertTriangle className="w-14 h-14 text-[#0b1a34]" />
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-semibold text-white mb-4">
                            Something Went Wrong
                        </h2>
                        <p className="text-xl text-gray-300 mb-2">
                            The application ran into a problem. Reloading usually fixes this.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center px-6 py-3 bg-white text-[#0b1a34] font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Reload
                        </button>

                        <a
                            href="/dashboard"
                            className="inline-flex items-center px-6 py-3 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <Home className="w-5 h-5 mr-2" />
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
```

- [ ] **Step 2: Verification deferred to Task 6's browser checkpoint** (a class component's `componentDidCatch` can't be meaningfully exercised outside a real render tree).

- [ ] **Step 3: Commit (STAGE ONLY)**

```bash
git add resources/js/Components/ErrorBoundary.jsx
```

---

### Task 6: Wire `app.jsx` — ErrorBoundary, `invalid` handler, `vite:preloadError` handler, recovery tracking

**Files:**
- Modify: `resources/js/app.jsx`

**Interfaces:**
- Consumes: `attemptRecovery`, `initRecoveryTracking` from `resources/js/Utils/recovery.js` (Task 1); `ErrorBoundary` from `resources/js/Components/ErrorBoundary.jsx` (Task 5).
- Produces: nothing new consumed by later tasks — but this is the integration point where Tasks 1, 3, 5 first become reachable in a running app, so it's also where their browser verification happens.

**Current file content (for exact context):**
```jsx
import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

import { AnimatePresence } from "framer-motion";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: "#4B5563",
    },
});
```

- [ ] **Step 1: Replace the file's full content**

```jsx
import "../css/app.css";
import "./bootstrap";

import { createInertiaApp, router } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

import { AnimatePresence } from "framer-motion";

import ErrorBoundary from "./Components/ErrorBoundary";
import { attemptRecovery, initRecoveryTracking } from "./Utils/recovery";
import { initServiceWorker } from "./Utils/serviceWorker";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

initRecoveryTracking(router);
initServiceWorker(router);

// Defense-in-depth for a genuinely non-Inertia response (a network-level
// failure, an unexpected proxy page) — Section 1's Laravel changes make
// this rare, but it's kept as a fallback rather than leaving Inertia's
// default dismiss-only iframe modal in place.
document.addEventListener("inertia:invalid", (event) => {
    event.preventDefault();

    if (attemptRecovery("invalid")) {
        router.reload();
    } else {
        window.__inertiaRecoveryFallback = true;
        document.body.innerHTML =
            '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0b1a34,#1a2f5a);padding:1rem;font-family:system-ui,sans-serif;">' +
            '<div style="max-width:32rem;text-align:center;color:white;">' +
            '<h2 style="font-size:1.5rem;font-weight:600;margin-bottom:1rem;">Something went wrong</h2>' +
            '<p style="color:#d1d5db;margin-bottom:2rem;">Please try again.</p>' +
            '<div style="display:flex;gap:1rem;justify-content:center;">' +
            '<button onclick="window.location.reload()" style="padding:0.75rem 1.5rem;background:white;color:#0b1a34;font-weight:600;border-radius:0.5rem;border:none;cursor:pointer;">Try Again</button>' +
            '<a href="/dashboard" style="padding:0.75rem 1.5rem;background:#ff6b35;color:white;font-weight:600;border-radius:0.5rem;text-decoration:none;">Go to Dashboard</a>' +
            "</div></div></div>";
    }
});

// A stale tab (still running an old JS module graph after a deploy,
// because the service worker's clients.claim() claims it with no
// busy-check) can hit a since-deleted hashed chunk when Inertia
// dynamically imports a page component it hasn't loaded yet. Vite's
// production preload helper dispatches this cancelable event and
// re-throws unless we call preventDefault() — verified directly against
// the installed vite@7.3.3 package's build-output source.
window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();

    if (attemptRecovery("preload-error")) {
        window.location.reload();
        return;
    }

    // Second occurrence this session — a persistent problem, not a
    // one-off deploy-window race. Don't loop; render a minimal fallback
    // that doesn't depend on React/Inertia being functional, since
    // that's precisely what's in question here.
    document.body.innerHTML =
        '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0b1a34,#1a2f5a);padding:1rem;font-family:system-ui,sans-serif;">' +
        '<div style="max-width:32rem;text-align:center;color:white;">' +
        '<h2 style="font-size:1.5rem;font-weight:600;margin-bottom:1rem;">Something went wrong loading this page</h2>' +
        '<p style="color:#d1d5db;margin-bottom:2rem;">Please reload the page.</p>' +
        '<button onclick="window.location.reload()" style="padding:0.75rem 1.5rem;background:white;color:#0b1a34;font-weight:600;border-radius:0.5rem;border:none;cursor:pointer;">Reload</button>' +
        "</div></div>";
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ErrorBoundary>
                <App {...props} />
            </ErrorBoundary>
        );
    },
    progress: {
        color: "#4B5563",
    },
});
```

Note: `initServiceWorker` is imported here but not defined until Task 7 — this task's dev-server/build verification (Step 2 below) will fail on that import until Task 7 lands. If executing tasks in strict order, do Task 7 immediately after this one before attempting Step 2; if using subagent-driven-development with parallel tasks, land Task 7 first or treat Tasks 6+7 as one reviewable unit.

- [ ] **Step 2: Browser verification checkpoint (after Task 7 also lands)**

Start a local dev server (`php8.4 artisan serve` + `npm run dev`, or the project's `composer dev`), then using `agent-browser`:
1. Open the app, log in as an existing test user.
2. Confirm the page loads with no console errors related to `ErrorBoundary`, `recovery.js`, or `serviceWorker.js` imports.
3. Trigger a 403 via a route you don't have permission for — confirm `GenericError.jsx` renders with "Access Denied" and no retry button, styled consistently with `404.jsx`.
4. Trigger a 500 (a temporary test route, or an existing bug if one is reachable) — confirm `GenericError.jsx` renders with a working "Try Again" button.

Expected: all four checks pass, with real output captured (not asserted from code reading).

- [ ] **Step 3: Commit (STAGE ONLY)**

```bash
git add resources/js/app.jsx
```

---

### Task 7: `serviceWorker.js` — registration, update-on-navigate, busy-gated reload

**Files:**
- Create: `resources/js/Utils/serviceWorker.js`

**Interfaces:**
- Consumes: `attemptRecovery` from `resources/js/Utils/recovery.js` (Task 1); `isBusy` from `resources/js/Utils/appBusy.js` (Task 2).
- Produces: `initServiceWorker(router): void`. Consumed by `app.jsx` (Task 6).

**Current registration logic lives inline in `resources/views/app.blade.php` (lines 37-112) as a classic, non-module `<script>` tag** — verified it has no `type="module"` attribute and that `window.router`/`window.Inertia` are never exposed anywhere in this app, so it cannot reach the Inertia router or `import` an ES module. This task relocates that logic (banner DOM code included, unchanged) into a proper module and extends it with the update-on-navigate and busy-gated-reload behavior. Task 9 removes the now-dead Blade script.

- [ ] **Step 1: Write the file**

```js
// resources/js/Utils/serviceWorker.js
//
// Service worker registration and update lifecycle. Relocated here from
// a classic <script> in app.blade.php, which could not reach the
// Inertia router or import ES modules (recovery.js/appBusy.js) — see
// the design doc's Section 3 for the verification behind that move.
//
// Update activation and the resulting reload are deliberately two
// independently-gated steps: clients.claim() affects every tab on the
// origin at once when a new worker activates, so gating the activation
// trigger on one tab's busy state would not protect a *different* tab
// that happens to be mid-wizard. Instead: any tab may trigger
// activation; each tab's own controllerchange listener decides for
// itself whether *it* is safe to reload right now.

import { attemptRecovery } from './recovery';
import { isBusy } from './appBusy';

function showUpdateBanner(registration) {
    const banner = document.createElement('div');
    banner.className = 'fixed bottom-4 right-4 text-white px-6 py-4 rounded-lg shadow-2xl z-50 max-w-sm border border-orange-500';
    banner.style.background = 'linear-gradient(135deg, #0b1a34 0%, #1e3a5f 100%)';
    banner.innerHTML = `
        <div class="flex items-center justify-between gap-4">
            <div>
                <p class="font-semibold mb-1 text-orange-500">Update Available!</p>
                <p class="text-sm text-gray-300">A new version of SchoolMS is ready.</p>
            </div>
            <button
                class="update-btn bg-orange-500 text-white px-4 py-2 rounded font-medium hover:bg-orange-600 transition-colors"
                style="background-color: #ff6b35;"
            >
                Update
            </button>
        </div>
    `;

    banner.querySelector('.update-btn').addEventListener('click', () => {
        if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        banner.remove();
    });

    document.body.appendChild(banner);
}

function tryReload() {
    if (isBusy()) {
        // Defer — this tab keeps running its current code until its own
        // next natural navigation, at which point the already-active new
        // worker controls it anyway. Re-check shortly rather than never.
        setTimeout(tryReload, 5000);
        return;
    }

    if (attemptRecovery('sw-update')) {
        window.location.reload();
    }
}

export function initServiceWorker(router) {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) {
            return;
        }
        refreshing = true;
        tryReload();
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                router.on('navigate', () => {
                    registration.update();
                });

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateBanner(registration);

                            // Any tab may auto-post SKIP_WAITING — no
                            // busy-check here (see module docblock).
                            registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.error('Service Worker registration failed:', error);
            });
    });
}
```

- [ ] **Step 2: Verification deferred to Task 9's browser checkpoint** (registration, activation, and `controllerchange` all require a real browser and a real `sw.js`, which Task 8 changes).

- [ ] **Step 3: Commit (STAGE ONLY)**

```bash
git add resources/js/Utils/serviceWorker.js
```

---

### Task 8: `public/sw.js` — offline fallback, narrowed `DYNAMIC_CACHE`, auto-install

**Files:**
- Modify: `public/sw.js`

**Interfaces:**
- No JS-module interface (this file is not part of the Vite bundle) — its only interaction with other tasks is behavioral, via the `controllerchange` event `serviceWorker.js` (Task 7) listens for.

**Current file** (for exact context — see repo at `public/sw.js`, 167 lines): the existing `install`/`activate`/`fetch` handlers, `CACHE_NAME`/`STATIC_CACHE`/`DYNAMIC_CACHE`/`IMAGE_CACHE` constants (all version-namespaced via `__CACHE_VERSION__`, bumped by `scripts/update-sw-version.sh` post-build — unchanged, still sound), and the cache-first strategy for static assets (unchanged, already correct).

- [ ] **Step 1: Replace the file's full content**

```js
const CACHE_NAME = 'schoolms-__CACHE_VERSION__';
const STATIC_CACHE = 'schoolms-static-__CACHE_VERSION__';
const DYNAMIC_CACHE = 'schoolms-dynamic-__CACHE_VERSION__';
const IMAGE_CACHE = 'schoolms-images-__CACHE_VERSION__';
const OFFLINE_URL = '/offline.html';

// Core files to cache immediately, including the minimal, fully
// self-contained offline fallback page (no external JS/CSS/image
// references) served on a navigation-mode fetch failure instead of a
// frozen app shell whose hashed asset references may have already been
// deleted by a later deploy.
const urlsToCache = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  '/images/icon-72x72.png',
  '/images/icon-96x96.png',
  '/images/icon-128x128.png',
  '/images/icon-144x144.png',
  '/images/icon-152x152.png',
  '/images/icon-384x384.png',
];

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache addAll failed:', error);
      })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Helper function to determine cache strategy
function getCacheName(url) {
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    return IMAGE_CACHE;
  }
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
    return STATIC_CACHE;
  }
  return DYNAMIC_CACHE;
}

// Fetch strategy with intelligent caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for:
  // 1. Non-GET requests
  // 2. Chrome extensions
  // 3. Different origins (except fonts)
  if (
    request.method !== 'GET' ||
    url.protocol === 'chrome-extension:' ||
    (url.origin !== self.location.origin && !url.pathname.match(/\.(woff|woff2|ttf|eot)$/))
  ) {
    return;
  }

  // Cache-first strategy for static assets (images, fonts, CSS, JS)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|js|css|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          const cacheName = getCacheName(url);

          caches.open(cacheName).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
    );
    return;
  }

  // Network-first strategy for dynamic HTML/API calls. Navigation-mode
  // requests are never written to DYNAMIC_CACHE or replayed from it on
  // failure — an authenticated Inertia page cached here could be shown
  // to a parent as if it were live, stale data. Non-navigation dynamic
  // GETs (the existing component-local data-fetch pattern this app
  // already uses) keep the prior behavior, which the audit confirmed
  // already works correctly.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        if (request.mode !== 'navigate' && !url.pathname.match(/\/(login|logout|csrf-token)/)) {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }

        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return new Response('Offline - content not available', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});
```

- [ ] **Step 2: Create the offline fallback page it now precaches**

Create `public/offline.html`:

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>You're Offline - SchoolMS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0b1a34 0%, #1a2f5a 100%);
            padding: 1rem;
        }
        .card { max-width: 28rem; text-align: center; color: white; }
        h1 { font-size: 1.75rem; font-weight: 600; margin-bottom: 1rem; }
        p { color: #d1d5db; margin-bottom: 2rem; }
        button {
            padding: 0.75rem 1.5rem;
            background: white;
            color: #0b1a34;
            font-weight: 600;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>You're Offline</h1>
        <p>Check your internet connection and try again.</p>
        <button onclick="window.location.reload()">Try Again</button>
    </div>
</body>
</html>
```

- [ ] **Step 3: Verification deferred to Task 9's browser checkpoint** (a service worker's install/activate/fetch lifecycle requires a real browser).

- [ ] **Step 4: Commit (STAGE ONLY)**

```bash
git add public/sw.js public/offline.html
```

---

### Task 9: Remove the inline SW-registration script from `app.blade.php`

**Files:**
- Modify: `resources/views/app.blade.php`

**Interfaces:**
- No new interface — pure removal, relies on `app.jsx` (Task 6) now calling `initServiceWorker()` (Task 7) instead.

**Current file content, lines 36-112 (the block being removed):**
```html
    <!-- Register Service Worker -->
    <script>
        if ('serviceWorker' in navigator) {
            let refreshing = false;

            // Detect controller change and refresh the page
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });

            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('✅ Service Worker registered:', registration);

                        // Check for updates every hour
                        setInterval(() => {
                            registration.update();
                        }, 60 * 60 * 1000);

                        // Listen for waiting service worker
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;

                            newWorker.addEventListener('statechange', () => {
                                if (
                                    newWorker.state === 'installed' &&
                                    navigator.serviceWorker.controller
                                ) {
                                    // New service worker available
                                    showUpdateNotification(registration);
                                }
                            });
                        });
                    })
                    .catch((error) => {
                        console.error('❌ Service Worker registration failed:', error);
                    });
            });

            // Show update notification banner
            function showUpdateNotification(registration) {
                const banner = document.createElement('div');
                banner.className = 'fixed bottom-4 right-4 text-white px-6 py-4 rounded-lg shadow-2xl z-50 max-w-sm border border-orange-500';
                banner.style.background = 'linear-gradient(135deg, #0b1a34 0%, #1e3a5f 100%)';
                banner.innerHTML = `
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <p class="font-semibold mb-1 text-orange-500">Update Available!</p>
                            <p class="text-sm text-gray-300">A new version of SchoolMS is ready.</p>
                        </div>
                        <button
                            onclick="this.parentElement.parentElement.querySelector('.update-btn').click()"
                            class="update-btn bg-orange-500 text-white px-4 py-2 rounded font-medium hover:bg-orange-600 transition-colors"
                            style="background-color: #ff6b35;"
                        >
                            Update
                        </button>
                    </div>
                `;

                banner.querySelector('.update-btn').addEventListener('click', () => {
                    if (registration.waiting) {
                        // Tell the waiting service worker to take over
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                    banner.remove();
                });

                document.body.appendChild(banner);
            }
        }
    </script>
```

- [ ] **Step 1: Delete that entire `<script>` block**, leaving `app.blade.php`'s `<head>` ending at `@inertiaHead` (the line immediately before it) and flowing straight into `<body class="font-sans antialiased">`.

- [ ] **Step 2: Browser verification checkpoint — the full SW flow, end to end**

Using `agent-browser` against a locally running instance (`composer dev` or equivalent, with `npm run build` run at least once so `public/sw.js` has a real `__CACHE_VERSION__` substituted):
1. Load the app fresh, confirm dev tools show the service worker registering successfully (no console errors about `registration.update is not a function` or similar from the removed inline script being gone).
2. Confirm navigating between pages triggers `registration.update()` calls (visible in the Application/Service Workers panel or via a temporary `console.log` if needed for this check only).
3. Simulate an update: bump `__CACHE_VERSION__`'s substituted value manually in a copy of `sw.js` (or re-run `bash scripts/update-sw-version.sh` after a trivial change), reload, confirm the update banner appears AND that the page auto-reloads via `controllerchange` shortly after (since no wizard is active, `isBusy()` is false).
4. Open a bulk-import wizard (Task 10), reach the preview step, then trigger another SW update in a background sense (or verify via code that `isBusy()` returns `true` while in that step, since a live cross-tab update race is hard to force deterministically) — confirm the reload is deferred rather than firing immediately and discarding the preview.
5. Go offline (DevTools network throttling → offline) and attempt a navigation — confirm the minimal `offline.html` renders instead of a broken/blank page.

Expected: all five checks pass with real observed behavior, not inferred from code. Record which of these were verified via automated inspection vs. visual confirmation in the final report.

- [ ] **Step 3: Commit (STAGE ONLY)**

```bash
git add resources/views/app.blade.php
```

---

### Task 10: Wire `appBusy.js` into the three wizard flows

**Files:**
- Modify: `resources/js/Components/Students/StudentImportModal.jsx`
- Modify: `resources/js/Components/Guardians/GuardianImportModal.jsx`
- Modify: `resources/js/Pages/Fees/Invoices/Create.jsx`

**Interfaces:**
- Consumes: `markBusy`, `clearBusy` from `resources/js/Utils/appBusy.js` (Task 2).

Uses a `useEffect` + cleanup-function pattern rather than scattering `markBusy`/`clearBusy` calls at every state-transition site — the effect's cleanup runs automatically on every exit path (step change away from the busy window, or the component unmounting when the modal closes), so no exit path can be missed.

- [ ] **Step 1: `StudentImportModal.jsx`** — add the import and effect (verified exact current content: `import` block ends at line 5, `const [uploadErrors, setUploadErrors] = useState([]);` is line 21, followed by `const fileInputRef = useRef(null);` at line 22):

```jsx
// change:
import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

// to:
import { Fragment, useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { markBusy, clearBusy } from '@/Utils/appBusy';
```

```jsx
// change:
    const [previewRows, setPreviewRows] = useState([]);
    const [uploadErrors, setUploadErrors] = useState([]);
    const fileInputRef = useRef(null);

// to:
    const [previewRows, setPreviewRows] = useState([]);
    const [uploadErrors, setUploadErrors] = useState([]);
    const fileInputRef = useRef(null);

    // Protects this in-progress import preview from being silently
    // discarded by an automatic service-worker-triggered reload.
    useEffect(() => {
        if (step === 'preview' || step === 'importing') {
            markBusy('bulk-import-students');
            return () => clearBusy('bulk-import-students');
        }
    }, [step]);
```

- [ ] **Step 2: `GuardianImportModal.jsx`** — identical pattern (verified: byte-for-byte structural mirror of `StudentImportModal.jsx`, same line numbers):

```jsx
// change:
import { Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

// to:
import { Fragment, useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { markBusy, clearBusy } from '@/Utils/appBusy';
```

```jsx
// change:
    const [previewRows, setPreviewRows] = useState([]);
    const [uploadErrors, setUploadErrors] = useState([]);
    const fileInputRef = useRef(null);

// to:
    const [previewRows, setPreviewRows] = useState([]);
    const [uploadErrors, setUploadErrors] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (step === 'preview' || step === 'importing') {
            markBusy('bulk-import-guardians');
            return () => clearBusy('bulk-import-guardians');
        }
    }, [step]);
```

- [ ] **Step 3: `Fees/Invoices/Create.jsx`** — busy window tied to `showPreview` instead of a `step` enum (verified exact current content: imports end line 6, `const [showPreview, setShowPreview] = useState(false);` is line 18, followed by a blank line then `const handleSubmit` at line 20):

```jsx
// change:
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { ArrowLeft, AlertCircle, Check, ChevronDown, Receipt, Plus, Eye, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

// to:
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { ArrowLeft, AlertCircle, Check, ChevronDown, Receipt, Plus, Eye, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { markBusy, clearBusy } from '@/Utils/appBusy';
```

```jsx
// change:
    const [guardianQuery, setGuardianQuery] = useState('');
    const [preview, setPreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const handleSubmit = (e) => {

// to:
    const [guardianQuery, setGuardianQuery] = useState('');
    const [preview, setPreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Protects this in-progress invoice preview from being silently
    // discarded by an automatic service-worker-triggered reload.
    useEffect(() => {
        if (showPreview) {
            markBusy('invoice-preview');
            return () => clearBusy('invoice-preview');
        }
    }, [showPreview]);

    const handleSubmit = (e) => {
```

- [ ] **Step 4: Verification deferred to Task 9's Step 2, item 4** (already covers driving one of these wizards to its preview step and confirming a deferred reload).

- [ ] **Step 5: Commit (STAGE ONLY)**

```bash
git add resources/js/Components/Students/StudentImportModal.jsx resources/js/Components/Guardians/GuardianImportModal.jsx resources/js/Pages/Fees/Invoices/Create.jsx
```

---

### Task 11: Fix the two missing `.catch()` sites in `Blueprints/Index.jsx` and `Show.jsx`

**Files:**
- Modify: `resources/js/Pages/Blueprints/Index.jsx`
- Modify: `resources/js/Pages/Blueprints/Show.jsx`

**Interfaces:** none — self-contained, no dependency on any other task.

- [ ] **Step 1: `Blueprints/Index.jsx`** — two call sites missing `.catch()`, verified at lines 67-74 and 95-102:

```jsx
// change (first occurrence, inside handleGeneratePeriods' onFinish):
                        fetch(`/blueprints/${id}/generation-status`)
                            .then(res => res.json())
                            .then(data => {
                                setGenerationStatus(prev => ({
                                    ...prev,
                                    [id]: data
                                }));
                            });

// to:
                        fetch(`/blueprints/${id}/generation-status`)
                            .then(res => res.json())
                            .then(data => {
                                setGenerationStatus(prev => ({
                                    ...prev,
                                    [id]: data
                                }));
                            })
                            .catch(err => console.error('Failed to refresh generation status:', err));
```

This exact code block appears twice in the file (`handleGeneratePeriods` and `handleRegeneratePeriods`) — apply the same `.catch()` addition to both occurrences.

- [ ] **Step 2: `Blueprints/Show.jsx`** — two call sites missing `.catch()`, verified at lines 40-42 and 63-65:

```jsx
// change (first occurrence, inside handleGeneratePeriods' onFinish):
                        fetch(`/blueprints/${blueprint.id}/generation-status`)
                            .then(res => res.json())
                            .then(data => setGenerationStatus(data));

// to:
                        fetch(`/blueprints/${blueprint.id}/generation-status`)
                            .then(res => res.json())
                            .then(data => setGenerationStatus(data))
                            .catch(err => console.error('Failed to refresh generation status:', err));
```

This exact code block appears twice in the file (`handleGeneratePeriods` and `handleRegeneratePeriods`) — apply the same `.catch()` addition to both occurrences.

- [ ] **Step 3: Verify no syntax errors**

Run: `npx vite build --mode development 2>&1 | tail -30` (or the project's `npm run build`) and confirm it completes without a syntax error referencing either file. A full successful production build isn't required to catch a syntax mistake — a parse failure in either file will surface immediately.

- [ ] **Step 4: Commit (STAGE ONLY)**

```bash
git add resources/js/Pages/Blueprints/Index.jsx resources/js/Pages/Blueprints/Show.jsx
```

---

### Task 12: Full regression pass

**Files:** none new — this task only runs verification across everything above.

- [ ] **Step 1: Full Pest suite**

Run: `php8.4 artisan test`
Expected: the 7 new `ErrorHandlingArchitectureTest` tests pass; no new failures relative to the pre-existing baseline (compare counts — this repo has known unrelated pre-existing failures from missing factories, confirmed in an earlier session).

- [ ] **Step 2: Pint**

Run: `./vendor/bin/pint --test`
Expected: no style violations in `bootstrap/app.php` or `tests/Feature/ErrorHandlingArchitectureTest.php`. If violations are reported, run `./vendor/bin/pint` (without `--test`) to fix, then re-run `--test`.

- [ ] **Step 3: Production build**

Run: `npm run build` (triggers `postbuild` → `scripts/update-sw-version.sh`, substituting a real `__CACHE_VERSION__` into `public/sw.js`)
Expected: exits 0, no errors referencing any file touched in this plan.

- [ ] **Step 4: Full end-to-end browser pass via `agent-browser`**, against the production-built app served locally, covering the "Verification requirements" scenario from the design doc: trigger 419 (submit a form with a deliberately stale/cleared CSRF cookie), trigger 403, trigger 500, go offline mid-navigation, and confirm a second attempt at each doesn't loop (no more than one automatic recovery action per failure type per session).

Expected: all pass with real captured evidence. Write up which of Task 9's and this task's checks were run, and explicitly separate "verified in this sandboxed headless-Chrome environment" from "not verified on real iOS/Android/iPad hardware" in the final report, per the design doc's testing-strategy section.

- [ ] **Step 5: Do NOT commit** — leave the full working tree as-is (staged or unstaged per each task's own step) for the user's review, per the standing project rule at the top of this document.

---

## Self-review notes (from writing this plan)

- **Spec coverage:** every file in the spec's Section 6 manifest has a task (Tasks 1-11); the spec's testing-strategy section is covered by Tasks 4 (Pest), 6/9/12 (agent-browser checkpoints), and the explicit "not automatable" callouts are preserved rather than papered over with fake JS tests.
- **Correction made while writing this plan, not present in the spec:** the spec's Section 1 table said `abort(403)` throws `AccessDeniedHttpException`; verified directly against `vendor/laravel/framework` that `abort(403)` actually throws a plain `HttpException` (`AccessDeniedHttpException` is Laravel's conversion of a Policy `AuthorizationException`, a different trigger). Task 4's implementation and its docblock comments reflect the verified behavior — one generic `HttpException $e` handler correctly covers both cases, given `AccessDeniedHttpException extends HttpException` and Laravel's `prepareException()` runs before any registered callback.
- **Placeholder scan:** no "TBD"/"add error handling"/"similar to Task N" phrasing — every step has literal code or an exact command.
- **Type consistency:** `attemptRecovery(key)` (Task 1) is called identically in Tasks 6 and 7 with matching key strings (`'invalid'`, `'preload-error'`, `'sw-update'`); `markBusy`/`clearBusy` (Task 2) are called identically in Task 10; `initServiceWorker(router)` (Task 7) matches its call site in Task 6 exactly.
