Working in the current worktree (.worktrees/restructure-quran-module, branch restructure/quran-module).

A full read-only audit has been completed and written to:

`docs/cross-platform-error-recovery-audit.md`

The audit covered:

* Laravel exception/error handling
* Inertia + React error lifecycle
* service worker/caching/deployment versioning
* sessions/cookies/CSRF
* data/API failure and dead-end recovery
* Android Chrome
* iOS Safari/iOS browsers
* desktop browsers

The audit found that this is **not primarily an iOS problem**.

The core issue is architectural and affects all browsers, with iOS appearing more susceptible to becoming stuck because of browser/page lifecycle behavior.

The strongest confirmed findings are:

1. Laravel has custom application-aware handling for 404, but 419, 401, 403, 500, 502/503 and similar failures can fall through to Laravel's raw framework error pages.

2. Those raw error responses do not carry the expected Inertia response headers. During an Inertia navigation, the installed Inertia client therefore treats the response as an invalid/non-Inertia response and uses its default error handling behavior rather than performing a useful application recovery.

3. The current Inertia behavior can result in a dismiss-only error overlay rather than giving the user a reliable retry/reload/recovery path.

4. The application has a service worker at `public/sw.js` with build/version-based caching.

5. The current service worker update lifecycle means an old worker can continue controlling pages until the user takes the appropriate action or all tabs are closed.

6. The service worker can fall back to a build-time cached application shell during network failures.

7. That cached shell can reference old hashed JS/CSS assets which have subsequently been removed by a new deployment.

8. This means a user can potentially remain on an obsolete/broken application version even after the server has been fixed and a new deployment has completed.

9. Session/CSRF configuration itself does not appear to be the primary root cause, although CSRF/session recovery has gaps that should be addressed as part of the recovery architecture.

10. The final solution must work across Android, iOS, iPadOS and desktop, rather than being an iPhone-specific workaround.

Read the full audit before making changes:

`docs/cross-platform-error-recovery-audit.md`

---

# Objective

Implement a robust **cross-platform application recovery architecture** so that a temporary server, session, frontend, deployment, or data failure cannot leave a parent permanently trapped on a broken page.

The application should recover gracefully on:

* Android phones
* iPhones
* Android tablets
* iPads
* desktop Chrome/Edge
* other modern browsers where reasonably supported

A parent should never need to understand:

* 419 errors
* CSRF
* cookies
* service workers
* browser caches
* Inertia
* deployments
* stale JS bundles

The application should handle recovery itself.

---

# Phase 1 — Fix the service worker/deployment architecture

Start here.

Inspect the current `public/sw.js` and the audit findings carefully.

The service worker must not be capable of trapping users on an obsolete application shell whose hashed assets no longer exist.

Determine the safest architecture for this application.

Specifically address:

### A. Service worker version updates

Ensure a newly deployed application can cause the active service worker to update promptly rather than depending on:

* the user noticing a banner
* the user manually taking an action
* every tab being closed

Do not blindly call `skipWaiting()` without understanding the consequences.

Determine the correct lifecycle for this application.

### B. Old cache cleanup

Ensure old application caches cannot remain the source of an unusable application shell after deployment.

### C. Hashed asset safety

Do not allow the service worker to serve an old HTML/application shell that references JS/CSS assets that have already been removed from the server.

This is especially important because Vite uses hashed asset filenames.

### D. Network failure fallback

Review the current fallback behavior.

A network failure should not automatically mean:

> serve an obsolete application shell

if that shell may no longer be compatible with the currently deployed assets.

Determine whether the fallback should instead:

* use a safe offline page
* use only known-compatible cached assets
* retry the network
* bypass the service worker
* or use another strategy

The correct choice should be based on the application's actual requirements.

### E. Navigation requests vs static assets

Treat these differently.

Do not blindly cache all HTML/application navigation responses.

Be especially careful with:

* authenticated Inertia pages
* dynamic application responses
* error responses

Static hashed assets can generally be cached much more aggressively than authenticated/dynamic HTML.

---

# Phase 2 — Make Laravel errors application-aware

Audit and implement appropriate error handling for:

* 401
* 403
* 404
* 419
* 422
* 429
* 500
* 502
* 503

The goal is not necessarily to turn every HTTP error into an Inertia page.

The goal is that the browser/client receives an error response in a way that allows the application to provide a sensible recovery path.

Determine the correct Laravel + Inertia architecture for each category.

For example:

### 419

Treat as a potentially recoverable session/CSRF problem.

A user should be able to recover without being permanently stranded.

Consider:

* refreshing session/CSRF state
* controlled retry
* re-authentication when necessary
* redirecting to a safe application entry point

Do not blindly repeat the original request if it was a state-changing request and could result in duplicate submission.

### 401

If the session is no longer authenticated:

* transition cleanly to authentication
* preserve the intended destination where safe
* avoid redirect loops

### 403

Do not attempt automatic retries.

Provide a proper access-denied state and safe navigation.

### 404

Keep appropriate not-found behavior.

### 500/502/503

Treat as potentially temporary server failures.

Provide:

* retry
* safe navigation/home option
* useful user-facing messaging

Do not expose stack traces or implementation details.

---

# Phase 3 — Replace the current dead-end Inertia error behavior

The current behavior where a failed non-Inertia response produces a dismiss-only overlay is not acceptable for this parent-facing application.

Determine the correct global Inertia-level handling.

The user must have an obvious recovery path.

For a recoverable failure, the UI should be able to provide something conceptually like:

> "Something went wrong while loading this page."

Then:

* **Try again**
* **Go to Dashboard**

If authentication/session recovery is required:

> "Your session has expired."

Then:

* **Continue / Sign in again**

The exact UI should match the existing application's design system.

Do not create an ugly developer-style error screen.

---

# Phase 4 — Build controlled global recovery

Create a centralized recovery mechanism rather than scattering error handling throughout individual pages.

The mechanism should be capable of distinguishing at minimum:

### Recoverable transient failure

Example:

* 500
* 502
* 503
* temporary data request failure

Action:

* controlled retry
* user-visible retry option
* safe navigation

### Session/CSRF failure

Example:

* 419
* expired authentication

Action:

* refresh/re-authenticate
* retry only when safe
* never duplicate a state-changing request

### Stale frontend/application version

Example:

* Inertia version mismatch
* missing hashed JS asset
* deployment mismatch

Action:

* controlled application refresh
* ensure the browser obtains the current application version

### Authorization failure

Example:

* 403

Action:

* no automatic retry
* show access-denied state
* provide safe navigation

### Missing resource

Example:

* 404

Action:

* not-found UI
* safe navigation

### Genuine application failure

Example:

* unexpected React exception
* unexpected server exception

Action:

* useful error UI
* retry if appropriate
* safe navigation
* preserve diagnostic information in logs

---

# Phase 5 — Prevent reload loops

This is critical.

Do NOT implement:

```js
window.location.reload()
```

for every error.

If a recovery action performs a reload, implement protection against infinite loops.

For example, reason about:

* a recovery attempt counter
* a short-lived recovery marker
* sessionStorage/localStorage where appropriate
* URL/query-based recovery state if appropriate
* resetting the recovery state after successful application initialization

The exact implementation should be chosen based on the audit and existing architecture.

A failure must not produce:

> error → reload → error → reload → error → reload

---

# Phase 6 — Session and CSRF recovery

Address the session/CSRF gaps identified in the audit.

Inspect the current Axios/XSRF behavior.

Determine whether the application needs a safer recovery mechanism when:

* the CSRF cookie is missing
* the session has expired
* the CSRF token is stale
* the authentication session has changed

Do not weaken CSRF protection.

Do not disable CSRF middleware.

Do not solve the problem by making cookies less secure.

The goal is recovery while preserving Laravel's security model.

Also investigate the audit finding concerning production proxy/trusted-proxy configuration and determine whether it should be corrected.

Only make a change if the code/configuration evidence supports it.

---

# Phase 7 — Data/API failure recovery

Review the existing page-level data failure behavior.

If a page enters:

> "Data unavailable"

the application must not permanently retain that failed state.

Ensure that when the underlying endpoint recovers:

* retry can succeed
* navigation away and back can succeed
* a full reload can succeed
* application state resets correctly

Do not cache failed responses as successful application state.

If a data-fetching library is involved, use its proper invalidation/retry mechanisms rather than implementing arbitrary retries.

---

# Phase 8 — React error boundaries

Determine whether the application has an appropriate global React error boundary.

If not, consider adding one at the correct application level.

It should:

* prevent a single React rendering exception from leaving the application visually unusable
* provide a recovery action
* provide safe navigation
* log useful diagnostics where the application's existing logging architecture supports it

Do not hide real programming errors.

Do not catch everything and silently recover.

The purpose is to give the user an escape route while preserving diagnostics for developers.

---

# Phase 9 — Deployment/version resilience

Ensure a deployment cannot leave users permanently running an incompatible frontend version.

Audit the relationship between:

* Laravel deployment
* Vite build
* hashed assets
* Inertia versioning
* service worker version
* browser cache
* CDN cache

The desired behavior is:

Old application version

→ new deployment occurs

→ user navigates/reloads

→ application obtains the current compatible assets/version

rather than:

Old application version

→ old service worker remains active

→ old shell is served

→ old shell requests deleted assets

→ application remains broken indefinitely.

---

# Phase 10 — Preserve normal browser caching benefits

Do not solve the problem by disabling all caching.

Static hashed assets should still benefit from appropriate caching.

Dynamic/authenticated content should not be incorrectly cached.

The final architecture should distinguish:

* immutable versioned static assets
* dynamic HTML/Inertia responses
* authenticated responses
* API responses
* error responses
* offline fallback resources

---

# Phase 11 — Cross-platform verification

After implementation, test the recovery architecture conceptually and, where possible, in an actual browser environment.

Verify:

### Android Chrome

* 419 recovery
* 500 recovery
* data failure recovery
* stale asset recovery
* deployment recovery

### iPhone Safari

* 419 recovery
* 500 recovery
* data failure recovery
* stale asset recovery
* deployment recovery

### iPhone Chrome

Verify that the application behaves correctly despite iOS WebKit constraints.

### iPad Safari

Verify the same recovery paths.

### Desktop Chrome

Verify that normal desktop behavior remains intact.

The goal is not merely:

> "It works on iPhone."

The goal is:

> "The application has a reliable recovery architecture regardless of which supported browser/device encounters the failure."

---

# Phase 12 — Testing

Before considering the work complete, add or update automated tests where practical.

At minimum cover:

* Laravel error responses
* Inertia/non-Inertia error behavior
* 419 behavior
* authentication expiration
* 403/404 behavior
* 500/503 behavior
* recovery routes/actions
* deployment/version mismatch where testable
* service-worker behavior where practical
* data failure recovery
* protection against reload loops

For browser-specific behavior that cannot reasonably be covered by backend/unit tests, document the manual test procedure.

Do not claim that iOS-specific behavior has been physically verified unless an actual iOS browser/device was used.

---

# Verification requirements

Before finishing, demonstrate that the implementation addresses the original real-world scenario:

### Scenario

A parent opens the application on their phone.

A temporary application/server problem occurs.

They see an error.

The underlying problem is subsequently fixed and a new deployment is made.

The parent should be able to recover through normal interaction or a controlled reload/retry.

They must NOT need to:

* clear Safari cache
* clear website data
* uninstall/reinstall anything
* manually disable a service worker
* understand Laravel
* understand CSRF
* wait for every browser tab to close
* switch to Android
* contact the school administrator just because one request failed

---

# Final report

After implementation, report:

### A. What changed

List every changed file and why.

### B. Service worker changes

Explain exactly how stale/broken application versions are prevented.

### C. Laravel error handling changes

Explain how each major HTTP failure is handled.

### D. Inertia/React changes

Explain how client-side failures now recover.

### E. Session/CSRF changes

Explain what was changed and why security remains intact.

### F. Data failure changes

Explain how failed data requests recover.

### G. Cross-platform behavior

Explain expected behavior on:

* Android
* iOS
* iPadOS
* desktop

### H. Tests

List tests run and their results.

Clearly distinguish:

* automated verification
* local browser verification
* actual physical iOS/Android verification

Do not claim hardware/browser testing that was not actually performed.

### I. Remaining risks

List anything that still requires manual production verification.

---

## Constraints

Do NOT commit.

Do NOT push.

Do NOT modify production configuration directly.

Do NOT weaken CSRF/session security.

Do NOT disable security middleware.

Do NOT solve the problem with a blanket `window.location.reload()`.

Do NOT implement infinite retry/reload behavior.

Do NOT blindly disable caching.

Do NOT remove the service worker without first determining whether the application depends on its functionality.

Do NOT create an iOS-only workaround unless there is a confirmed platform-specific requirement.

Do NOT hide genuine application errors.

Preserve existing application functionality.

Prefer the smallest robust architectural change supported by the audit evidence.

Work incrementally.

After each major phase, run the relevant tests and inspect for regressions.

At the end, leave all changes uncommitted for review.
