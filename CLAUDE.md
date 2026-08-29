# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Tech Stack

This project is built with:

- **Laravel 12** — PHP backend framework (`composer.json` pins `laravel/framework: ^12.0`)
- **Inertia.js** — connects the Laravel backend to the frontend without a separate API layer
- **React** — frontend UI library, used as the Inertia client-side driver

# SCHOOL ID — DATA ISOLATION RULE
### NON-NEGOTIABLE SYSTEM RULE

This system uses ONE shared database for MULTIPLE schools.
School ID is the fundamental data-isolation boundary.

**ONE DATABASE → MULTIPLE SCHOOLS → SCHOOL ID SEPARATES THE DATA**

Every school-related record, operation, query, relationship, report,
automation, API request, job, import, export, creation, update, and deletion
must respect the applicable School ID.

The system must NEVER assume that data is globally accessible simply because
it exists in the same database.

## Mandatory School Context

Whenever working with school-specific data, the active School ID must be
known and respected. Treat the School ID as a required contextual variable:

```text
SCHOOL_ID = <current school context>
```

Do not invent, guess, hardcode, or silently substitute a School ID.
If the School ID is required but unknown, STOP and request or determine the
correct School ID before proceeding.

## Every Operation Must Respect School ID

Before executing or creating any operation involving school data, ensure that:

- The correct School ID is known.
- Data is retrieved within the correct School ID context.
- New records are assigned to the correct School ID.
- Updates cannot modify another school's records.
- Deletes cannot affect another school's records.
- Relationships cannot unintentionally cross school boundaries.
- Reports and exports are restricted to the correct school.
- Background jobs and automations preserve the School ID.
- APIs and external integrations preserve and validate School ID.
- User-supplied School IDs are never trusted without appropriate authorization.

## Audit Before Modification

If a task touches database structure, models, relationships, queries,
authorization, APIs, reports, automations, or other school-scoped
functionality:

**INSPECT → AUDIT → UNDERSTAND → THEN MODIFY**

Do not guess how School ID is currently implemented. First inspect the
existing implementation and preserve its established architecture. This does
not mean re-scanning the entire codebase on every session start — it means
checking the specific model, query, or feature being touched before changing
it.

## Never Change the Tenant Architecture

This system uses a shared database with School ID isolation.

Do NOT introduce a separate database for each school unless the architecture
is explicitly and intentionally changed.

Do NOT bypass, disable, or weaken existing School ID scopes, middleware,
authorization, relationships, or other isolation mechanisms.

## Mandatory Rule for Every Run

This rule must be respected every time this project is worked on, regardless
of where in the session the work occurs. Whether the task is started at the
beginning of a session, continued midway through a session, resumed later, or
performed as a small isolated change, the School ID isolation rule remains
active and must be applied.

Before any school-related implementation, verify:

```text
What is the School ID?
Where does it come from?
How is it enforced?
Can this operation access another school's data?
```

If these questions cannot be answered, STOP and inspect the codebase before
proceeding.

## FINAL PRINCIPLE

**ONE DATABASE.**
**MULTIPLE SCHOOLS.**
**SCHOOL ID IS THE DATA-ISOLATION BOUNDARY.**

This rule is mandatory and must never be bypassed for implementation
convenience.

## What this is

A multi-tenant School Management System (schoolMS): Laravel 12 (PHP 8.2+) backend, Inertia.js + React 18 frontend, single shared database with row-level tenant isolation (see Multi-tenancy below). Supports two school types — `islamic_school` and `madrasah` — the latter unlocks a dedicated Quran tracking/homework/grading module.

## Commands

**Local dev** (runs server, queue listener, log tailer, and Vite concurrently):
```bash
composer dev
```

**Frontend only:**
```bash
npm run dev      # Vite dev server
npm run build     # production build (also bumps the service-worker version via scripts/update-sw-version.sh)
```

**Tests** (Pest, run against an in-memory SQLite DB per `phpunit.xml`):
```bash
composer test              # clears config cache, then runs the full suite
php artisan test            # equivalent, no config-clear
php artisan test --filter=TestName
php artisan test tests/Feature/SomeTest.php
```
Feature tests extend `Tests\TestCase` with `RefreshDatabase` globally applied via `tests/Pest.php` — no need to add that trait per-file.

**Linting/formatting:**
```bash
./vendor/bin/pint          # Laravel Pint (PHP style)
```

**Package manager:** this project uses `pnpm` (pinned via `packageManager` in package.json), not npm/yarn, for actual installs — but the existing npm scripts (`npm run dev`/`build`) still work through pnpm's shims.

## Architecture

### Multi-tenancy: single DB, row-scoped by `school_id`

Every tenant-owned model uses the `App\Models\Traits\BelongsToSchool` trait, which:
- registers `App\Models\Scopes\SchoolScope` as a global scope, auto-filtering all queries to `where school_id = <auth user's school_id>`
- auto-populates `school_id` on create from the authenticated user's school

Both the trait and the scope deliberately query `school_id` via `DB::table('users')` (not `Auth::user()->school_id`) to avoid infinite recursion — `School` and `User` models are exempt from the scope for the same reason (`User` does not use the trait at all; `SchoolScope::apply()` explicitly skips `School`).

**When adding a new tenant-scoped model**, add `use BelongsToSchool;` — don't hand-roll `school_id` filtering in controllers.

Super admins have `school_id = null` and manage schools/tenants globally (`routes/super-admin.php`, `App\Http\Controllers\SuperAdmin\*`); they're blocked from regular school routes by `CheckMadrasahSchool`/route middleware, which `abort(404)` for super admins hitting school-scoped pages.

### Authorization

Roles are a plain string column on `users` (`App\Enums\UserRole`: `super_admin`, `admin`, `teacher`, `guardian`) — not a package like Spatie Permission. Enforcement is route-middleware based:
- `role:admin,teacher,...` (`RoleMiddleware`) — the primary authorization boundary; checks `$user->role` against the allowed list and also kills sessions for deactivated (`is_active = false`) users.
- `school.active` (`CheckSchoolActive`) — logs out users whose school has been deactivated/suspended.
- `school.admin` / `super.admin` — narrower role checks.
- `madrasah.only` (`CheckMadrasahSchool`) — gates the Quran module and other madrasah-only routes to schools where `school_type === 'madrasah'`.

`User` model helpers (`isSuperAdmin()`, `isAdmin()`, `isTeacher()`, `isGuardian()`, etc.) are used inside controllers/views for finer-grained checks beyond route middleware. Route-level middleware is the actual security boundary — controller-level ownership checks (e.g. "does this guardian own this student") are not consistently present across all controllers, so don't assume authorization is fully handled just because a route is reachable by a given role.

### Frontend: Inertia + React, not a separate SPA

`resources/js/Pages/**` maps directly to controller `Inertia::render()` calls — there is no separate REST/JSON API consumed by the frontend for normal page views (`routes/api.php` is minimal, ~32 lines). `HandleInertiaRequests` middleware shares global props. Shared UI lives under `resources/js/Components`, `Layouts`, `Hooks`, `Config` (e.g. `navigation.js` drives role-based sidebar menus — when adding a route a role should reach, it must be added here too, not just in `routes/web.php`).

### Domain modules of note

- **Quran module** (`app/Models/Quran*`, `app/Http/Controllers/Quran*`, `resources/js/Pages/Quran`): tracking sessions, homework assignments, home-practice logging, schedules/pace targets, and inline teacher assessments (fluency/tajweed ratings). Two independent external Quran data integrations exist — `App\External\QuranApiClient`/`App\Services\QuranApiService` (Quran Foundation's authenticated API) and `App\External\QuranComApiClient` (public quran.com API, unauthenticated) — see `reports/quran-functionality-audit.md` and `reports/quran-features-audit.md` for a detailed inventory of what's implemented vs. gaps before extending this module.
- **Fees/invoicing**: `TuitionFee`, `UniversalFee`, `OneTimeFee`, `GuardianFeeAdjustment`/`GuardianFeePreference`, `Invoice`/`InvoiceLineItem`, `GuardianPayment`, plus M-Pesa integration (`MpesaController`).
- **Timetabling**: the most algorithmically complex area — `app/Services/Timetable*` (generation, conflict detection, compliance/analytics services), `BlueprintPeriod`/`LevelDayBlueprint`/`TimetableTemplate`/`TimetableSlot`/`TimetablePeriod` models, plus `HasPriorityBand` trait mapping subject priority (high/neutral/low) to period bands (morning_high/neutral/afternoon_low).
- **Impersonation**: `lab404/laravel-impersonate` package, gated to super admins/admins, logged via `ImpersonationLog`.

### Observers

Model lifecycle side effects go through Observers (`app/Observers`), not model boot hooks, e.g. `QuranTrackingObserver` recomputes derived progress metrics (`pages_memorized`, `juz_memorized`, etc.) via `QuranTrackingCalculator` on every `QuranTracking` create/update.

### Reports/audit docs

`reports/` and various root-level `*_SUMMARY.md`/`docs/*.md` files contain point-in-time audits and implementation write-ups (e.g. the Quran module 500-error investigation, timetable validation design docs) — useful context before touching those areas, but treat them as historical snapshots, not living documentation; verify against current code before relying on specifics.
