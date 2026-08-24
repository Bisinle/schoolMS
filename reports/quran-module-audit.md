# Quran Module — Production 500 Error Audit

**Date:** 2026-08-21 (extended same day for restructure planning — see §15-§18)
**Scope:** Originally scoped to root-causing the production 500s (§1-§14): `routes/web.php` Quran group, `QuranController`, `QuranTrackingController`, `QuranHomeworkController`, `QuranHomePracticeController`, `QuranScheduleController`, `GuardianQuranTrackingController`, `QuranApiService`, Quran Eloquent models, Quran migrations, Quran Inertia pages. **Extended to a full-repo inventory** (§15) after a follow-up request for restructure-planning purposes, which surfaced additional console commands, cross-module touchpoints, and a previously-unreported multi-tenancy security gap (§16).
**Method:** Static trace of the full request lifecycle (route → middleware → controller → model → Inertia → React) plus reproduction of the container-resolution failure in this environment, corroborated by a matching stack trace already present in `storage/logs/laravel.log`. The extended pass (§15) used a repo-wide case-insensitive content grep and filename grep for "quran" across every file in the repository (excluding `vendor/`, `node_modules/`, `.git/`, `storage/`) to guarantee nothing was missed by scope, not just by keyword.

---

## 1. Executive Summary — Root Causes, Ranked

### 🔴 Root Cause #1 (confirmed, primary): Non-nullable service properties assigned `null` config values → fatal `TypeError` on controller construction

`App\Services\QuranApiService::__construct()` assigns `config('services.quran.client_id')` and `config('services.quran.client_secret')` directly into **non-nullable, typed** properties (`private string $clientId`, `private string $clientSecret`). Those config values come from env vars `QURAN_API_CLIENT_ID` / `QURAN_API_CLIENT_SECRET`, which:

- are **not set** in `.env` (local or, almost certainly, production),
- are **not even documented** in `.env.example` — meaning whoever provisioned production had no way to know these vars needed to exist.

When the env vars are missing, `config()` returns `null`, and PHP throws a fatal `TypeError` the instant the class is instantiated (not caught anywhere — there's no try/catch around the constructor).

**Why this kills "every route in the module":** `QuranApiService` is constructor-injected into three controllers — `QuranTrackingController`, `QuranHomeworkController`, and `QuranHomePracticeController`. Laravel's router resolves the controller instance **before running any middleware**, in order to check for `$this->middleware()` calls defined in the constructor (`Route::gatherMiddleware() → controllerMiddleware() → getController()`). This happens on **every single request** to any action on these controllers — `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`, and all five `/api/quran/*` endpoints — regardless of HTTP verb, regardless of auth/role state, before a single line of `auth`, `role`, or `madrasah.only` middleware runs.

These three controllers back **30 of the 41 Quran routes** (73%) — including the two most-used entry points, Quran Tracking and Quran Homework. This is why it presents as "every link in the module 500s": the two flagship features are dead on every action.

I reproduced this exact failure in this environment (`php artisan route:list` aborts with this error), and the identical stack trace already exists in `storage/logs/laravel.log`, timestamped today — see §4.

**Fix priority: P0.**

### 🟠 Root Cause #2 (confirmed, secondary): Undefined method call in `QuranHomePracticeController`

`QuranHomePracticeController::create()` (line 78) and `::edit()` (line 157) call `$this->quranApiService->getAllSurahs()`. That method **does not exist** on `QuranApiService` — the only surah-listing method is `getSurahs()`. This throws `Error: Call to undefined method App\Services\QuranApiService::getAllSurahs()`.

This bug is currently **masked** by Root Cause #1 (the controller can't even be constructed), but it will surface as a new fatal error on `/quran-home-practice/create` and `/quran-home-practice/{id}/edit` the moment #1 is fixed, unless fixed in the same pass.

**Fix priority: P0 (bundle with #1 — same PR, same deploy).**

### 🟡 Root Cause #3 (contributing, unverified): Possible incomplete migration state on production

`QuranController::index` (`/quran`, the module dashboard) and `QuranScheduleController` / `GuardianQuranTrackingController` do **not** depend on `QuranApiService`, so they are not directly hit by Root Cause #1. If the user is also seeing 500s on `/quran` itself, the most likely explanation is a **database-level** failure — e.g. `quran_tracking`, `quran_homework`, `quran_schedule`, or `quran_home_practice` tables missing/out of sync on production. I cannot verify production's migration state from this environment; see §8 for the exact command to check, and §5 for schema cross-checks (which came back clean against the current migration files).

**Fix priority: P1 — verify with `php artisan migrate:status` on production before assuming this applies.**

### 🟢 Minor findings (not causing 500s, but real bugs worth fixing while in this code)

- Argument-order bugs in `QuranTrackingController` when calling `QuranApiService::calculateTotalVerses()` and `calculatePageRange()` — swapped `verse_from`/`surah_to` positions produce silently wrong totals/page numbers (no exception, just bad data). See §2 for exact lines.
- `Quran/HomePractice/Create.jsx` and `Edit.jsx` reference `surah.name_english`, but the Quran Foundation API (and `QuranApiService::getSurahs()`) returns `name_simple`/`name_arabic`, not `name_english`. Currently unreachable because of Root Cause #2, but will render blank surah names once #2 is fixed.
- `QuranApiService`'s outbound HTTP calls have no timeout set — a slow upstream can hang PHP-FPM workers even after credentials are fixed. See §9.1.
- The module quietly depends on a **second, unrelated external API** (`api.quran.com`, via `QuranTrackingCalculator`/`QuranComApiClient`) that isn't visible from the controllers at all — it's only reached through a globally-registered model observer. It's well-guarded and not a 500 risk, but it's a fourth external host production needs egress to once RC#1 ships. Full breakdown in **§9 — External API Services**.

---

## 2. Full Request Lifecycle Trace — Primary Failing Route

Tracing `GET /quran-tracking` (`quran-tracking.index`) as the representative failing route (identical mechanism for `/quran-homework`, `/quran-home-practice`, and every sub-route of those three controllers):

```
1. HTTP request → GET /quran-tracking
2. Router matches route (routes/web.php:443)
     Route::get('/quran-tracking', [QuranTrackingController::class, 'index'])
         ->name('quran-tracking.index')
     Group middleware stack: web, auth, school.admin, school.active,
                              madrasah.only, role:admin,teacher

3. Router::runRouteWithinStack() calls gatherRouteMiddleware($route)
   BEFORE the middleware pipeline executes, to also collect any
   controller-defined middleware (Route.php:1062 controllerMiddleware()).

4. Route::getController() (Route.php:1133) resolves the controller
   via the container:
       $this->container->make(QuranTrackingController::class)

5. Container builds QuranTrackingController, sees constructor needs
   QuranApiService $quranApi, and resolves that dependency first:
       app/Http/Controllers/QuranTrackingController.php:16-19
       public function __construct(QuranApiService $quranApi)

6. Container instantiates QuranApiService:
       app/Services/QuranApiService.php:18  __construct()
       app/Services/QuranApiService.php:20
           $this->clientId = config('services.quran.client_id');
       config/services.php:39
           'client_id' => env('QURAN_API_CLIENT_ID'),   // env var unset → null

7. PHP attempts to assign NULL into a non-nullable `private string $clientId`
   (declared app/Services/QuranApiService.php:11) → FATAL TypeError,
   thrown from inside the constructor, uncaught.

8. Laravel's exception handler converts this to HTTP 500.
   *** No middleware (auth/school.active/madrasah.only/role) ever runs. ***
   *** QuranTrackingController::index() body is never reached. ***
   *** No FormRequest, no model query, no Inertia::render() happens. ***
```

Steps 3–7 are identical for every method on `QuranTrackingController`, `QuranHomeworkController`, and `QuranHomePracticeController`, because the failure is at **container resolution of the controller's constructor**, which happens once per request regardless of which action is being dispatched.

---

## 3. Routes Table (Quran module, `routes/web.php:434-513`)

All routes sit inside `Route::middleware(['auth','school.admin','school.active'])` (outer, `web.php:102`) → `Route::middleware(['madrasah.only'])` (`web.php:435`) → per-group `role:...` middleware.

| Verb | URI | Route name | Controller@Method | Model binding | Status |
|---|---|---|---|---|---|
| GET | `/quran` | `quran.index` | `QuranController@index` | — | OK (no `QuranApiService` dep) — see §1 RC#3 for a separate possible DB-level risk |
| GET | `/quran-tracking` | `quran-tracking.index` | `QuranTrackingController@index` | — | **500 — RC#1** |
| GET | `/quran-tracking/create` | `quran-tracking.create` | `QuranTrackingController@create` | — | **500 — RC#1** |
| POST | `/quran-tracking` | `quran-tracking.store` | `QuranTrackingController@store` | — | **500 — RC#1** |
| GET | `/quran-tracking/{quranTracking}/edit` | `quran-tracking.edit` | `QuranTrackingController@edit` | `QuranTracking` (implicit) | **500 — RC#1** |
| PUT | `/quran-tracking/{quranTracking}` | `quran-tracking.update` | `QuranTrackingController@update` | `QuranTracking` | **500 — RC#1** |
| DELETE | `/quran-tracking/{quranTracking}` | `quran-tracking.destroy` | `QuranTrackingController@destroy` | `QuranTracking` | **500 — RC#1** |
| GET | `/api/quran/surah/{surahNumber}` | `api.quran.surah` | `QuranTrackingController@getSurahDetails` | — | **500 — RC#1** |
| GET | `/api/quran/page/{pageNumber}/image` | `api.quran.page-image` | `QuranTrackingController@getPageImage` | — | **500 — RC#1** |
| GET | `/api/quran/page/{pageNumber}/details` | `api.quran.page-details` | `QuranTrackingController@getPageDetails` | — | **500 — RC#1** |
| GET | `/api/quran/juz` | `api.quran.juz` | `QuranTrackingController@getAllJuz` | — | **500 — RC#1** |
| GET | `/api/quran/verse/{surahNumber}/{verseNumber}` | `api.quran.verse` | `QuranTrackingController@getVerseText` | — | **500 — RC#1** |
| GET | `/quran-tracking/student/{student}/report` | `quran-tracking.student-report` | `QuranTrackingController@studentReport` | `Student` | **500 — RC#1** |
| GET | `/quran-tracking/{quranTracking}` | `quran-tracking.show` | `QuranTrackingController@show` | `QuranTracking` | **500 — RC#1** |
| GET | `/quran-homework` | `quran-homework.index` | `QuranHomeworkController@index` | — | **500 — RC#1** |
| GET | `/quran-homework/create` | `quran-homework.create` | `QuranHomeworkController@create` | — | **500 — RC#1** |
| POST | `/quran-homework` | `quran-homework.store` | `QuranHomeworkController@store` | — | **500 — RC#1** |
| GET | `/quran-homework/{quranHomework}/edit` | `quran-homework.edit` | `QuranHomeworkController@edit` | `QuranHomework` | **500 — RC#1** |
| PUT | `/quran-homework/{quranHomework}` | `quran-homework.update` | `QuranHomeworkController@update` | `QuranHomework` | **500 — RC#1** |
| DELETE | `/quran-homework/{quranHomework}` | `quran-homework.destroy` | `QuranHomeworkController@destroy` | `QuranHomework` | **500 — RC#1** |
| POST | `/quran-homework/{quranHomework}/mark-complete` | `quran-homework.mark-complete` | `QuranHomeworkController@markComplete` | `QuranHomework` | **500 — RC#1** |
| GET | `/quran-homework/student/{student}` | `quran-homework.student` | `QuranHomeworkController@studentHomework` | `Student` | **500 — RC#1** |
| GET | `/quran-homework/{quranHomework}` | `quran-homework.show` | `QuranHomeworkController@show` | `QuranHomework` | **500 — RC#1** |
| GET | `/quran-home-practice` | `quran-home-practice.index` | `QuranHomePracticeController@index` | — | **500 — RC#1** |
| GET | `/quran-home-practice/{quranHomePractice}` | `quran-home-practice.show` | `QuranHomePracticeController@show` | `QuranHomePractice` | **500 — RC#1** |
| GET | `/api/quran-home-practice/student/{student}/stats` | `quran-home-practice.student-stats` | `QuranHomePracticeController@studentStats` | — | **500 — RC#1** |
| GET | `/quran-home-practice/create` | `quran-home-practice.create` | `QuranHomePracticeController@create` | — | **500 — RC#1 (+ RC#2 once fixed)** |
| POST | `/quran-home-practice` | `quran-home-practice.store` | `QuranHomePracticeController@store` | — | **500 — RC#1** |
| GET | `/quran-home-practice/{quranHomePractice}/edit` | `quran-home-practice.edit` | `QuranHomePracticeController@edit` | `QuranHomePractice` | **500 — RC#1 (+ RC#2 once fixed)** |
| PUT | `/quran-home-practice/{quranHomePractice}` | `quran-home-practice.update` | `QuranHomePracticeController@update` | `QuranHomePractice` | **500 — RC#1** |
| DELETE | `/quran-home-practice/{quranHomePractice}` | `quran-home-practice.destroy` | `QuranHomePracticeController@destroy` | `QuranHomePractice` | **500 — RC#1** |
| GET | `/quran-schedule` | `quran-schedule.index` | `QuranScheduleController@index` | — | OK |
| GET | `/quran-schedule/create` | `quran-schedule.create` | `QuranScheduleController@create` | — | OK |
| POST | `/quran-schedule` | `quran-schedule.store` | `QuranScheduleController@store` | — | OK |
| GET | `/quran-schedule/{quranSchedule}/edit` | `quran-schedule.edit` | `QuranScheduleController@edit` | `QuranSchedule` | OK |
| PUT | `/quran-schedule/{quranSchedule}` | `quran-schedule.update` | `QuranScheduleController@update` | `QuranSchedule` | OK |
| POST | `/quran-schedule/{quranSchedule}/activate` | `quran-schedule.activate` | `QuranScheduleController@activate` | `QuranSchedule` | OK |
| POST | `/quran-schedule/{quranSchedule}/deactivate` | `quran-schedule.deactivate` | `QuranScheduleController@deactivate` | `QuranSchedule` | OK |
| DELETE | `/quran-schedule/{quranSchedule}` | `quran-schedule.destroy` | `QuranScheduleController@destroy` | `QuranSchedule` | OK |
| GET | `/quran-schedule/{quranSchedule}` | `quran-schedule.show` | `QuranScheduleController@show` | `QuranSchedule` | OK |
| GET | `/guardian/quran-tracking` | `guardian.quran-tracking` | `GuardianQuranTrackingController@index` | — | OK |

No route references a nonexistent controller, method, or model — every binding in the table resolves to a real class/method. The failure is entirely inside the dependency graph of three controllers' constructors, not in route registration itself.

---

## 4. Exact Stack Trace (from `storage/logs/laravel.log`, today's date)

This exact error is already present in this environment's log, and reproduces on demand via `php artisan route:list`:

```
[2026-08-21 18:24:50] local.ERROR: Cannot assign null to property App\Services\QuranApiService::$clientId of type string
{"exception":"[object] (TypeError(code: 0): Cannot assign null to property
App\\Services\\QuranApiService::$clientId of type string at
/home/abdiwadud/Projects/schoolMS/app/Services/QuranApiService.php:20)
[stacktrace]
#0 [internal function]: App\\Services\\QuranApiService->__construct()
#1 vendor/laravel/framework/.../Container.php(1211): ReflectionClass->newInstanceArgs()
#2 vendor/laravel/framework/.../Container.php(972): Illuminate\\Container\\Container->build()
#3 vendor/laravel/framework/.../Application.php(1078): Illuminate\\Container\\Container->resolve()
#4 vendor/laravel/framework/.../Container.php(903): Illuminate\\Foundation\\Application->resolve()
#5 vendor/laravel/framework/.../Application.php(1058): Illuminate\\Container\\Container->make()
#6 vendor/laravel/framework/.../Container.php(1379): Illuminate\\Foundation\\Application->make()
#7 vendor/laravel/framework/.../Container.php(1278): Illuminate\\Container\\Container->resolveClass()
#8 vendor/laravel/framework/.../Container.php(1201): Illuminate\\Container\\Container->resolveDependencies()
#9 vendor/laravel/framework/.../Container.php(972): Illuminate\\Container\\Container->build()
#10 vendor/laravel/framework/.../Application.php(1078): Illuminate\\Container\\Container->resolve()
#11 vendor/laravel/framework/.../Container.php(903): Illuminate\\Foundation\\Application->resolve()
#12 vendor/laravel/framework/.../Application.php(1058): Illuminate\\Container\\Container->make()
#13 vendor/laravel/framework/.../Routing/Route.php(286): Illuminate\\Foundation\\Application->make()
#14 vendor/laravel/framework/.../Routing/Route.php(1133): Illuminate\\Routing\\Route->getController()
#15 vendor/laravel/framework/.../Routing/Route.php(1062): Illuminate\\Routing\\Route->controllerMiddleware()
#16 vendor/laravel/framework/.../Routing/Router.php(834): Illuminate\\Routing\\Route->gatherMiddleware()
```

On a real HTTP request (as opposed to `route:list`), frames #16-#18 are replaced by `Router::runRouteWithinStack()` / `Router::runRoute()` / `Router::dispatchToRoute()`, but frames #1-#15 (the actual crash) are byte-for-byte identical — this is the container resolving the same constructor for the same reason.

I confirmed this is 100% reproducible in this environment on demand (not a one-off log entry) by running `php artisan route:list`, which fails with this exact error every time.

---

## 5. Controllers — Line-by-Line Findings

| File | Constructor / method | Finding |
|---|---|---|
| `app/Http/Controllers/QuranTrackingController.php:16-19` | `__construct(QuranApiService $quranApi)` | **Fatal** — pulls in `QuranApiService`, whose constructor throws (RC#1) |
| `app/Http/Controllers/QuranHomeworkController.php:15-18` | `__construct(QuranApiService $quranApi)` | **Fatal** — same as above |
| `app/Http/Controllers/QuranHomePracticeController.php:15-18` | `__construct(QuranApiService $quranApiService)` | **Fatal** — same as above |
| `app/Http/Controllers/QuranHomePracticeController.php:78` | `create()` | Calls `$this->quranApiService->getAllSurahs()` — **method does not exist** on `QuranApiService` (only `getSurahs()` is defined, line 132 of the service). Would throw `Error` once RC#1 is fixed. |
| `app/Http/Controllers/QuranHomePracticeController.php:157` | `edit()` | Same undefined-method call as above. |
| `app/Http/Controllers/QuranTrackingController.php:83-88` | `index()` | Calls `calculateTotalVerses($surah_from, $verse_from, $surah_to, $verse_to)` — service signature is `calculateTotalVerses(surahFrom, surahTo, verseFrom, verseTo)` (`QuranApiService.php:313`). **Arguments 2 and 3 are swapped.** Produces wrong verse counts silently (no exception — all args are `int`). |
| `app/Http/Controllers/QuranTrackingController.php:192-197` | `store()` | Same argument-order bug. |
| `app/Http/Controllers/QuranTrackingController.php:260-265` | `show()` | Same argument-order bug. |
| `app/Http/Controllers/QuranTrackingController.php:361-366` | `update()` | Same argument-order bug. |
| `app/Http/Controllers/QuranTrackingController.php:428-433` | `studentReport()` | Calls `calculatePageRange($surah_from, $verse_from, $surah_to, $verse_to)` — service signature is `calculatePageRange(surahFrom, surahTo, verseFrom, verseTo)` (`QuranApiService.php:229`). Same swap bug — and this one **writes the wrong page numbers back to the database** via `$record->update([...])` (line 437-440) for any legacy record missing `page_from`/`page_to`. |
| `app/Http/Controllers/QuranTrackingController.php:456-461` | `studentReport()` | `calculateTotalVerses` swap bug, same pattern. |
| `app/Http/Controllers/QuranController.php` (whole file) | `index()` | No `QuranApiService` dependency. Queries `QuranTracking`, `QuranHomework`, `QuranSchedule`, `QuranHomePractice` directly. All accessors used (`full_name`, `reading_type_label`) exist. Clean — not affected by RC#1. Only remaining risk is RC#3 (table existence on production). |
| `app/Http/Controllers/QuranScheduleController.php` (whole file) | all methods | No `QuranApiService` dependency. Authorization checks (`$user->role === 'teacher' && ...`) are done inline, no Gate/Policy used, no bug found. |
| `app/Http/Controllers/GuardianQuranTrackingController.php` (whole file) | `index()` | No `QuranApiService` dependency. Guards on `isGuardian()`, `guardian` relation, `school_type`. No bug found. |

No dedicated `FormRequest` classes exist for the Quran module — all controllers validate inline via `$request->validate([...])`. Nothing here throws (rules reference real columns), so this is not a contributing cause, just worth noting since the task asked to check.

---

## 6. Models

| Model | Table | Fillable / casts | Relationships | Finding |
|---|---|---|---|---|
| `App\Models\QuranTracking` | `quran_tracking` | Matches migration columns exactly (`surah_from`, `surah_to`, `verse_from`, `verse_to`, `page_from`, `page_to`, `pages_memorized`, `surahs_memorized`, `juz_memorized`, `subac_participation`) | `student()` → `Student`, `teacher()` → `User`, `school()` → `School`, `assessment()` → `QuranAssessment` (hasOne) | OK |
| `App\Models\QuranHomework` | `quran_homework` | Matches migration columns | `student()`, `teacher()`, `school()` | OK |
| `App\Models\QuranSchedule` | `quran_schedules` (Eloquent default plural, no explicit `$table`) | Matches migration columns | `student()`, `teacher()`, `school()` | OK — `getProgressPercentageAttribute()`/`getCurrentProgressAttribute()` call `$this->student->quranTracking()`, which requires `Student::quranTracking()` to exist (confirmed present, used elsewhere in `QuranTrackingController`) |
| `App\Models\QuranHomePractice` | `quran_home_practice` | Matches migration columns | `student()`, `guardian()` → `Guardian`, `school()` | OK |
| `App\Models\QuranAssessment` | `quran_assessments` | Matches migration columns | `quranTracking()` → `QuranTracking` (belongsTo) | OK |

Table names, foreign keys, and columns all cross-check cleanly against the migrations in §7 — **no schema drift found for any Quran model.** This rules out "renamed column" as a contributing cause.

---

## 7. Database / Migrations

| Migration file | Table | Notes |
|---|---|---|
| `2025_11_22_140000_create_quran_tracking_table.php` | `quran_tracking` | Original schema, single `surah` column |
| `2025_11_22_150000_update_quran_tracking_for_multi_surah.php` | `quran_tracking` | Renames `surah` → `surah_from`, adds `surah_to` — matches current model usage |
| `2025_11_25_100001_set_default_pages_quran_tracking.php` | `quran_tracking` | Backfills nulls to `0`, adds column defaults for `page_from/to`, `pages_memorized`, `surahs_memorized`, `juz_memorized` |
| `2025_11_25_100003_require_pages_quran_tracking.php` | `quran_tracking` | Makes those same 5 columns `NOT NULL`. Comment says "run only after `php artisan quran:backfill-pages`" — but since migration `100001` already backfills nulls→0 unconditionally first, this migration is self-contained and will not fail even if that artisan command was never run. Not a 500 risk, but check §8 for a residual data-quality concern. |
| `2025_12_08_000001_create_quran_assessments_table.php` | `quran_assessments` | FK to `quran_tracking` |
| `2025_12_08_000002_create_quran_homework_table.php` | `quran_homework` | FK to `students`, `users`, `schools` |
| `2025_12_08_000003_create_quran_home_practice_table.php` | `quran_home_practice` | FK to `students`, `guardians`, `schools` |
| `2025_12_08_000004_create_quran_schedules_table.php` | `quran_schedules` | FK to `students`, `users`, `schools` |

All 8 migrations are present in the repo and internally consistent with the models. **I cannot confirm from this environment whether all 8 have actually been run on the production database** — that must be checked directly on the production host (see §8 command). If any are missing, `QuranController::index` and `QuranScheduleController`/`GuardianQuranTrackingController` (the routes *not* affected by RC#1) would also 500 with a `SQLSTATE[42S02]: Base table or view not found` error — which would fully explain "every route" if that turns out to be the case.

---

## 8. Environment / Production-Specific Causes

| Check | Result |
|---|---|
| `QURAN_API_CLIENT_ID` / `QURAN_API_CLIENT_SECRET` in `.env.example` | **Absent.** Never documented as required. |
| `QURAN_API_CLIENT_ID` / `QURAN_API_CLIENT_SECRET` in local `.env` | **Absent** (0 matches). |
| `config/services.php:38-42` | References `env('QURAN_API_CLIENT_ID')`, `env('QURAN_API_CLIENT_SECRET')`, `env('QURAN_API_ENVIRONMENT', 'production')` — the last one has a safe default, the first two do not. |
| Config cache (`php artisan config:cache`) | If production has a cached config (`bootstrap/cache/config.php`) built at a time these vars were also absent, `config:cache` won't be the cause — the underlying value is null either way. If they *were* since added to production `.env` but `config:cache` was never re-run, that alone would also explain this (stale cached `null` shadows the new env var). Worth ruling out — see recommended commands below. |
| Route cache (`php artisan route:cache`) | Not implicated — the failure is in container resolution of a constructor argument, not in route matching, so a stale route cache would not cause or fix this. |
| Queue / scheduled jobs | Quran module has no queued jobs or scheduled commands. Not implicated. |
| Storage symlink | Not used by this module (no file uploads; images/audio are all external CDN URLs from `qurancdn.com`). Not implicated. |
| Composer packages | No Quran-specific PHP package (`barryvdh/laravel-dompdf` is present but used by the unrelated Invoices module). No missing/version-mismatched dependency found. |
| npm packages | No Arabic-text-rendering, audio-player, or Quran-specific JS package in `package.json` — the frontend renders Arabic strings as plain UTF-8 text and page images via `<img>` tags pointed at `cdn.qurancdn.com`. Nothing to install/version-match. |

**Recommended production diagnostic commands** (read-only, safe to run):
```bash
php artisan route:list --except-vendor 2>&1 | head -5   # will reproduce the exact TypeError if RC#1 is present
php artisan tinker --execute="dd(config('services.quran'))"   # confirm both values are null on production
php artisan migrate:status | grep -i quran   # confirm all 8 migrations above show "Ran"
grep -i quran /path/to/production/.env       # confirm whether the vars exist at all in prod
```

---

## 9. External API Services — Full Audit

This module actually depends on **two independent, unrelated external Quran API integrations**, not one. The first (`QuranApiService`) is the one already covered in §1/§4 as Root Cause #1. The second (`QuranComApiClient`) was not surfaced by the initial pass and is documented here.

### 9.1 Integration A — Quran Foundation API (`App\Services\QuranApiService`)

| | |
|---|---|
| Hosts | `oauth2.quran.foundation` (token endpoint, production) / `prelive-oauth2.quran.foundation` (pre-prod) — `apis.quran.foundation/content/api/v4` (content API, production) / `apis-prelive.quran.foundation/content/api/v4` (pre-prod) — selected by `QURAN_API_ENVIRONMENT` |
| Auth | OAuth2 client-credentials grant (`grant_type=client_credentials`, `scope=content`), HTTP Basic Auth with `QURAN_API_CLIENT_ID`/`QURAN_API_CLIENT_SECRET`, token cached 1 hour (`QuranApiService.php:40`, `TOKEN_TTL`) |
| Consumers | `QuranTrackingController`, `QuranHomeworkController`, `QuranHomePracticeController` (constructor-injected) |
| Used for | Surah list/detail, verse text (`text_uthmani`/`text_imlaei`), page-to-verse mapping, page image URLs (CDN, not this API) |
| Status | **Broken — Root Cause #1.** Cannot authenticate because credentials are unset; this is also the class whose constructor crashes before any HTTP call is even attempted (§1, §4). |
| Timeout handling | **None set.** Every `Http::` call in this file (`withBasicAuth()->asForm()->post()` at line 43-48, `withHeaders()->get()` at line 81-84) has no `->timeout()`. If `oauth2.quran.foundation`/`apis.quran.foundation` is slow or unreachable — separately from the credential bug — these calls can hang for PHP's/webserver's full default timeout, tying up a PHP-FPM worker per concurrent request. This is a **second, independent production risk** on top of RC#1: even after credentials are fixed, a slow upstream can degrade the app under load instead of failing fast. Recommend adding `->timeout(10)` (matching the pattern already used correctly in `QuranComApiClient`, see 9.2) and `->retry(2, 200)` if desired. |
| Error handling | Every public method (`getSurahs()`, `getAyah()`, `getPageDetails()`, etc.) wraps its call in try/catch and logs + returns `[]`/`null` on failure — good defensive pattern, **but only protects against calls made after construction**; it cannot protect against the constructor itself throwing (RC#1). |
| Image CDN | `getPageImageUrl()` (line 110-127) returns a hardcoded `https://cdn.qurancdn.com/images/{width}/page{n}.png` URL — no API call, no auth, just string building. Not a failure risk; the frontend `<img>` tag will simply 404/broken-image if the CDN path is ever wrong, not a backend 500. |

### 9.2 Integration B — Quran.com public API (`App\External\QuranComApiClient`)

This is a **completely separate client the initial pass missed** — it doesn't share any code path with `QuranApiService` and talks to a different domain entirely.

| | |
|---|---|
| Host | `https://api.quran.com/api/v4` (Quran.com's public API — no relation to the Quran Foundation API in 9.1) |
| Auth | **None required** — this is a public, unauthenticated API. No env vars needed, no credential risk. |
| Binding | `App\Providers\AppServiceProvider::register()` (`AppServiceProvider.php:55`): `$this->app->bind(QuranApiClient::class, QuranComApiClient::class)` — binds the `App\External\QuranApiClient` interface to this concrete class. Lazy binding (not a singleton, not eager) — does not run at boot, only when something actually requests `QuranApiClient` from the container. |
| Consumers | `App\Services\QuranTrackingCalculator` (`QuranTrackingCalculator.php:16`, constructor-injected via the `QuranApiClient` interface) → consumed by `App\Observers\QuranTrackingObserver` (`QuranTrackingObserver.php:22`, resolved via `App::make(QuranTrackingCalculator::class)` in the observer's own constructor) |
| Used for | `getJuzPageRanges()` (juz→page-range mapping, cached 24h, falls back to hardcoded `getFallbackJuzRanges()` table on any failure), `getPageForAyah()` (verse→page lookup, cached 24h, returns `null` on failure), `getSurahMetadata()`/`getSurah()` (defined on the interface but **not currently called by `QuranTrackingCalculator`** — dead surface on this client) |
| Timeout handling | **Correctly set** — every call uses `Http::timeout(10)->get(...)` (`QuranComApiClient.php:26, 151, 179`). This is the right pattern; §9.1 should be brought in line with it. |
| Error handling | Every method wraps its HTTP call in try/catch, logs a warning/error, and returns a safe fallback (`getFallbackJuzRanges()`'s static table, or `null`/`[]`). **This client cannot 500 the app** — it is defensively coded end-to-end. |
| Where it actually fires | `QuranTrackingObserver::creating()` and `::updating()` hooks — registered globally on the `QuranTracking` model in `AppServiceProvider::boot()` (`QuranTrackingObserver::class`) — call `QuranTrackingCalculator::computeAllMetrics()`, which calls into this client to auto-derive `pages_memorized`/`surahs_memorized`/`juz_memorized` on every `QuranTracking::create()`/`->update()`. In the current codebase that means `QuranTrackingController::store()` (line 215) and `::update()` (line 382) — both currently unreachable due to RC#1, so **this entire code path is dormant right now**, not contributing to today's 500s. It will become live traffic to `api.quran.com` the moment RC#1 is fixed. |

### 9.3 Cross-cutting findings from the external-API audit

1. **Two unrelated Quran API vendors are integrated in parallel, with no shared code.** `QuranApiService` (Quran Foundation, authenticated) computes verse ranges and total verses. `QuranTrackingCalculator`/`QuranComApiClient` (Quran.com, public) independently computes page counts and juz coverage for the *same* `QuranTracking` records, using a *different* upstream. There is also a **third, hardcoded copy** of the 30-juz page-range table, duplicated in `QuranApiService::getStandardJuzData()` (lines 361-409) and again in `QuranComApiClient::getFallbackJuzRanges()` (lines 91-125) — same data, two places, drift risk if the standard Mushaf pagination reference ever needs correcting. Not a 500 cause, but a maintainability/data-integrity finding worth flagging given the "full audit" scope.
2. **Production egress requirement:** fixing RC#1 makes the app dependent on outbound HTTPS access to **four** external hosts: `oauth2.quran.foundation`, `apis.quran.foundation`, `cdn.qurancdn.com`, and `api.quran.com`. If production runs behind an egress firewall/allowlist, all four need to be reachable — `api.quran.com` in particular is easy to miss since it's only reached indirectly through the Observer, not through any controller import.
3. **No API versioning/deprecation risk found** — both integrations pin `/v4`/`/content/api/v4` explicitly rather than an unversioned path.
4. **Only Integration A (9.1) is implicated in today's 500s.** Integration B (9.2) is real, live-registered code, but it is fully guarded and currently unreachable — it does not need to be "fixed" to resolve the outage, only to be aware of once RC#1 ships, since it starts making real outbound calls to a fourth host at that point.

---

## 10. Inertia / React Findings

| Component | Props expected (JSX destructuring) | Props sent by controller | Match? |
|---|---|---|---|
| `resources/js/Pages/Quran/Index.jsx:5` | `{ auth, stats, recentSessions }` | `QuranController::index` sends `stats`, `recentSessions` (`auth` comes from `HandleInertiaRequests` shared data) | ✅ |
| `resources/js/Pages/Quran/Tracking/Index.jsx:147` | `{ students, grades, filters, auth }` | `QuranTrackingController::index` sends `students`, `grades`, `filters` | ✅ (unreachable due to RC#1) |
| `resources/js/Pages/Quran/Tracking/Show.jsx:8` | `{ tracking, studentStats, auth }` | `QuranTrackingController::show` sends `tracking`, `studentStats` | ✅ (unreachable due to RC#1) |
| `resources/js/Pages/Quran/Homework/Create.jsx:6` | `{ students, surahs }` — reads `surah.name_simple`, `surah.name_arabic` | `QuranHomeworkController::create` sends `students`, `surahs` (+ `preSelectedStudentId`, unused by this component but harmless) | ✅ shape matches `QuranApiService::getSurahs()` output field names |
| `resources/js/Pages/Quran/HomePractice/Create.jsx:6` | `{ students, surahs }` — reads **`surah.name_english`** | `QuranHomePracticeController::create` never successfully returns `surahs` because of RC#2 (`getAllSurahs()` doesn't exist) | ⚠️ Even once RC#2 is fixed to call `getSurahs()`, the real API response has no `name_english` field (`name_simple`/`name_arabic` only) — surah names will render blank. |
| `resources/js/Pages/Quran/Schedule/Index.jsx:7` | `{ auth, schedules, students, filters }` | `QuranScheduleController::index` sends `schedules`, `students`, `filters` | ✅ |
| `resources/js/Pages/Guardians/QuranTracking/Index.jsx:6` | `{ students }` | `GuardianQuranTrackingController::index` sends `students` | ✅ |

`HandleInertiaRequests::share()` (`app/Http/Middleware/HandleInertiaRequests.php`) was inspected in full — it does not touch anything Quran-specific, queries `School` with a safe `select()`/`find()`, and every array key it builds is guarded (`$user ? [...] : null`, `?? true`, etc.). **It is not a contributing cause and does not throw during the request lifecycle.**

---

## 11. Middleware

Full stack applied to every Quran route, in execution order:
`web` (global) → `auth` → `school.admin` → `school.active` → `madrasah.only` → `role:<roles>`

| Middleware | Alias → Class | Registered in | Finding |
|---|---|---|---|
| `auth` | Laravel built-in | `bootstrap/app.php` | Standard, no custom logic |
| `school.admin` | `App\Http\Middleware\SchoolAdminMiddleware` | `bootstrap/app.php:33` | Clean — redirects/aborts only, no exceptions possible on the paths exercised |
| `school.active` | `App\Http\Middleware\CheckSchoolActive` | `bootstrap/app.php:32` | Clean — wraps its own DB check in try/catch and **fails open** (`Log::warning` + proceed) if the check itself errors, so this middleware cannot be the source of a 500 |
| `madrasah.only` | `App\Http\Middleware\CheckMadrasahSchool` | `bootstrap/app.php:34` | Clean — `abort(404)` for non-madrasah schools/super admins, not a 500 |
| `role:...` | `App\Http\Middleware\RoleMiddleware` | `bootstrap/app.php:29` | Clean — `abort(403)` for wrong role, `redirect()->route('login')` if unauthenticated |

**Middleware ordering is correct and none of these five throw uncaught exceptions.** More importantly — as established in §2 — the entire middleware pipeline never even begins executing for the 30 affected routes, because the fatal error happens one step earlier, during controller resolution. This rules out middleware as a cause for RC#1, and confirms none of the middleware itself is buggy.

---

## 12. File Inspection Table

| File | Purpose | Issue Found |
|---|---|---|
| `routes/web.php:434-513` | Quran route definitions | OK (routes correctly reference existing controllers/methods) |
| `bootstrap/app.php` | Middleware alias registration | OK |
| `app/Http/Controllers/QuranController.php` | Module dashboard | OK |
| `app/Http/Controllers/QuranTrackingController.php` | Tracking CRUD + API endpoints | **Fatal DI failure (RC#1)**; argument-order bugs in 5 methods (§5) |
| `app/Http/Controllers/QuranHomeworkController.php` | Homework CRUD | **Fatal DI failure (RC#1)** |
| `app/Http/Controllers/QuranHomePracticeController.php` | Home practice CRUD | **Fatal DI failure (RC#1)**; undefined method `getAllSurahs()` (RC#2) at lines 78, 157 |
| `app/Http/Controllers/QuranScheduleController.php` | Schedule CRUD | OK |
| `app/Http/Controllers/GuardianQuranTrackingController.php` | Guardian read-only view | OK |
| `app/Services/QuranApiService.php` | Wraps Quran Foundation API (Integration A, §9.1) | **Root cause (RC#1)** — non-nullable typed properties assigned null config at lines 11-12, 20-21; also no HTTP timeout set (§9.1) |
| `app/External/QuranApiClient.php` | Interface for the second (Quran.com) API client | OK — clean contract, 4 methods |
| `app/External/QuranComApiClient.php` | Concrete Quran.com API client (Integration B, §9.2) | OK — defensively coded, timeouts set, safe fallbacks; currently dormant (blocked upstream of it by RC#1) |
| `app/Services/QuranTrackingCalculator.php` | Computes pages/surahs/juz metrics via `QuranApiClient` | OK — every method try/catches and defaults to `0`/`null` on failure |
| `app/Observers/QuranTrackingObserver.php` | Auto-populates tracking metrics + auto-completes matching homework on `creating`/`updating`/`created` | OK — wraps both hooks in try/catch, sets safe defaults on failure; registered globally in `AppServiceProvider::boot():70` |
| `app/Providers/AppServiceProvider.php` | Registers `QuranApiClient → QuranComApiClient` binding (line 55) + the `QuranTrackingObserver` (line 70) | OK — lazy binding, no eager resolution, not implicated in RC#1 |
| `config/services.php:38-42` | `quran` config block | OK structurally, but sources undocumented/unset env vars |
| `.env.example` | Documents required env vars | **Missing `QURAN_API_CLIENT_ID`/`QURAN_API_CLIENT_SECRET`** entirely |
| `app/Models/QuranTracking.php` | Eloquent model | OK — matches migrations |
| `app/Models/QuranHomework.php` | Eloquent model | OK — matches migrations |
| `app/Models/QuranSchedule.php` | Eloquent model | OK — matches migrations |
| `app/Models/QuranHomePractice.php` | Eloquent model | OK — matches migrations |
| `app/Models/QuranAssessment.php` | Eloquent model | OK — matches migrations |
| `database/migrations/2025_11_22_140000_create_quran_tracking_table.php` | Schema | OK |
| `database/migrations/2025_11_22_150000_update_quran_tracking_for_multi_surah.php` | Schema | OK — renames verified consistent with model |
| `database/migrations/2025_11_25_100001_set_default_pages_quran_tracking.php` | Schema | OK |
| `database/migrations/2025_11_25_100003_require_pages_quran_tracking.php` | Schema | OK (self-contained despite comment implying an order dependency) |
| `database/migrations/2025_12_08_000001_create_quran_assessments_table.php` | Schema | OK |
| `database/migrations/2025_12_08_000002_create_quran_homework_table.php` | Schema | OK |
| `database/migrations/2025_12_08_000003_create_quran_home_practice_table.php` | Schema | OK |
| `database/migrations/2025_12_08_000004_create_quran_schedules_table.php` | Schema | OK |
| `app/Http/Middleware/CheckMadrasahSchool.php` | `madrasah.only` middleware | OK |
| `app/Http/Middleware/RoleMiddleware.php` | `role:*` middleware | OK |
| `app/Http/Middleware/CheckSchoolActive.php` | `school.active` middleware | OK (fails open by design) |
| `app/Http/Middleware/SchoolAdminMiddleware.php` | `school.admin` middleware | OK |
| `app/Http/Middleware/HandleInertiaRequests.php` | Shared Inertia data | OK, not Quran-specific but verified clean |
| `resources/js/Pages/Quran/Index.jsx` | Dashboard page | OK, props match |
| `resources/js/Pages/Quran/Tracking/Index.jsx` | Tracking list | OK, props match |
| `resources/js/Pages/Quran/Tracking/Show.jsx` | Tracking detail | OK, props match |
| `resources/js/Pages/Quran/Homework/Create.jsx` | Homework form | OK, `surah.name_simple`/`name_arabic` match API shape |
| `resources/js/Pages/Quran/HomePractice/Create.jsx` | Home practice form | ⚠️ reads `surah.name_english`, a field the API never returns |
| `resources/js/Pages/Quran/HomePractice/Edit.jsx` | Home practice edit form | ⚠️ same `name_english` issue |
| `resources/js/Pages/Quran/Schedule/Index.jsx` | Schedule list | OK, props match |
| `resources/js/Pages/Guardians/QuranTracking/Index.jsx` | Guardian view | OK, props match |
| `app/Console/Commands/TestQuranApi.php` | `php artisan quran:test` diagnostic command | OK as written — also depends on `QuranApiService`, so it will fail with the same TypeError; useful as a post-fix smoke test |
| `storage/logs/laravel.log` | Production/local error log | Contains the exact matching stack trace, confirming this is a live, reproduced failure, not a hypothesis |

---

## 13. Fix Recommendations (Priority Order)

### P0 — Fixes required before the module will load at all

**1. Make `QuranApiService` fail safely instead of fatally, and set the missing env vars.**
File: `app/Services/QuranApiService.php:11-12, 20-21`

- Immediate code fix — make the properties nullable (or give them empty-string defaults) so a missing credential degrades gracefully instead of crashing the container:
  ```php
  private ?string $clientId = null;
  private ?string $clientSecret = null;
  ```
  This alone converts a hard 500 on every request into the app booting normally; API calls that actually need the token will still fail, but only when invoked, and `getSurahs()`/`getAllJuz()`/etc. already catch exceptions and return safe defaults (`[]`/`null`) — so most of the module becomes usable immediately even without valid credentials.
- **Also required (not optional):** obtain real OAuth2 client credentials from the Quran Foundation and set them in production:
  ```
  QURAN_API_CLIENT_ID=<value>
  QURAN_API_CLIENT_SECRET=<value>
  QURAN_API_ENVIRONMENT=production
  ```
  Without real credentials, `getSurahs()`, `getPageDetails()`, `getVerseText()`, etc. will keep returning empty results (surah dropdowns empty, page/verse lookups return 404) — the app won't 500, but the module will be functionally broken.
- Add these three vars to `.env.example` so this can never silently happen again in another environment.

**2. Fix the undefined method call in `QuranHomePracticeController`.**
File: `app/Http/Controllers/QuranHomePracticeController.php:78, 157`
Change `$this->quranApiService->getAllSurahs()` → `$this->quranApiService->getSurahs()` in both places.

**3. Add HTTP timeouts to `QuranApiService`'s outbound calls (§9.1).**
File: `app/Services/QuranApiService.php:43, 81`
Neither the OAuth token request nor the content API request has a timeout set. Add `->timeout(10)` to both `Http::withBasicAuth(...)` (line 43) and `Http::withHeaders(...)` (line 81), matching the pattern already used correctly in `app/External/QuranComApiClient.php`. This is independent of RC#1 — without it, a slow/unreachable `oauth2.quran.foundation` or `apis.quran.foundation` can hang PHP-FPM workers instead of failing fast, even after credentials are fixed.

### P1 — Verify before assuming fixed

**4. Confirm production migration state.**
Run `php artisan migrate:status | grep -i quran` on production. If any of the 8 migrations in §7 show "Pending", run:
```bash
php artisan migrate --force
```
This directly determines whether Root Cause #3 (§1) is real or moot.

**5. Re-cache config after setting the env vars.**
```bash
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan route:cache
```
Run `config:clear` before `config:cache` specifically — if production is currently serving a config cache built while the vars were absent, adding them to `.env` alone won't take effect until the cache is rebuilt.

**6. Smoke-test with the existing diagnostic command.**
```bash
php artisan quran:test
```
`app/Console/Commands/TestQuranApi.php` already exercises `getSurahs()` end-to-end — use it to confirm the real API credentials work before declaring the incident closed. Note this only smoke-tests Integration A (§9.1); Integration B (§9.2, `api.quran.com`) has no dedicated CLI test — its first live production traffic will be the first real `QuranTracking::create()`/`update()` call after RC#1 ships, so watch `storage/logs/laravel.log` for `QuranTrackingObserver:` / `Failed to compute Juz by pages` entries in the hour after deploy.

### P2 — Data-quality bugs, not urgent but real

**7. Fix swapped argument order in verse/page calculations.**
File: `app/Http/Controllers/QuranTrackingController.php` — lines 83-88, 192-197, 260-265, 361-366 (`calculateTotalVerses`), and 428-433, 456-461 (`calculatePageRange`).
Service signatures (`app/Services/QuranApiService.php:229, 313`) take `(surahFrom, surahTo, verseFrom, verseTo)`; the controller is passing `(surahFrom, verseFrom, surahTo, verseTo)` everywhere. Swap arguments 2 and 3 at each call site. Note line 437-440 of `studentReport()` **persists** the wrong values to the database via `->update()` for legacy records — after fixing the argument order, consider re-running the backfill for any records touched while the bug was live.

**8. Fix the `name_english` prop mismatch.**
Files: `resources/js/Pages/Quran/HomePractice/Create.jsx`, `Edit.jsx`
Change `surah.name_english` → `surah.name_simple` to match the actual API response shape (already used correctly in `Quran/Homework/Create.jsx`).

**9. De-duplicate the juz page-range table (§9.3.1).**
`QuranApiService::getStandardJuzData()` (lines 361-409) and `QuranComApiClient::getFallbackJuzRanges()` (lines 91-125) hardcode the same 30-entry juz→page mapping independently. Consider extracting to a single shared config/data source so the two integrations can't drift apart.

---

## 14. What Was Ruled Out

To be explicit about the negative results, since a thorough audit needs to show what was checked and came back clean:

- No route references a missing/renamed controller, method, or model.
- No FormRequest `authorize()` misconfiguration (no dedicated FormRequests exist for this module at all).
- No model relationship points at a nonexistent table/column — every model's fillable/casts/relationships cross-check cleanly against the 8 migration files.
- No middleware in the stack throws an uncaught exception; ordering is correct; `school.active` explicitly fails open by design.
- `HandleInertiaRequests` shared-data merge is null-safe throughout and not implicated.
- No missing composer/npm dependency specific to this module (no Arabic-rendering, audio, or PDF package required by any Quran file).
- Route/config caching mechanics are not themselves broken — they would only matter if production has a stale cache from *before* the env vars were correctly set (see P1 fix #5).
- The second external API integration (`QuranComApiClient` / `api.quran.com`, §9.2) is not a 500 risk — every call is wrapped, timed out, and falls back safely. It is dormant only because RC#1 blocks the code path upstream of it, not because it is itself broken.

---

## 15. Extended Module Inventory (Restructure Planning)

The original audit (§1-§14) was deliberately scoped to whatever the 500 could reach: the six controllers, their models, their migrations, their Inertia pages, and the middleware wrapping their routes. That scope was correct for root-causing a 500, but it is **not** the full footprint of "the Quran module" as a unit of code you'd extract or rewrite. This section closes that gap with a repo-wide sweep (`grep -ril "quran"` across every non-vendor file, plus a filename-only pass) and lists everything that surfaced that §1-§14 did not already cover.

### 15.1 Console commands (3 total — only 1 was in the original report)

| File | Command | Purpose | New finding |
|---|---|---|---|
| `app/Console/Commands/TestQuranApi.php` | `quran:test` | Smoke-tests `QuranApiService::getSurahs()` end-to-end | Already covered in §12/file table |
| `app/Console/Commands/QuranBackfillPages.php` | `quran:backfill-pages {--batch=500}` | Batch-derives missing `page_from`/`page_to`/`pages_memorized`/`surahs_memorized`/`juz_memorized` for existing `quran_tracking` rows, using `QuranTrackingCalculator` (Integration B, `api.quran.com` — **not** the broken `QuranApiService`) | **Not in the original report.** This is the exact command the migration comment at `database/migrations/2025_11_25_100003_require_pages_quran_tracking.php` referred to — I can now confirm it genuinely exists (the original report correctly noted the migration doesn't *depend* on it having run, but left its existence unverified). Good implementation: uses `saveQuietly()` (`QuranBackfillPages.php:104`) to bypass `QuranTrackingObserver` and avoid double-computation, chunks in batches, reports per-record failures. **Because it depends on Integration B, not Integration A, this command is unaffected by RC#1 and can be run safely today if a backfill is ever needed**, independent of the credential fix. |
| `app/Console/Commands/DebugQuranAuth.php` | `quran:debug-auth` | Manually re-implements the OAuth2 client-credentials flow against `oauth2.quran.foundation`/`apis.quran.foundation` (both form-body and Basic-Auth variants) purely for interactive CLI debugging | **Not in the original report.** This is a third, independent re-implementation of the same OAuth logic that already lives in `QuranApiService::getAccessToken()` and is re-tested by `TestQuranApi`. It's a debug/scratch tool left in the codebase rather than a real feature — worth deleting or moving out of `app/Console/Commands` during a restructure so it doesn't ship as a maintained command. Not a security risk on its own (CLI-only, not web-reachable), but it does print `substr($clientId, 0, 10)` and `substr($clientSecret, 0, 5)` to the console (`DebugQuranAuth.php:24-25`) — fine for a local terminal, but flag it if console output is ever captured to shared CI logs. |

### 15.2 Cross-module touchpoints (code outside the Quran controllers that still reads Quran data)

These were entirely out of scope for the 500 investigation (none of them import `QuranApiService`, so none of them are affected by RC#1) but they are real consumers of the Quran data model and matter for a restructure, since moving/renaming Quran tables or relationships would break them too.

| File | What it does with Quran data |
|---|---|
| `app/Http/Controllers/DashboardController.php:150-163` | Admin dashboard `index()` — builds a `quranStats` block (`total_sessions`, `total_pages_memorized`, `total_surahs_memorized`, `total_juz_memorized`, `sessions_this_month`, `students_tracked`) by querying `QuranTracking` directly, gated on `school_type === 'madrasah'` |
| `app/Http/Controllers/DashboardController.php:627-673` | Guardian dashboard section — separately builds `quranTrackingData` (last 20 sessions across all of a guardian's children) and a second, differently-shaped `quranStats` block, again querying `QuranTracking` directly |
| `app/Models/Student.php:106-137` | Relationships consumed throughout the Quran controllers: `quranTracking()`, `quranHomework()`, `pendingQuranHomework()`, `quranHomePractice()`, `quranSchedules()`, `activeQuranSchedule()` |
| `app/Models/Guardian.php:153-157` | `quranHomePractice()` relationship (guardians reach `QuranTracking` indirectly through `students()->quranTracking()`, not a direct relation on `Guardian`) |
| `resources/js/Pages/Dashboard.jsx`, `Dashboard/Components/AdminDashboardContent.jsx`, `Dashboard/Components/GuardianDashboardContent.jsx` | Render the two `DashboardController` Quran stats blocks above as dashboard tiles/widgets |
| `resources/js/Pages/Home.jsx` | Public marketing/landing page — describes "Quran Memorization Tracking" as a headline feature (lines 85-355); no data dependency, just copy |
| `resources/js/Config/navigation.js:62-73, 125-136, 151-161` | Defines the "Quran" nav menu entry (with role-specific submenus: Admin/Teacher gets Dashboard/Tracking/Homework/Schedules, Guardian gets Dashboard/Tracking/Home Practice) shown only when `isMadrasah` — **this is the actual source of the sidebar links the user first reported as 500ing** |
| `resources/js/Components/Navigation/AdminMoreMenu.jsx`, `TeacherMoreMenu.jsx`, `GuardianMoreMenu.jsx`, `BottomNavigation.jsx` | Mobile-nav variants of the same links, driven by `navigation.js` |
| `resources/js/Utils/badges.js:54-72` | Shared badge-color helpers for Quran difficulty (`very_well`/`middle`/`difficult`) and reading-type (`new_learning`/`revision`/`subac`) values — generic Tailwind class lookups, no logic bugs found |
| `resources/js/Utils/constants.js:118-137` | `READING_TYPE_OPTIONS` / `DIFFICULTY_OPTIONS` dropdown option lists — used by the Tracking Create/Edit forms; values matches the `enum` columns in `quran_tracking` migration exactly |
| `resources/js/Components/QuranPageImage.jsx` | Renders a Mushaf page image from the CDN URL built by `QuranApiService::getPageImageUrl()` — already referenced in §9.1 but the component itself wasn't in the original file table |
| `public/manifest.json:118-122` | PWA install-screenshot metadata referencing `quran_tracking_process_mobileView.jpeg` — cosmetic, not code |

### 15.3 Confirmed absent (checked explicitly, not just "not found by keyword")

| Category | Result | Restructure implication |
|---|---|---|
| **Automated tests** | Zero — `grep -ril quran tests/` and `find tests -iname "*quran*"` both return nothing | The module has no regression safety net at all. Any restructure is refactoring blind; write characterization tests *before* moving code, not after. |
| **Model factories** | Zero — no `database/factories/Quran*Factory.php` exists, despite all 5 Quran models declaring `use HasFactory` | `QuranTracking::factory()` etc. would throw `Illuminate\Database\Eloquent\InvalidArgumentException` if ever called — the trait is present but unusable. Needed before the test suite above can exist. |
| **Seeders** | Zero — no `database/seeders/Quran*Seeder.php` | No repeatable way to stand up demo/dev data for this module. |
| **Policy classes** | Zero — `app/Providers/AppServiceProvider.php:72-92` registers `Gate::policy()` for 11 other models (Student, Guardian, Teacher, Exam, Attendance, etc.) but none for any Quran model | All Quran authorization is inline `if ($user->role === '...' && ...)` checks scattered across 4 controllers, inconsistently applied — see §16 for where this inconsistency becomes a real vulnerability, not just a style issue. |
| **Dedicated config file** | Zero — `config/quran.php` doesn't exist; the one config block lives inline in `config/services.php:38-42` | Minor; fine as-is, but if the restructure pulls this into a package/module, it'll want its own config file. |

---

## 16. Security Finding — Cross-Tenant Data Access on 3 of 5 Quran Models (new, not in original scope)

This surfaced directly from re-examining the controller code already read for §5, cross-checked against §6/§15.3's policy findings. **It has no relationship to the 500 errors** — it is a separate, pre-existing authorization gap that a restructure should close.

### 16.1 The mechanism

`QuranTracking` uses the `BelongsToSchool` trait (`app/Models/QuranTracking.php:7,11` → `app/Models/Traits/BelongsToSchool.php`). That trait does two things automatically for every `QuranTracking` query, including Laravel's implicit route-model binding: it adds a **global scope** (`SchoolScope`) that filters every query to `where('school_id', <current user's school>)`, and it auto-assigns `school_id` on create. This means even if a `QuranTrackingController` action forgot to check `school_id` explicitly, the model layer would still block cross-school access.

`QuranHomework`, `QuranSchedule`, and `QuranHomePractice` do **not** use `BelongsToSchool` (confirmed: `grep -n "BelongsToSchool" app/Models/QuranHomework.php app/Models/QuranSchedule.php app/Models/QuranHomePractice.php` returns nothing — only `QuranTracking.php` matches). There is no global scope on these three models. And their controllers only filter by `school_id` in the **list/create** paths — every `->where('school_id', $user->school_id)` in these three controllers appears exclusively inside `index()`/`create()`/`store()` (confirmed by grep, see exact line numbers below). None of the single-record actions — `show`, `edit`, `update`, `destroy` — ever check `school_id`:

| Controller | Method | Route | school_id check? | Other authorization present |
|---|---|---|---|---|
| `QuranHomeworkController.php:157` | `show(QuranHomework $quranHomework)` | `GET /quran-homework/{quranHomework}` | **None** | None |
| `QuranHomeworkController.php:175` | `edit(QuranHomework $quranHomework)` | `GET /quran-homework/{quranHomework}/edit` | **None** | None |
| `QuranHomeworkController.php:210` | `update(Request, QuranHomework $quranHomework)` | `PUT /quran-homework/{quranHomework}` | **None** | None |
| `QuranHomeworkController.php:247` | `destroy(QuranHomework $quranHomework)` | `DELETE /quran-homework/{quranHomework}` | **None** | None |
| `QuranScheduleController.php:102` | `show(QuranSchedule $quranSchedule)` | `GET /quran-schedule/{quranSchedule}` | **None** | Teacher-only: `$user->role === 'teacher' && $quranSchedule->teacher_id !== $user->id` → 403. **Admins/guardians get no check at all.** |
| `QuranScheduleController.php:128,148,182,200,218` | `edit`/`update`/`deactivate`/`activate`/`destroy` | various | **None** | Same teacher-only check; admins unchecked on every one |
| `QuranHomePracticeController.php:125` | `show(QuranHomePractice $quranHomePractice)` | `GET /quran-home-practice/{quranHomePractice}` | **None** | Guardian-only: `$user->role === 'guardian' && $quranHomePractice->guardian_id !== $user->guardian->id` → 403. **Admins/teachers get no check at all.** |
| `QuranHomePracticeController.php:144,169,198` | `edit`/`update`/`destroy` | various | **None** | Same guardian-only check; admins/teachers unchecked on every one |

### 16.2 The actual exposure

Because these three routes are `Route::middleware(['role:admin,teacher'])` or `['role:admin,teacher,guardian'])` (not scoped to a single school — `role` middleware only checks the user's role string, not their `school_id`, see §11), and because the underlying model query has no school scope, the following is possible today:

- **Any admin or teacher, at any school, can view, edit, or delete any other school's Quran homework record** by visiting `/quran-homework/{id}` with an ID that belongs to a different school — Laravel will happily resolve the route-model binding with no ownership check.
- **Any admin at any school can view, edit, deactivate/activate, or delete any other school's Quran schedule record** the same way (the only check present is teacher-vs-teacher, which doesn't apply to the admin role at all).
- **Any admin or teacher at any school can view, edit, or delete any other school's home-practice log** the same way (the only check present is guardian-vs-guardian).

This is a standard **IDOR (Insecure Direct Object Reference)** / broken multi-tenancy pattern: authorization checks that verify *role* but not *ownership/tenancy*. It's a real, currently-live gap in production (independent of RC#1 — none of these code paths touch `QuranApiService`), not a hypothetical.

### 16.3 Fix direction for the restructure

The cleanest fix, and the one already proven to work in this codebase (`QuranTracking` demonstrates it), is to apply `BelongsToSchool` consistently to `QuranHomework`, `QuranSchedule`, and `QuranHomePractice` — this closes the gap at the model layer for every current and future controller action in one change, rather than patching four ad-hoc `if` checks per controller. Given §15.3 also found zero `Gate`/`Policy` classes for any Quran model, a restructure is a natural point to introduce real `QuranHomeworkPolicy`/`QuranSchedulePolicy`/`QuranHomePracticePolicy` classes (matching the pattern already used for 11 other models in `AppServiceProvider.php`) instead of continuing the inline-`if` pattern — that would fix both the tenancy gap and the inconsistent role-based authorization in one pass.

---

## 17. Architectural Findings Relevant to a Restructure

Consolidating everything from §1-§16 that isn't a 500-cause but is directly relevant to deciding how to re-cut this module:

1. **Three overlapping "get Quran data" abstractions with no shared code** (§9): `QuranApiService` (Quran Foundation, authenticated, powers the 3 broken controllers), `QuranComApiClient`/`QuranTrackingCalculator` (Quran.com, public, powers the background metric computation), and a third hardcoded static Juz table duplicated in both. A restructure should pick one upstream vendor (or one clean internal abstraction over both) rather than carrying both forward.
2. **Quran stats aggregation is implemented three separate times** with slightly different shapes: `QuranController::index()` (§5), `DashboardController::index()` admin section (§15.2), and `DashboardController` guardian section (§15.2). Same underlying `QuranTracking` aggregates (`sum(pages_memorized)`, `sum(surahs_memorized)`, `sum(juz_memorized)`, session counts), three independent implementations to keep in sync.
3. **Inconsistent tenant isolation** across the 5 models — 1 of 5 uses `BelongsToSchool`, 4 of 5 rely on manual, incompletely-applied `school_id` filtering (§16).
4. **Zero automated test coverage, zero factories, zero seeders** (§15.3) — a restructure of untested code is inherently higher-risk; budget time to write characterization tests against current behavior before moving anything.
5. **No Policy layer** — all authorization is inline conditionals duplicated per-controller (§16.3), a good candidate for consolidation into Policies during the restructure.
6. **Three independent re-implementations of the same OAuth2 client-credentials flow** — `QuranApiService::getAccessToken()`, `DebugQuranAuth.php`, and (implicitly) whatever `TestQuranApi.php` exercises through `QuranApiService`. Only one of these (the service) should survive a restructure; the debug command is scratch tooling.
7. **No dedicated FormRequest classes anywhere in the module** (§5) — all validation is inline `$request->validate([...])` arrays duplicated between `store()` and `update()` in `QuranTrackingController` and `QuranHomeworkController` (identical rule arrays, copy-pasted). Extracting `StoreQuranTrackingRequest`/`UpdateQuranTrackingRequest` etc. would remove that duplication.
8. **The argument-order bugs in §5/§13 fix #7** are a good signal that the `QuranApiService` method signatures (`calculateTotalVerses(surahFrom, surahTo, verseFrom, verseTo)`) are non-obvious/easy to misuse — 5 call sites got the order wrong. A restructure could use named parameters or a small value object (`VerseRange`) instead of four positional ints, which would make this whole class of bug impossible.

---

## 18. Confidence Assessment

Answering directly: **for the original question — "why does every route 500" — I'm highly confident §1-§14 identified the actual root causes**, not guesses. RC#1 was reproduced live in this environment (not inferred from reading code) and cross-confirmed against a matching stack trace already sitting in `storage/logs/laravel.log`, so that part isn't a hypothesis.

**For "is this everything there is to report about the module" — the honest answer is: §1-§14 alone was not the full picture, and you were right to ask.** That pass was scoped to *what the 500 could reach*: the routes, their controllers, their direct models, their migrations, their Inertia pages, and the middleware wrapping them. It deliberately (and correctly, for that question) did not do a repo-wide sweep. §15-§17, added in this pass, close that gap using an unscoped, repo-wide grep rather than following the call graph outward — which is how the second external API client, the two extra console commands, the `DashboardController` duplication, and the tenant-isolation gap all surfaced. That sweep is now exhaustive by *keyword* (every file containing or named "quran" in the repo, outside vendor/node_modules, has been read or grepped).

What I still cannot verify from static analysis alone, and would flag before you finalize a restructure plan:
- **Production-only state** — actual `.env` contents, actual migration status, actual DB row counts/data quality on production (§8, §17.3) — nothing here substitutes for `php artisan migrate:status` and a `.env` diff run directly on the production host.
- **Runtime behavior of both external APIs** — I read the code that calls `oauth2.quran.foundation`/`apis.quran.foundation`/`api.quran.com`, but I did not (and could not, without production credentials) make live calls to confirm those endpoints, response shapes, and rate limits still match what the code assumes today.
- **Anything gated behind a feature flag, config toggle, or A/B condition I wouldn't recognize as "Quran" by name** — the sweep is keyword-based; a hypothetical `is_islamic_school` flag or similarly-unrelated-sounding variable controlling Quran behavior wouldn't have surfaced. I saw no evidence of this pattern anywhere in the module (everything gates on `school_type === 'madrasah'` consistently), but I'm naming the blind spot rather than asserting it doesn't exist.
- **Frontend behavior I can't observe without running the app** — prop-shape mismatches (§10) were checked by reading both sides, not by rendering the pages; a browser-level check before restructuring would still be worthwhile.

Short version: root-cause diagnosis (§1-§14) — high confidence, evidence-backed. Full-module inventory (§15-§17) — high confidence on *static* completeness (every file is accounted for), lower confidence on anything that only manifests at runtime in production.
