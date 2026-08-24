# Cross-Platform Error Recovery Architecture — Design

**Status:** Approved design, not yet implemented.
**Branch:** `fix/cross-platform-error-recovery` (worktree `.worktrees/error-recovery-architecture`, branched off `one-db`).
**Prerequisite reading:** `docs/cross-platform-error-recovery-audit.md` — the read-only audit this design implements. Every root cause referenced below (§A1–A5, §B, §G) is defined there.

## Problem

A parent can land on a failed page (419, 500, 502/503, a stale post-deploy asset, a stuck data-loading state) and have no way back into the app short of knowing to force a hard reload — and even a hard reload doesn't always help, because the service worker can keep serving a frozen, now-broken shell. The audit traced this to two independent, platform-agnostic root causes:

1. Laravel has Inertia-aware error handling for exactly one status code (404); everything else falls through to a bare, JS-less framework page that Inertia's client can't do anything useful with, so it shows a dismiss-only iframe modal with no retry action.
2. The hand-written service worker (`public/sw.js`) only activates a new version when a user notices a banner or every tab closes, and its network-failure fallback can serve a shell referencing hashed JS/CSS filenames a later deploy has already deleted.

This document is the architecture for closing both gaps, plus the adjacent CSRF/session, data-failure, React-crash, and stale-JS-chunk gaps the audit and this design process surfaced. It does not introduce a new tenant-scoping concept, does not touch the Quran module, and does not change authentication/authorization behavior beyond what's described below.

## Goals / non-goals

**Goals:** every error category gets a real, in-app recovery path; a stuck tab self-heals on its own next navigation or a single guided retry, without the user needing to understand CSRF, service workers, or deployments; a deploy cannot leave a tab permanently stuck on deleted assets; no change introduces an infinite reload/retry loop; CSRF/session security is not weakened.

**Non-goals:** platform-specific (iOS-only) workarounds — the audit found no evidence this is a Safari bug, only that iOS's tab-lifecycle model exposes the same architectural gap more often; a query/cache library (React Query, SWR) — the audit found the existing component-local data-fetch pattern already works correctly; a new JS test framework — none exists in this repo today, and adding one is out of scope for this fix (see Testing strategy).

## Architecture

### 1. Laravel error taxonomy

Already correct, untouched: 404 (existing `Inertia::render('Errors/404', ...)` pattern), 401 (Laravel's default `Authenticate` middleware already redirects to `route('login')` with intended-URL preservation — verified no custom override exists), 422 (already handled by Inertia's native `useForm`/`ValidationException` flow).

New handling added to `bootstrap/app.php`'s `->withExceptions()`, extending the existing 404 pattern (same `api/*`/`expectsJson()` → JSON, else → Inertia branch):

| Exception | Status | Response |
|---|---|---|
| `TokenMismatchException` | 419 | `back()->with(['message' => 'Your session expired. Please try again.'])` **plus an explicitly re-attached, freshly-constructed `XSRF-TOKEN` cookie** — see §4 |
| `AccessDeniedHttpException` (`abort(403)`) | 403 | `Inertia::render('Errors/GenericError', [...])` — no retry action, "Access Denied" + dashboard link only |
| `ThrottleRequestsException` | 429 | `Errors/GenericError`, retry action |
| `HttpException` where status is 502/503 | 502/503 | `Errors/GenericError`, retry action |
| `Throwable` (catch-all) | 500 | `Errors/GenericError`, retry action, **no stack trace or exception message ever exposed** |

One shared `resources/js/Pages/Errors/GenericError.jsx`, parameterized by `status`/`title`/`message`/which actions to render (`retry`, `dashboard`), rather than 4 near-duplicate files mirroring `404.jsx`. `404.jsx` itself is untouched.

### 2. Frontend recovery architecture

**`resources/js/Utils/recovery.js`** — `attemptRecovery(key)`: checks `sessionStorage` for a one-shot flag scoped by a failure key (e.g. `recovery:invalid`, `recovery:sw-update`, `recovery:preload-error`); returns `true` and sets the flag on first call for that key, `false` on any subsequent call this session. The flag is cleared by a listener on Inertia's `navigate` event — **verified directly against the installed `@inertiajs/core@2.3.23` source** (`dist/index.js:1541-1616`, `:1076`) that `navigate` fires on *every* page-set, including `InitialVisit.handleDefault()` (a full document reload) and ordinary SPA visits — unlike `success`, which is fired only from `Response.process()` (`:1991`), i.e. only on SPA visits, never on a hard reload's initial mount. This is the one mechanism every recovery action below reuses — no duplicated one-shot logic.

**Global Inertia `invalid` handler**, registered in `app.jsx`: kept as defense-in-depth for genuine non-Inertia responses (network-level failures, an unexpected proxy page) even though §1 makes the common case rare. On `inertia:invalid`: `event.preventDefault()`, then `attemptRecovery('invalid')` — `true` → one `router.reload()`; `false` → render a "Something went wrong — Try again / Go to Dashboard" fallback instead of retrying again.

**`Errors/GenericError.jsx`** buttons: `retry` → `router.reload()` (a direct user click, not gated by the loop-protection flag); `dashboard` → plain `<Link href="/dashboard">`.

**`resources/js/Components/ErrorBoundary.jsx`** — one top-level boundary wrapping `<App>` in `app.jsx`. On catch: `console.error`, render a fallback matching `GenericError`'s visual style with **Reload** (`window.location.reload()` — a hard reload, not a soft Inertia retry, since React state is already corrupted) and **Go to Dashboard** (`window.location.href`, not an Inertia `<Link>`, for the same reason).

**Data/API failure recovery** — audit confirmed this layer already works correctly (component-local state, cleared by Inertia's per-navigation remount). Only fix: add the two missing `.catch()` call sites the audit flagged (`resources/js/Pages/Blueprints/Index.jsx`, `Show.jsx`), for consistency with the rest of the codebase's pattern — no new mechanism.

**`vite:preloadError` handling** — **verified directly**, not assumed: `import.meta.glob("./Pages/**/*.jsx")` in `app.jsx:17` has no `{ eager: true }`, so page components are dynamically-imported, code-split chunks. Vite's production build-output preload helper (confirmed in the installed `vite@7.3.3` package, `dist/node/chunks/config.js:23361-23366`) dispatches a cancelable `vite:preloadError` window event on a failed chunk import and re-throws unless `preventDefault()` is called. `laravel-vite-plugin`'s `resolvePageComponent` (confirmed via its actual source — 9 lines, zero error handling) does nothing with a rejected import. Grepped the whole `resources/js` tree: **zero listeners exist today** — a stale tab (still running an old JS module graph after a deploy, because `clients.claim()` claims it with no busy-check — see §3) hitting a since-deleted hashed chunk gets an uncaught rejection with no recovery path.

Fix: `window.addEventListener('vite:preloadError', (event) => { event.preventDefault(); ... })` in `app.jsx`. First occurrence this session (`attemptRecovery('preload-error')` → `true`) → `window.location.reload()` (must be hard, not `router.reload()` — the failure means *this tab's* loaded module graph is stale; a soft visit retries the identical broken import). Second occurrence (`false` — a persistent problem, not a one-off deploy-window race) → render a minimal static fallback built via `document.createElement` directly (no dependency on React/Inertia being functional, since that's precisely what's in question) — not routed through `ErrorBoundary`, which cannot be relied on to catch a rejection occurring outside React's render cycle.

### 3. Service worker & deployment resilience

**Offline-page fallback replaces the frozen-shell fallback.** A small, fully self-contained HTML fallback (inline `<style>`, zero external JS/CSS/image references), precached at `install`. On a navigation-mode fetch failure, serve this instead of `caches.match('/')` — eliminates the possibility of ever serving a shell whose hashed asset references a later deploy has deleted, independent of activation timing.

**`DYNAMIC_CACHE` no longer stores or replays navigation (HTML) responses.** The existing network-first handler currently caches successful authenticated Inertia page HTML and can replay it on a later failure — showing a parent stale data as if live. Narrow the write path so it applies only to non-navigation dynamic GETs (the component-local data fetches the audit found already work correctly); navigation requests go straight to the offline page on failure, never a stale cached page. Old-cache cleanup on `activate` and the cache-first static-asset strategy are already correct — untouched.

**Auto-update, split into two independently-gated steps** (deliberately decoupled — `clients.claim()` affects *every* tab on the origin at once, so gating the trigger on one tab's busy state doesn't protect a *different*, busy tab):
- **Activation** (`public/sw.js`): any tab may auto-post `SKIP_WAITING` as soon as a new worker finishes installing — no busy-check at this step. `registration.update()` is called on every Inertia `navigate` event, not just hourly.
- **Reload** (`resources/js/Utils/serviceWorker.js` — see relocation below): each tab's own `controllerchange` listener independently decides whether *it* is safe to reload, checking `appBusy.js`'s `isBusy()`. Busy → defer (the tab keeps running old code until its own next natural navigation, at which point the already-active new worker controls it anyway). Idle → reload immediately, gated through `attemptRecovery('sw-update')`.
- The manual "Update Available" banner stays as an immediate option, unchanged in behavior, relocated in code (see below).

**Registration must move out of Blade — verified, not assumed.** `resources/views/app.blade.php:37`'s `<script>` tag has no `type="module"`, and `window.router`/`window.Inertia` are never exposed anywhere in this app (grepped, zero matches) — so that inline script cannot reach Inertia's `router` or `import` from `recovery.js` (an `import` statement in a classic script is a syntax error). All SW registration logic — `register()`, the `updatefound`/installed→auto-`SKIP_WAITING` handler, the `navigate`-triggered `update()` call, the busy-gated `controllerchange` reload, and the existing update-banner DOM code (relocated as-is, still vanilla DOM manipulation, not rewritten as React) — moves into a new `resources/js/Utils/serviceWorker.js`, imported and invoked from `app.jsx`. `app.blade.php`'s only change is **removing** the inline `<script>` block.

**Busy-flag wiring — must actually be called, or the busy-gate does nothing.** `resources/js/Utils/appBusy.js` exports `markBusy(reason)`/`clearBusy(reason)`/`isBusy()` (in-memory, per-tab). It must be wired into the three multi-step flows the audit identified as holding meaningful in-progress state only in memory — confirmed to exist at these paths:
- `resources/js/Components/Students/StudentImportModal.jsx`
- `resources/js/Components/Guardians/GuardianImportModal.jsx`
- `resources/js/Pages/Fees/Invoices/Create.jsx`

Each calls `markBusy('...')` on entering its preview/confirm step and `clearBusy('...')` on completion, cancel, **and** error (not just success — an abandoned wizard must not permanently block auto-update for that tab).

**Deployment/version resilience:** the `postbuild` → `scripts/update-sw-version.sh` mechanism (bumps `CACHE_NAME`s to the current git commit hash) is sound *if* the real deploy pipeline invokes it — unverifiable from this repo (no CI/CD config exists here). Carried into the final implementation report as a residual, infra-level risk — not silently assumed fine, no code fix possible for infrastructure this repo doesn't contain.

### 4. Session/CSRF recovery

**Verified directly** in `vendor/laravel/framework/.../VerifyCsrfToken.php:79-95`: for a GET/HEAD/OPTIONS request, the middleware skips the token-match check and unconditionally refreshes the `XSRF-TOKEN` cookie (`shouldAddXsrfTokenCookie()` defaults `true`, no override exists here). But for the request that actually *throws* `TokenMismatchException` (line 94), the throw happens instead of ever reaching that cookie-refresh code — confirming the audit's §A2 finding exactly.

Fix, folded into §1's 419 handler rather than a new endpoint: after building the `back()->with([...])` response, explicitly attach a freshly-constructed `XSRF-TOKEN` cookie using the *current* session's still-valid token (no rotation — just re-syncing the cookie the client may have lost, e.g. to Safari ITP eviction), mirroring `VerifyCsrfToken::newCookie()`'s exact construction (same `config('session')`-driven path/domain/secure/`same_site` — no new security posture, reuses the framework's own convention). Net effect: even a client with an evicted/stale cookie self-heals after one failed submit + retry — no separate CSRF-refresh route needed. `TrustProxies` is explicitly **not** touched — production proxy topology is unknown and guessing at security-relevant config was rejected in favor of flagging it as a residual risk requiring your confirmation against actual infrastructure.

## Reload-loop protection (cross-cutting, Phase 5)

Every recovery action that can reload is gated through the single `attemptRecovery()` mechanism from §2, keyed distinctly per failure type (`invalid`, `sw-update`, `preload-error`) so one failure type's one-shot flag can't mask a different, unrelated failure later in the same session. `GenericError.jsx`'s manual retry button is intentionally *not* gated (a deliberate user click each time is not a loop). No code path in this design calls a bare `window.location.reload()` for every error — every reload site is named above with its specific trigger and gate.

## Testing & verification strategy

**Real automated Pest coverage** (`tests/Feature/ErrorHandlingArchitectureTest.php`, runs in `composer test`): 419/403/429/500/502/503 each produce an Inertia-rendered response with the correct status and component (not a bare framework page); the 419 response carries a correctly-constructed fresh `XSRF-TOKEN` cookie; 500 responses never leak a stack trace or exception message.

**Not automatable in this repo as it stands — verified, not assumed:** `package.json` has no JS test runner (no vitest/jest/testing-library, no `test` script). This means `attemptRecovery`, the `invalid`/`vite:preloadError` handlers, `ErrorBoundary`, `GenericError.jsx`'s buttons, and the SW's activate/busy-gated-reload flow have no automated regression coverage after this change. Adding a JS test framework is a real scope expansion, not done silently as a side effect here. Instead: genuine executed verification via `agent-browser` (headless Chrome, same tool used for the live-check in the prior authorization-fix task) against a locally running instance, before any completion claim — real evidence, not a maintainable suite. This gap is named explicitly in the final implementation report's risks section, not glossed over.

**Manual-only, undeliverable in this sandboxed environment regardless of tooling:** the real Android/iOS/iPad device matrix from the audit (bfcache-restore-vs-reload, ITP eviction timing, SW activation-timing differences per engine) — documented as a manual test procedure, never claimed as verified here.

## Complete file manifest

| File | Change |
|---|---|
| `bootstrap/app.php` | Add exception renders: 419 (+ cookie fix), 403, 429, 502/503, 500 catch-all |
| `resources/js/Pages/Errors/GenericError.jsx` | New |
| `resources/js/Utils/recovery.js` | New — `attemptRecovery()`, clears via `router.on('navigate')` |
| `resources/js/Utils/appBusy.js` | New — `markBusy()`/`clearBusy()`/`isBusy()` |
| `resources/js/Utils/serviceWorker.js` | New — registration, update-on-navigate, busy-gated reload, banner (moved from Blade) |
| `resources/js/Components/ErrorBoundary.jsx` | New |
| `resources/js/app.jsx` | Wrap `<App>` in ErrorBoundary; register `invalid` + `vite:preloadError` handlers; call `initServiceWorker()` |
| `resources/js/Pages/Blueprints/Index.jsx`, `Show.jsx` | Small — add missing `.catch()` |
| `resources/js/Components/Students/StudentImportModal.jsx` | Small — `markBusy`/`clearBusy` |
| `resources/js/Components/Guardians/GuardianImportModal.jsx` | Small — `markBusy`/`clearBusy` |
| `resources/js/Pages/Fees/Invoices/Create.jsx` | Small — `markBusy`/`clearBusy` |
| `public/sw.js` | Offline-page fallback; narrow `DYNAMIC_CACHE`; auto-`SKIP_WAITING` on install |
| `resources/views/app.blade.php` | **Remove** inline SW-registration `<script>` block |
| `tests/Feature/ErrorHandlingArchitectureTest.php` | New Pest coverage |

## Constraints carried through from the original request

Do not commit application code changes without review; do not push; do not modify production configuration; do not weaken CSRF/session security or disable security middleware; no blanket `window.location.reload()`; no infinite retry/reload; do not blindly disable caching; do not remove the service worker; no iOS-only workaround; do not hide genuine application errors; work incrementally, running relevant tests after each phase.

## Residual risks (carried into the final implementation report, not resolved by this design)

- Whether the production deploy pipeline actually invokes `postbuild`/`update-sw-version.sh` — unverifiable from this repo.
- `TrustProxies` / production proxy topology — unknown, intentionally untouched.
- No automated frontend regression coverage for the recovery mechanisms themselves (no JS test framework in this repo).
- Real per-platform device behavior (bfcache, ITP timing, SW activation timing) — code-level fixes only; device verification is a manual procedure, not performed here.
