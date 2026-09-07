# Super Admin — Gaps and Fixes Required

Point-in-time audit from an in-conversation session (2026-09-07). Grounded in the actual codebase at the time of writing (not assumptions) — verify against current code before acting, per this repo's `reports/` convention. Read alongside `reports/filament-super-admin-adoption-plan.md`.

## 1. No impersonation audit trail (highest priority)

`App\Http\Controllers\SuperAdmin\SchoolController::impersonate()` calls the `lab404/laravel-impersonate` package (`composer.json: "lab404/laravel-impersonate": "^1.7"`) to let a super admin log in as a school's admin, scoped via `$school->users()->where('role','admin')->where('id', $validated['user_id'])->first()` to prevent cross-school impersonation. **There is no `ImpersonationLog` model or any logging of who impersonated whom, when, or for how long** — confirmed via `ls app/Models | grep -i impersonat` returning nothing. This is the one sanctioned crossing of the school-isolation boundary this app has (a super admin, who normally has `school_id = null` and no access to school data, temporarily acting as a school's admin) — it should be the most tightly audited action in the system, and today it leaves zero trace.

**Fix shape:** a new `impersonation_logs` table/model (`super_admin_id`, `impersonated_user_id`, `school_id`, `started_at`, `ended_at`), written on impersonation start (in `SchoolController::impersonate()`) and end (wherever the impersonate package's "leave" action is routed — check `lab404/laravel-impersonate`'s config for its leave-impersonation route/listener).

## 2. `trial_ends_at` stored but never enforced

`School::$fillable` includes `trial_ends_at` (cast to `datetime`) and `status` (`trial|active|suspended|cancelled`, validated in `SchoolController::store()`/`update()`), but nothing flips `status` from `trial` to anything else when `trial_ends_at` passes — no scheduled command, no observer, no check in `CheckSchoolActive` middleware. A school can sit in `trial` status indefinitely past its trial date with no automatic consequence.

**Fix shape:** a scheduled Artisan command (`php artisan schools:expire-trials`, registered in the scheduler) that finds `School::where('status', 'trial')->where('trial_ends_at', '<', now())` and flips them to `suspended` (or whatever the intended post-trial state is — confirm with product intent before implementing, this wasn't specified).

## 3. System Logs and Settings pages are stubbed out, not built

`routes/super-admin.php` has both commented out:
```php
// System Logs (TODO: Implement later)
// Route::get('logs', [LogController::class, 'index'])->name('logs.index');
// Settings (TODO: Implement later)
// Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
```
`ActivityLog` already has a `school_id` column and is used by `SuperAdmin\DashboardController` for a "last 10 activities" widget (guarded by `Schema::hasColumn('activity_logs', 'school_id')`), but there's no dedicated browse/search/filter UI beyond that dashboard widget. Settings has no controller, model, or route at all.

**Fix shape:** for Logs, a straightforward paginated/filterable index over `ActivityLog` (by school, user, date range, activity type) — the data already exists, this is a UI/controller task. For Settings, scope is undefined — needs a product decision on what global settings a super admin should actually control before any code is written.

## 4. Smaller gaps

- `SuperAdmin\UserController` has no create-user or role/school-reassignment action — only `index`, `show`, `resetPassword`, `toggleActive`, `destroy` (confirmed via full file read, 131 lines). A super admin cannot directly create a user or move one between schools without going through the school-level flows.
- No bulk actions anywhere in the super-admin surface (bulk school suspend, bulk user deactivate, etc.).

## 5. Teacher/Guardian login-access display inconsistency (found via a separate investigation, same session)

Not a super-admin-specific gap, but surfaced in the same conversation and worth flaging here since it affects data an eventual Filament `Teacher`/`Guardian` resource (see `reports/filament-super-admin-adoption-plan.md`) would also need to get right:

- `users.is_active` is the only field that actually gates login (`LoginRequest`, `RoleMiddleware`) and is only ever toggled from the Users index page.
- `teachers.status` and `guardians.status` are separate, independently-editable fields that the Teacher/Guardian Index/Show/Edit pages display as "Active"/"Inactive" — but neither field is synced with `users.is_active` in either direction, so an admin could deactivate a teacher's login from the Users page while the teacher's own profile still showed "Active," or flip a guardian's dedicated "Deactivate" button (which also cascades to mark their children inactive — `Guardian::deactivate()`) with zero effect on whether that guardian can still log in.
- **This has already been fixed** in this same session — see `docs/superpowers/plans/2026-09-07-teacher-guardian-status-unification.md` for the implementation plan and its execution status. Teacher pages now display login access from `user.is_active` directly (teachers.status is retired as a display source, left vestigial rather than migrated away); Guardian pages now show two independent badges (Enrollment status, still driving the student cascade, and Portal Access from `user.is_active`), with modal copy rewritten to stop implying the "Deactivate" button affects login.

If a future session builds a Filament resource for `Teacher` or `Guardian` before or without reading the plan above, it risks reintroducing the same conflated-status confusion in the new UI — reuse the `user.is_active`-vs-business-status split rather than treating `status` as the single source of truth.
