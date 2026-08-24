# Cross-Platform Error Recovery Audit — Why Failure States Become Sticky

**Status:** Audit only — no code changed, nothing committed, no production config touched.
**Scope:** The complete request lifecycle for error/failure handling — Laravel exception
rendering, Inertia's client runtime, the service worker/caching/deployment layer,
sessions/cookies/CSRF, and client-side data-failure/dead-end recovery — audited
against Android Chrome, iPhone/iPad Safari, iPhone Chrome, and Desktop Chrome.

**Method:** Five independent, parallel code/config audits of this worktree
(`.worktrees/restructure-quran-module`, branch `restructure/quran-module`),
each covering a distinct subsystem with no shared state, synthesized below.
**No physical iOS/Android/desktop devices were available in this environment.**
Every claim in this report is one of two kinds, marked explicitly throughout:

- **[CODE-CONFIRMED]** — verified by reading the actual source/config in this
  repo (file:line cited).
- **[PLATFORM-INFERRED, NOT REPRODUCED]** — a plausible explanation grounded
  in well-documented WebKit/Chromium engine behavior, but not reproduced
  against a real device in this audit. Treat these as hypotheses to verify
  with real-device testing before relying on them, not as confirmed facts.

---

## Executive summary

**The primary mechanism is architectural, not a browser bug, and it affects
every platform identically.** Two independent gaps compound into the reported
symptom:

1. **[CODE-CONFIRMED]** Laravel has custom, Inertia-aware error handling for
   exactly one status code — 404. Every other error a parent can hit (419,
   401-via-abort, 403, 500, 502/503) falls through to Laravel's bare
   framework fallback page: zero JS, zero CSS, zero navigation, doesn't even
   load the app bundle.
2. **[CODE-CONFIRMED]** Because those responses never call `Inertia::render()`,
   they never carry the `X-Inertia` header. When one of them happens *during*
   an Inertia-driven navigation (the normal way this SPA moves between
   pages), Inertia's client library — traced directly in the installed
   `@inertiajs/core@2.3.23` source — does **not** reload the page. It fires a
   cancelable `inertia:invalid` event (nothing in this app listens for it)
   and falls through to its **default behavior: a dismiss-only overlay modal**
   containing the raw error HTML in an iframe. Closing the modal does
   nothing but hide it — the user is left exactly where they were, with no
   retry action anywhere in the UI.

That alone explains "stuck on the error, and reloading/new-tab doesn't help"
**for a genuine full-page reload it wouldn't, but the modal itself gives the
user no reason to even try a reload** — they see a dismissible box, dismiss
it, and appear to be back on the app with no obvious signal anything failed.
A parent who doesn't realize a hard reload is the fix has no in-app cue to
attempt one.

A second, independent mechanism can **additionally** strand a device even
after a correct reload: the hand-written service worker (`public/sw.js`)
only activates a new version when a user notices and clicks an in-page
banner, or when every tab on the origin closes. Until then, it keeps
controlling **all tabs, including new ones**, and — specifically on a network
hiccup or aborted fetch — falls back to a build-time-frozen cached shell
whose JS/CSS filenames get deleted by every subsequent deploy (Vite's
default `emptyOutDir: true`). That produces a genuinely broken, 404-ing app
that no ordinary reload or new tab can fix, because the still-active old
worker keeps intercepting the request.

**Why iOS appears worse than Android is very plausibly an amplification
effect, not a different underlying bug** — see §C. Per your explicit
instruction, this report does not treat Android's apparent recovery as proof
the architecture is sound; both platforms share the same two root causes
above, and the fix targets those, not a Safari-specific patch.

---

## A. Root causes found (confirmed by code)

### A1. Laravel renders a JS-less dead end for every error code except 404
**[CODE-CONFIRMED]** `bootstrap/app.php:40-58` is the *entire* custom
exception configuration in this app (Laravel 12 has no `app/Exceptions/Handler.php`
— confirmed absent):
```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (NotFoundHttpException $e, $request) {
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([...], 404);
        }
        return Inertia::render('Errors/404', [...])->toResponse($request)->setStatusCode(404);
    });
})
```
Type-hinted to `NotFoundHttpException` only. Everything else — `TokenMismatchException`
(419), `AccessDeniedHttpException` from `abort(403)` (27 call sites, including
guardian-facing controllers: `GuardianChildrenController.php:16`,
`GuardianQuranHomeworkController.php:19,30`, `GuardianAttendanceController.php:15`),
uncaught 500s, and 503s — falls through to Laravel's framework-bundled
fallback templates (`vendor/laravel/framework/.../Exceptions/views/{419,403,500,503}.blade.php`),
all extending a `layout.blade.php` that is a bare `<div>` with a message and
**no links, no buttons, no retry action, no home link**.

### A2. No 419/CSRF recovery logic exists at all
**[CODE-CONFIRMED]** `grep -rniE "tokenmismatch|419|pageexpired"` across
`app/`, `config/`, `resources/js/`, `resources/views/`, `routes/` returns
**zero matches**. Inertia's own documented convention for this exact scenario —
```php
} elseif ($response->status() === 419) {
    return back()->with(['message' => 'The page expired, please try again.']);
}
```
— is simply not implemented. Additionally, `VerifyCsrfToken`'s cookie-refresh
(`vendor/.../VerifyCsrfToken.php:89`) only runs when the token **matches**;
on a mismatch it throws before ever refreshing the cookie
(`:94`). A client-side retry reusing the same stale in-memory token will
419 again identically. Only a genuine fresh top-level GET (which bypasses
CSRF checking entirely, since GET is a "reading" method) gets a new
session + CSRF cookie pair.

### A3. Inertia's default non-Inertia-response handling is a dead-end modal, not a reload
**[CODE-CONFIRMED, traced directly in `@inertiajs/core@2.3.23` source]**
`Response.process()` checks for the `X-Inertia` header
(`dist/index.js:1961-1994`). A/A1's bare Blade pages never carry it. For any
non-Inertia response, `handleNonInertiaResponse()` (`dist/index.js:2005-2018`)
does a real `window.location.reload()`/`.href =` navigation **only** for a
409 carrying `X-Inertia-Location` (asset-version-conflict handling — unrelated
to CSRF). For everything else — 419, 500, 502, 503, any plain HTML error —
it fires a cancelable `inertia:invalid` event
(`dist/index.js:2015`, `:134-136`). This app registers **zero** listeners
for it anywhere (`grep -rn "router.on(\|inertia:invalid\|onInvalid" resources/js`
— zero hits), so Inertia falls through to its built-in default: a
fixed-position overlay with a sandboxed `<iframe>` showing the raw error
HTML (`dist/index.js:1849-1889`), closable only by backdrop-click or
Escape, with **no retry/reload button**. The underlying page/React state is
left completely untouched.

### A4. Service worker: opt-in activation + stale-shell fallback on fetch failure
**[CODE-CONFIRMED]** `public/sw.js`:
- `install` deliberately does **not** call `self.skipWaiting()` — line 40
  comment: *"Don't auto-skip waiting - let the user decide via update
  notification."* A new SW version only takes over when the user clicks the
  in-page "Update Available" banner (`resources/views/app.blade.php:81-110`,
  posts `SKIP_WAITING` → `sw.js:23` → `controllerchange` →
  `window.location.reload()`), or when every tab on the origin closes.
- `activate` **does** call `self.clients.claim()` (line 60) — the currently
  active worker (old or new) claims **every** tab, including freshly opened
  ones, on that origin.
- The HTML/navigation fetch handler is network-first, but on a genuine fetch
  failure (network drop, aborted request — not merely a non-200 status) it
  falls back to `caches.match('/')` (`sw.js:148-150`) — the app shell HTML
  frozen at the SW's **last install**, referencing that build's
  content-hashed JS/CSS filenames.
- **[CODE-CONFIRMED, ruling out one hypothesis]** Non-200 responses are
  never cached — both cache-write paths (`sw.js:100-103`, `:124`) explicitly
  gate on `response.status === 200` first. **A 419/500 error page itself is
  never what's being served stale.** What's stale is the *shell*, not an
  error.
- **[CODE-CONFIRMED, from Vite defaults, no override in `vite.config.js`]**
  Vite's default `emptyOutDir: true` wipes `public/build` on every new
  build, deleting the previous build's hashed asset files. A stale cached
  shell served after a deploy references filenames that **no longer exist**
  — the result is JS chunk-load 404s / a broken blank screen, not merely
  "old but working" behavior. This matches "stuck," not "outdated."
- Combined effect: on a network hiccup, the still-active *old* worker
  (unaware a new one is waiting) serves this frozen, now-broken shell — to
  the original tab **and any new tab opened on the same origin**, until the
  user notices the update banner or every tab fully closes.

### A5. No ErrorBoundary anywhere + one unguarded prop access
**[CODE-CONFIRMED]** `grep -rn "ErrorBoundary\|componentDidCatch\|getDerivedStateFromError"`
across all of `resources/js` — zero matches. `app.jsx`'s `setup()` does a
plain `createRoot(el).render(<App {...props} />)` with nothing wrapping it.
`AuthenticatedLayout.jsx:23` reads `auth.user.role` with no optional
chaining; if `auth.user` were ever `null` while this layout renders, it
throws, and with no boundary anywhere, the entire React tree unmounts to a
blank white screen. **No currently-reachable code path was found that
actually nulls `auth.user` on an authenticated route** (auth middleware
gates first) — this is a **latent landmine**, not a confirmed trigger, but
it's exactly the kind of gap that turns "the server briefly had a problem"
into "the whole app is blank with zero recovery UI."

---

## B. Likely causes (plausible, not fully confirmed)

- **`postbuild` script reliability** — `package.json`'s `"postbuild": "bash scripts/update-sw-version.sh"`
  runs the SW cache-version bump automatically after `npm run build`/`pnpm build`,
  **but only if the production deploy pipeline actually invokes that script**
  rather than calling `vite build` directly or some other path. No CI/CD
  config, Dockerfile, Procfile, or `.laravel-cloud` file exists in this repo
  to confirm the real deploy pipeline — **unverifiable from the codebase
  alone.** If ever bypassed, every deployed build would share the same SW
  cache-name, silently defeating cache-busting entirely.
- **Cache-Control / CDN layer** — no `Cache-Control`, `ETag`, or `no-store`
  header is set anywhere in this app's Laravel middleware or routes (`grep`
  confirms zero matches). Whether an intermediate CDN/reverse-proxy (not
  present in this repo — no Cloudflare config, no `_headers` file found)
  applies its own caching to authenticated/dynamic responses is **entirely
  outside this codebase's visibility** and needs to be checked against the
  actual production infrastructure.
- **Production `Secure` cookie flag correctness** — `SESSION_SECURE_COOKIE`
  is unset, so Laravel auto-computes it from `$request->isSecure()`
  (`config/session.php:172`, Symfony `Cookie` docblock behavior). **No
  `TrustProxies` configuration exists anywhere in `bootstrap/app.php`.** If
  production sits behind a TLS-terminating load balancer/reverse proxy that
  Laravel isn't configured to trust, `isSecure()` could resolve `false` even
  on a genuinely HTTPS request, potentially omitting `Secure` from cookies.
  Requires confirming actual production topology — not determinable from
  this repo.
- **iOS Safari ITP cookie eviction** — CSRF token recovery in this app
  depends entirely on axios's automatic `XSRF-TOKEN` cookie → `X-XSRF-TOKEN`
  header mechanism (`resources/js/bootstrap.js` has no meta-tag fallback, no
  manual header wiring). If Safari's Intelligent Tracking Prevention evicts
  that cookie (or the session cookie) more aggressively than Android Chrome
  does — a documented general behavior of ITP for sites without recent
  top-level interaction — CSRF/session failures would recur more often on
  iOS with zero client-side fallback to recover the token short of a full
  page reload. **Not device-verified.**

---

## C. Cross-platform differences

**[CODE-CONFIRMED]** The two primary mechanisms (A1–A3: bare error pages +
Inertia's dismiss-only modal) apply **identically on every platform** —
nothing in Laravel's exception rendering or Inertia's client library is
platform-conditional. This is not an iOS bug. The service worker (A4) is
also platform-agnostic code — the trigger condition (a fetch throwing) and
the resulting stale-shell fallback are the same everywhere.

**What plausibly differs is not the failure mechanism, but how often each
platform reaches the failure trigger, and how long each platform keeps the
old, broken state in control — per your explicit instruction not to treat
Android's recovery as proof of correctness, here is what Android is likely
doing differently rather than "doing right":**

- **[PLATFORM-INFERRED, NOT REPRODUCED] SW activation timing.** The SW's
  update only completes once the browser decides zero clients are
  controlled by the old worker (spec-defined) or the user clicks the
  banner. Android Chrome is generally more aggressive about fully
  discarding backgrounded tabs under memory pressure, which satisfies the
  "zero controlled clients" condition sooner — the old worker gets replaced
  without anyone noticing. iOS Safari (and even more so, Safari in "Add to
  Home Screen" PWA mode) is documented to keep backgrounded tabs suspended
  rather than discarded far longer, which means the old worker keeps
  controlling the origin, and any new tab on that origin, for much longer.
  **This is Android incidentally escaping the same architectural gap by
  memory-pressure timing, not evidence the app's update flow is sound on
  either platform** — on Android, under different memory conditions
  (e.g. a tab kept pinned/foregrounded), the identical stuck state is
  reachable.
- **[PLATFORM-INFERRED, NOT REPRODUCED] Reload vs. bfcache restore.** iOS
  Safari's back-forward cache / page lifecycle behavior is known to restore
  a page from an in-memory frozen snapshot in some navigation flows rather
  than performing a genuine network round-trip. If a user's "reload" ends
  up being a bfcache-style restore instead of a real GET, **none** of the
  server-side recovery mechanisms confirmed in §D (fresh session cookie,
  fresh CSRF token, fresh Inertia asset version) get a chance to run, because
  no request left the device. A true reload on any platform, including iOS,
  should recover per the config audit in §D — the risk is specifically
  whether the user's reload gesture actually triggers one.
- **[PLATFORM-INFERRED, NOT REPRODUCED] ITP cookie eviction** (§B) — a
  plausible amplifier specific to Safari's tracking-prevention model, with
  no equivalent on Android Chrome.
- **"New tab" recovery is likely unreliable on both platforms**, not just
  iOS: `clients.claim()` (A4) hands every tab on the origin — new or old —
  to whichever worker is currently active. A new tab is not a fresh SW
  registration. Any apparent Android "new tab recovers" behavior is more
  likely attributable to (a) the old worker having already been replaced by
  the time of the new tab (per the timing point above), not to the new tab
  itself doing anything different, or (b) a genuinely fresh network fetch
  succeeding rather than the SW's failure fallback triggering at all this
  time (the fallback only activates on an actual fetch failure, which is
  probabilistic, not deterministic).

**Conclusion for this section:** none of the above are "Safari bugs" — they
are documented, intentional differences in how iOS and Android manage
backgrounded tab lifecycle and storage, which this app's architecture is not
currently resilient to on *either* platform. Fixing the two root causes in
§A removes the failure mode itself, which removes the platform-timing
lottery entirely, rather than chasing whichever platform currently exposes
it more often.

---

## D. Browser-specific issues vs. general architecture problems

| Concern | Classification |
|---|---|
| Laravel renders bare, JS-less error pages for 419/403/500/503 | **Architecture** — same on every platform |
| Inertia's dismiss-only modal for non-Inertia responses | **Architecture** — same on every platform, confirmed in the client library's own source, not a Laravel/Inertia integration bug either — it's the documented default |
| No `back()->with(['message'=>...])` 419 handling | **Architecture** |
| No ErrorBoundary + unguarded `auth.user.role` access | **Architecture** (latent) |
| SW `skipWaiting()` opt-in + stale-shell-on-fetch-failure fallback | **Architecture** — the code is platform-agnostic; only the *frequency* of hitting the failure trigger and the *duration* the old worker stays in control are platform-influenced |
| Session/CSRF config itself (driver, SameSite, fail-open on transient errors) | **Sound, confirmed correct** — §E1 |
| SW update timing relative to backgrounded-tab lifecycle | **Platform-influenced timing**, not a separate bug — same underlying opt-in-activation gap, exposed more/less often per engine |
| bfcache-style reload-without-network-roundtrip | **Genuine Safari/WebKit-specific behavior** — not reproducible/fixable in this app's own code, but the fix (§G) doesn't depend on preventing it; it depends on not needing "a reload" to be the *only* recovery path |
| ITP cookie eviction | **Genuine Safari-specific behavior** — the *gap* it exposes (zero fallback if the XSRF cookie is evicted) is architecture; the eviction trigger itself is browser-specific |

**Nothing in this audit found actual evidence of a Safari *rendering* bug,
a Safari CSS/JS incompatibility, or React/Inertia code that behaves
differently due to a WebKit quirk in the application's own logic.** Every
divergence identified is either (a) the same architectural gap exposed with
different probability/duration per platform's tab-lifecycle model, or (b)
genuine platform storage/caching behavior (ITP, bfcache) that the current
architecture has no fallback for on **any** platform — it simply gets
noticed more on iOS because iOS's behavior around #(a) and #(b) both trend
toward "keep the broken state in control longer."

---

## E. Current failure flow — exactly what happens today

**419 (expired session/CSRF token):**
User submits a form or Inertia navigates while the CSRF token is stale.
Laravel throws `TokenMismatchException` → generic exception handling
(§A1) → the framework's bare 419 Blade page, HTTP 419, no `X-Inertia`
header, no cookie refresh (§A2). If the triggering request was an Inertia
XHR visit, the user never even sees that raw page directly — Inertia's
client intercepts it and shows the dismiss-only iframe modal (§A3) instead.
Either way: no redirect back to the form, no flash message, no automatic
retry, no fresh CSRF cookie issued from this specific response.

**500 (server error):** Same path as 419 — bare framework page or, if
mid-Inertia-visit, the dismiss-only modal. No custom handling exists for
this code at all.

**Failed data request (secondary fetch after page load):** No global
query-cache layer exists (§ data-audit finding). Every secondary
`axios`/`fetch` call found (surah lookups, invoice previews, import
previews, subject-by-grade lookups, blueprint generation-status polling) is
component-local `useState`, cleared automatically because Inertia unmounts
and remounts the entire page component tree on every navigation. Most are
`.catch()`-handled and show an inline message; a few (`Blueprints/Index.jsx:67-74,95-102`,
`Blueprints/Show.jsx:40-42,63-65`) have no `.catch()` at all but don't leave
the UI stuck because the relevant loading flag is reset synchronously
beforehand. **This layer is not where the "stuck" symptom originates** — it
was the cleanest of the five audited domains.

**Stale frontend assets (post-deployment):** Only reachable via the SW path
in §A4 — a live fetch failure during a deploy window causes a fallback to
the frozen last-installed shell, whose hashed asset URLs 404 against the new
build's pruned `public/build` directory.

**Authentication/session failure:** `CheckSchoolActive` correctly
fails open on transient exceptions (wrapped in try/catch, logs and
proceeds — `app/Http/Middleware/CheckSchoolActive.php:39-58`) and only
force-logs-out on a genuinely inactive/missing school, landing on
`SchoolInactive.jsx` — a static page with **zero recovery buttons or
links** (intentional lockout screen, but no self-service path back).
`RoleMiddleware` only logs out on `is_active === false`, not on any
transient condition. No code path force-logs-out a valid session due to a
temporary error.

---

## F. Recovery gaps — every place the app can become effectively unrecoverable

1. **419/500/503 via a plain browser navigation** → Laravel's bare framework
   page, zero JS, zero links (§A1).
2. **419/500/502/503 mid-Inertia-visit** → dismiss-only overlay modal, no
   retry action, underlying page state untouched (§A3).
3. **SW stale-shell fallback on fetch failure** → broken app, 404-ing assets,
   persists across reload and new tabs until update banner is noticed/clicked
   or all tabs close (§A4).
4. **`SchoolInactive.jsx`** → zero buttons/links; only resolves when an
   admin reactivates the school server-side (§E, by design, but worth
   flagging as a true dead end with no self-service recovery).
5. **Latent: no ErrorBoundary + unguarded `auth.user.role`** → any future
   code path that nulls `auth.user` on an authenticated route would blank
   the whole app with no recovery UI (§A5).
6. **CSRF token recovery has exactly one path** (a genuine fresh top-level
   GET) **and zero client-side fallback** if the `XSRF-TOKEN` cookie itself
   is unreadable/evicted (§B — ITP risk).

None of these are loops in the strict sense (nothing found re-triggers
itself automatically), but every one of them is a state from which the
*application* provides no way forward — recovery today depends entirely on
the user manually doing the right un-prompted browser action (a true hard
reload reaching the network) with no in-app cue that this is what's needed.

---

## G. Recommended architecture (not implemented — for review)

Ordered by priority; each addresses a specific gap from §A/§F.

1. **Give every error code an Inertia-aware, JS-loading response** (closes
   §A1). Extend `bootstrap/app.php`'s exception rendering, following the
   existing 404 pattern, for 419, 403, 500, and 503 — each returning
   `Inertia::render('Errors/{code}', [...])` when the request is
   Inertia/browser-driven, JSON when it's an API/`expectsJson()` request.
   This alone guarantees the user always lands in the real React app with
   the real layout/nav, never a bare framework page.
2. **Implement Inertia's documented 419 convention** (closes §A2): for a
   `TokenMismatchException` specifically, `return back()->with(['message' =>
   '...'])` so an Inertia-driven form submission returns the user to the
   same form with a friendly flash message rather than a full error page —
   the single lowest-risk, highest-value fix in this report.
3. **Register a global, controlled Inertia `invalid`/error handler** (closes
   §A3) — listen for the event Inertia already fires, and for the specific
   set of genuinely recoverable statuses (419, 503, network-failure), take
   one bounded, guarded action (e.g., a single `router.reload()` gated by a
   `sessionStorage` flag so it can only fire once per failure, never loop —
   Principle B/C). For non-recoverable statuses (500, 403), let the new
   Inertia-aware error pages from #1 handle it — don't suppress the signal
   that something is actually broken.
4. **Add one top-level React ErrorBoundary** wrapping `<App>` in `app.jsx`
   (closes §A5) — a generic "Something went wrong" page with a single
   "Reload" button, as the last line of defense for any uncaught render
   exception, present or future.
5. **Make the service worker's update flow safe by default, not opt-in**
   (closes §A4) — the specific mechanism is a judgment call for you (a fully
   automatic `skipWaiting()`+`clients.claim()`+forced reload on activate,
   vs. keeping the banner but adding a bounded grace-period auto-apply), but
   the current "wait indefinitely for the user to notice" design is the
   single largest contributor to "even a deployed fix doesn't reach me."
   Separately, harden the navigation-fetch failure fallback so it does not
   fall back to a *full* frozen app shell with potentially-pruned asset
   references — a minimal, self-contained "you're offline / retry" page
   (kept in the precache, with no external asset dependencies) is a safer
   fallback than replaying an old build.
6. **Add a lightweight CSRF-refresh fallback** (mitigates §B's ITP risk) —
   a small unauthenticated endpoint the client can hit to mint a fresh
   `XSRF-TOKEN` cookie before retrying an action that just 419'd, rather
   than relying solely on a full reload.
7. **Confirm and, if needed, configure `TrustProxies`** (mitigates §B's
   Secure-flag risk) — requires confirming actual production topology
   first; do not change blindly.

This satisfies Principles A–F from the request: recoverable failures
(419, transient 503, stale asset) get a controlled, bounded retry path;
non-recoverable ones (500 bug, 403 authorization, missing record) get a
real, informative page instead of a raw dead end; every state has an escape
path (reload button / dashboard link, consistent with the existing
`404.jsx` pattern); deployment safely invalidates stale state without
requiring the user to notice a banner; and none of it is
platform-conditional — the same code runs everywhere.

---

## H. Proposed implementation — files/components (not yet changed)

| File/Component | Change | Failure mode addressed |
|---|---|---|
| `bootstrap/app.php` | Add `render()` handlers for `TokenMismatchException` (419), `AccessDeniedHttpException`/`abort(403)`, generic `Throwable` (500), `HttpException` 503 — mirroring the existing 404 pattern | §A1, §F1 |
| `resources/js/Pages/Errors/419.jsx`, `403.jsx`, `500.jsx`, `503.jsx` | New components, same shape/pattern as existing `404.jsx` (retry + dashboard link) | §A1, §F1 |
| `resources/js/app.jsx` | Wrap `<App>` in a new `ErrorBoundary` component; register a global `router.on('invalid', ...)` (or `document.addEventListener('inertia:invalid', ...)`) handler | §A3, §A5, §F2, §F5 |
| new `resources/js/Components/ErrorBoundary.jsx` | Top-level boundary, generic fallback UI with a reload action | §A5, §F5 |
| `app/Http/Middleware` (or a small dedicated CSRF-handling addition) | 419-specific `back()->with([...])` handling for Inertia requests | §A2, §F |
| `public/sw.js`, `resources/views/app.blade.php` | Revisit `skipWaiting()`/update-notification timing; replace full-shell fetch-failure fallback with a minimal self-contained offline page | §A4, §F3 |
| `bootstrap/app.php` (middleware config) | `trustProxies(...)` — pending confirmation of production topology | §B (Secure-flag risk) |
| A small new route (e.g. `GET /csrf-refresh`) + a client-side call site in the 419-recovery handler | Fresh `XSRF-TOKEN` cookie without a full reload | §B (ITP risk), §F6 |

None of these have been created or modified — this is the proposed surface
area for your review before any implementation begins.

---

## I. Risks

- **Reload loops:** any client-triggered `router.reload()`/`window.location.reload()`
  in the new global handler (§G3) must be guarded by a one-shot flag
  (e.g. `sessionStorage`) so a persistent backend outage produces one retry
  and then a real error page, never an infinite loop.
- **Redirect loops:** the 419 `back()` pattern could loop if the referring
  URL itself immediately 419s again (e.g. an already-stale GET) — needs an
  explicit guard/counter, not a bare `back()`.
- **Destroying valid user state:** several multi-step client flows hold
  meaningful in-progress state only in memory (`GuardianImportModal.jsx`,
  `StudentImportModal.jsx` preview/confirm wizards, `Fees/Invoices/Create.jsx`
  preview). Any automatic reload/retry logic must not fire while one of
  these is mid-flow without warning the user first — silently discarding an
  in-progress import or invoice preview would be a regression, not a fix.
- **Logging users out unnecessarily:** the existing fail-open-on-transient-error
  behavior in `CheckSchoolActive` (§E) is correct and must be preserved —
  new 419/error handling must not become a second, stricter path that logs
  users out on conditions the current code deliberately tolerates.
- **Duplicate form submissions:** the existing convention of disabling the
  submit button during `processing` is consistent across all 78 `useForm`
  usages audited — any new retry logic must never resubmit a form
  automatically on the user's behalf; only the user's own action should
  re-trigger a POST/PUT/DELETE.
- **Masking real application bugs:** a genuine 500 (an actual bug) must
  still surface as a distinct, informative error page — not get silently
  swallowed by the same "just retry" logic used for a transient 419/503.
  Principle C's recoverable/non-recoverable split must be enforced
  explicitly in the new handler, not treated uniformly.
- **Caching authenticated content:** no `Cache-Control` headers exist
  anywhere in this app today (§B) — before any change here, confirm no
  intermediate CDN/proxy is already caching dynamic authenticated Inertia
  responses at the infra layer; adding headers is safe, but changing SW
  caching strategy for dynamic routes without first confirming this could
  introduce new caching of content that must never be cached.
- **Breaking one platform while fixing another:** any change to `public/sw.js`
  specifically must be validated on real Android Chrome, iOS Safari, iPad
  Safari, and Desktop Chrome before shipping — this file is the one place in
  the audit where genuine, documented per-engine behavioral differences
  (tab lifecycle, SW activation timing) mean a change that looks correct in
  code review could still behave differently per platform. This is the one
  component in this report that most needs device QA, not just a code
  review, before merging.
- **Introducing inconsistent behavior between environments:** per your
  explicit constraint, none of the proposed changes are platform-conditional
  or user-agent-sniffing — all of §G targets the shared Laravel/Inertia/React
  code path. Keep it that way; an iOS-specific branch would defeat the
  purpose of this audit's conclusion that the root cause is architectural.

---

## Failure matrix

Legend: **✅** should recover per code evidence · **⚠️** recovery depends on
platform-specific behavior not verified in this audit · **❌** no built-in
recovery path exists in the code today, regardless of platform.

| Failure | Android Chrome | iPhone Safari | iPhone Chrome | iPad Safari | Desktop Chrome |
|---|---|---|---|---|---|
| 419 (raw navigation) | ❌ bare page, no nav (§A1) | ❌ same | ❌ same | ❌ same | ❌ same |
| 419 (mid-Inertia-visit) | ❌ dismiss-only modal, no retry (§A3) | ❌ same | ❌ same | ❌ same | ❌ same |
| 419 — does a **true fresh reload** recover it? | ✅ code confirms fresh GET gets valid cookie (§D) | ✅ *if* the reload is a genuine network round-trip, not a bfcache restore ⚠️ | ✅ same caveat as Safari (Chrome-on-iOS uses WebKit under the hood) ⚠️ | ✅ same caveat ⚠️ | ✅ least likely to hit bfcache-restore-instead-of-reload ambiguity |
| 500 | ❌ same dead-end pattern as 419 (§A1/A3) | ❌ same | ❌ same | ❌ same | ❌ same |
| 502/503 (reaching Laravel) | ❌ same pattern | ❌ same | ❌ same | ❌ same | ❌ same |
| 502/503 (proxy-level, never reaches Laravel) | Out of this repo's scope — infra-dependent, unverifiable here |
| Failed data request (secondary fetch) | ✅ component-local state, clears on navigation (§E) | ✅ same | ✅ same | ✅ same | ✅ same |
| Stale JS bundle after deploy (SW fetch-failure path) | ⚠️ probabilistic — depends on whether a fetch failure occurs during the deploy window, and on tab-discard timing (§C) | ⚠️ same trigger, but iOS's longer-lived backgrounded-tab model plausibly keeps the old worker in control longer (§C) — not device-verified | ⚠️ same as Safari (shared WebKit engine on iOS) | ⚠️ same as iPhone Safari | ⚠️ same trigger condition, likely lower probability given more aggressive tab discarding (§C) — not device-verified |
| New tab (as a recovery attempt) | ⚠️ still claimed by the same active SW (`clients.claim()`) — recovery is incidental, not guaranteed (§C) | ⚠️ same, plausibly less likely to have already timed out to a fresh worker | ⚠️ same | ⚠️ same | ⚠️ same, but old worker more likely already replaced by tab-discard timing |
| Deployment of a fix — does it reach the user automatically? | ❌ requires banner-click or all-tabs-closed on every platform — not automatic anywhere (§A4) | ❌ same | ❌ same | ❌ same | ❌ same |
| Session/CSRF cookie eviction | Not applicable — Android Chrome doesn't implement ITP-style eviction | ⚠️ plausible per Safari's ITP model (§B) — not device-verified | ⚠️ same (WebKit-based) | ⚠️ same | Not applicable |

**Every row's core dead-end (❌) is platform-uniform and code-confirmed.**
The ⚠️ rows are exactly where this report is explicit that the conclusion
requires real-device verification — they represent *how often* and *how
long* the same underlying gap gets exposed per platform, not a different
bug per platform.

---

## What this report does not do

Per the constraints given: no code has been changed, nothing committed,
no production configuration touched, and no `window.location.reload()`
blanket-fix has been proposed or applied. §G/§H are a proposed direction for
your review, not an implementation. Device-level reproduction (§14 of the
original request) was not performed — no physical iOS/Android hardware was
available in this environment; every cross-platform claim is explicitly
labeled code-analysis-based versus reproduction-based throughout, as
required.

Awaiting your review and go-ahead before any implementation work begins.
