# Quran Module Restructure — Phase 1 Completion Report

**Branch:** `restructure/quran-module` (created from `one-db` @ `6e63501`)
**Status:** Complete, uncommitted, ready for human review

---

## What changed

### Models
- `app/Models/QuranHomework.php` — added `BelongsToSchool` trait.
- `app/Models/QuranSchedule.php` — added `BelongsToSchool` trait.
- `app/Models/QuranHomePractice.php` — added `BelongsToSchool` trait.

### Policies (new)
- `app/Policies/QuranHomeworkPolicy.php`
- `app/Policies/QuranSchedulePolicy.php` — `view`/`update`/`delete` formalize the previous inline "teacher must own the schedule" check.
- `app/Policies/QuranHomePracticePolicy.php` — `view`/`update`/`delete` formalize the previous inline "guardian must own the log" check.
- Registered in `app/Providers/AppServiceProvider.php`.

### Controllers
- `QuranHomeworkController` — added `$this->authorize()` to `store`/`show`/`edit`/`update`/`destroy`/`markComplete`.
- `QuranScheduleController` — replaced 6 duplicated inline `if ($user->role === 'teacher' && ...) abort(403)` blocks with `$this->authorize()` calls in `store`/`show`/`edit`/`update`/`deactivate`/`activate`/`destroy`.
- `QuranHomePracticeController` — replaced 4 duplicated inline guardian-ownership checks with `$this->authorize()` in `store`/`show`/`edit`/`update`/`destroy` (the `store()` method's more specific "is this guardian linked to this student" check was left in place alongside the new role-level `authorize('create', ...)`, since the Policy's `create` doesn't have access to the request's `student_id`).
- `QuranHomePracticeController` — fixed `getAllSurahs()` → `getSurahs()` (both call sites; the method never existed on `QuranApiService`, so `create`/`edit` always crashed).
- `QuranTrackingController` — fixed swapped `verse_from`/`surah_to` arguments in all 6 call sites of `calculateTotalVerses()`/`calculatePageRange()`. This was a live bug: for any single-surah session it corrupted the method's "same surah" fast path and fell into the multi-surah branch with scrambled values, which throws `Undefined array key` whenever surah metadata isn't cached (i.e. whenever the Quran Foundation API isn't reachable/credentialed — matching production's actual state per the original audit).

### Services
- `app/Services/QuranApiService.php`:
  - `$clientId`/`$clientSecret` made nullable (`?string`) — the constructor previously fatally crashed (`TypeError`) when `QURAN_API_CLIENT_ID`/`SECRET` env vars are unset, which took down every controller that constructor-injects this service (RC#1 from the original audit).
  - `getAccessToken()` now checks for missing credentials up front and throws a normal, caught exception instead of letting `Http::withBasicAuth(null, null)` throw an uncaught `TypeError` — this is what actually let the graceful-degradation path (`getSurahs()` → `[]`) work end-to-end.
  - Added `->timeout(10)` to both outbound `Http::` calls.

### Routes
- `routes/web.php` — reordered the Quran Home Practice route groups: the guardian-only group (containing `/quran-home-practice/create`) now registers *before* the admin/teacher/guardian group (containing `/quran-home-practice/{quranHomePractice}`). Previously the wildcard `show` route, registered first, swallowed `GET /quran-home-practice/create` — Laravel tried to route-model-bind the literal string `"create"` as an id and 404'd. **This was a live bug blocking the entire "log home practice" feature for every guardian, in every school, unconditionally** — found incidentally while testing the `getAllSurahs()` fix, not in the original bug list.

### Frontend
- `resources/js/Pages/Quran/HomePractice/Create.jsx`, `Edit.jsx` — `surah.name_english` → `surah.name_simple` (matches the actual field name in both the Quran Foundation and quran.com chapter responses; `name_english` was never a real field).

### Migrations (SQLite-compatibility fixes, not Quran-specific)
Fixing the `grades` migration to build a real test baseline (see below) surfaced that **the full migration history had never actually succeeded end-to-end under SQLite** — 9 migrations use MySQL-only raw SQL. Fixed all 9 (additive `if (DB::getDriverName() === 'sqlite')` branches or driver-neutral SQL swaps — zero behavior change on MySQL/production):
- `2025_11_01_082718_add_code_and_update_level_in_grades_table.php` — the SQLite temp-table rebuild dropped the `name` unique index and never recreated it; fixed by recreating it (explicitly named, after the table rename — SQLite's index-naming and cross-table-uniqueness rules made this a 3-iteration fix, detailed in the session).
- `2025_11_22_000003_update_document_categories_unique_constraint.php`, `2026_01_19_100000_fix_timetable_templates_unique_constraint.php`, `2026_01_27_121202_fix_timetable_slots_unique_constraint_for_blueprint_system.php` — `SHOW INDEX`/`SET FOREIGN_KEY_CHECKS`/`ALTER TABLE ... DROP INDEX` (MySQL-only) → `Schema::hasIndex()` + Blueprint methods (driver-agnostic).
- `2026_01_02_194318_add_arts_category_to_subjects_table.php`, `2026_01_05_190000_update_slot_type_enum_in_timetable_slots.php`, `2026_01_22_083229_add_injury_types_to_incident_reports_incident_type_enum.php`, `2026_01_28_000001_add_homework_to_period_types.php`, `2026_01_28_000002_align_slot_types_with_period_types.php` — `ALTER TABLE ... MODIFY COLUMN ... ENUM(...)` (MySQL-only) → native `->enum(...)->change()` (Laravel 12's SQLite grammar handles this natively).
- `2026_01_11_000002_migrate_student_guardian_data_to_pivot.php` — `NOW()` (MySQL-only in this context) → `CURRENT_TIMESTAMP` (portable).

### Environment fix (not a code change, but required to make any of the above testable)
The worktree's `vendor`/`node_modules` were initially symlinked to the main checkout for speed. That symlink caused Pest specifically (not plain `artisan`) to resolve the app's `base_path()` back to the *original* repo instead of the worktree, so every test silently ran against the old, unfixed files regardless of edits. Fixed by running a real `composer install --ignore-platform-req=ext-gd` / `pnpm install` inside the worktree instead of symlinking (`ext-gd` isn't installed for the PHP 8.4 CLI binary this environment uses for testing — SQLite support requires 8.4, not the default 8.5 — and isn't needed for these tests).

### Test/factory infrastructure (new)
- `database/factories/SchoolFactory.php`, `QuranHomeworkFactory.php`, `QuranScheduleFactory.php`, `QuranHomePracticeFactory.php`, `QuranTrackingFactory.php` — new, per Phase 1's requirement.
- `database/factories/GuardianFactory.php`, `TeacherFactory.php`, `StudentFactory.php` — were empty stubs (no default state at all); filled in with minimal valid defaults. Purely additive — any existing caller that already overrode every field behaves identically.
- 6 new test files (`tests/Unit/QuranApiServiceTest.php`, `tests/Feature/Quran*Test.php`) — see verification evidence below.

---

## School ID enforcement statement (rule 0.1)

- **QuranHomework, QuranSchedule, QuranHomePractice**: now use `BelongsToSchool`, the same global-scope mechanism as every other tenant-scoped model in the codebase (`SchoolScope`, auto-filtering all queries to the authenticated user's `school_id`). This is what actually closes the IDOR — route-model-binding on `show`/`edit`/`update`/`destroy` now 404s for a cross-school id before the controller body ever runs, verified below, not assumed.
- On top of that (defense in depth, since the plan explicitly asks for both mechanisms), the 3 new Policies re-check `$user->school_id === $model->school_id` explicitly, plus the pre-existing role/ownership rules (teacher-must-own-schedule, guardian-must-own-practice-log), now centralized instead of duplicated inline 6 and 4 times respectively.
- **QuranTracking** already had `BelongsToSchool` (unchanged) — only its controller's argument-order bug was fixed.
- Migration fixes: none introduce new tables or touch `school_id` scoping; the `grades` migration fix specifically preserves the original single-column `name` unique constraint mid-chain (a later migration in the same chain still correctly converts it to the composite `(name, school_id)` constraint — verified by the full migration run completing without error).
- Route reorder (`quran-home-practice.create`): no change to which roles/middleware guard which route — only registration order changed, verified by the existing role-middleware tests still passing.

## Verification evidence

Full migration chain, direct `migrate:fresh` (proves the schema itself is now sound, independent of any test framework quirk):
```
DB_CONNECTION=sqlite DB_DATABASE=:memory: php8.4 artisan migrate:fresh --env=testing
... (all ~90 migrations) ... DONE
$ echo $?
0
```

All Quran-related tests, run together:
```
$ php8.4 artisan test --filter=Quran

   PASS  Tests\Unit\QuranApiServiceTest
  ✓ it can be instantiated without configured credentials                0.11s
  ✓ get surahs returns empty array without configured credentials        0.02s

   PASS  Tests\Feature\QuranHomePracticeGetAllSurahsBugTest
  ✓ create form loads without crashing                                   0.44s

   PASS  Tests\Feature\QuranHomePracticeTenantIsolationTest
  ✓ admin cannot view another schools home practice                      0.02s
  ✓ teacher cannot view another schools home practice                    0.02s

   PASS  Tests\Feature\QuranHomeworkTenantIsolationTest
  ✓ admin cannot view another schools homework                           0.03s
  ✓ teacher cannot delete another schools homework                       0.02s

   PASS  Tests\Feature\QuranScheduleTenantIsolationTest
  ✓ admin cannot view another schools schedule                           0.02s
  ✓ admin cannot delete another schools schedule                         0.02s

   PASS  Tests\Feature\QuranTrackingCalculatedVersesBugTest
  ✓ calculated total verses is correct for a single surah session        0.63s

  Tests:    10 passed (22 assertions)
```

Every one of these 10 tests was written and confirmed **RED** (failing for the correct, expected reason — not a typo or setup mistake) before the corresponding fix was applied, per the project's TDD requirement. The tenant-isolation tests specifically prove the IDOR: before the `BelongsToSchool` fix, `test_admin_cannot_view_another_schools_homework` received an actual `200` (successfully viewed another school's data), and `test_teacher_cannot_delete_another_schools_homework` received a `302` (successfully deleted it) — i.e. the vulnerability was reproduced live, not assumed from the audit.

Full suite, for regression:
```
$ php8.4 artisan test
Tests: 36 failed, 19 passed (64 assertions)
```
19 passing = the 10 above + 9 that were passing before this phase. The 36 failures are 100% pre-existing and unrelated to Quran or this phase's changes — all in `TimetableGenerationValidationTest`/`TeacherTimetableTest`, caused by a missing `AcademicTermFactory` (and likely further missing factories beyond it) in the existing Timetable test suite. Confirmed unrelated by checking these same tests failed identically (in fact for one dependency level further back — `SchoolFactory` didn't exist either) before this phase began.

## Deferred / descoped

- **Item 30-routes-now-resolve confirmation**: not separately re-verified as a distinct count, since the underlying fix (nullable `QuranApiService` properties) is proven directly by `QuranApiServiceTest` and transitively by every Quran controller test above actually reaching real controller logic instead of crashing at construction.
- **`QuranHomePracticeController::store()`'s guardian/student-link check**: left as an inline check rather than folded into the Policy's `create()` method, because the Policy layer (`Gate::authorize`) doesn't have access to the request body (`student_id`) needed for that specific rule. Noted as a possible Phase 6+ cleanup (move to a Form Request) but out of Phase 1's stated scope.
- **The route-ordering bug and the 9 SQLite migration incompatibilities**: not in the original Phase 1 task list. Both were surfaced organically while building the test baseline this phase required, and fixed after explicit check-ins with the human partner (three separate confirmations) given they touch non-Quran code. Documented here in full per rule 0.2 ("nothing existing gets silently discarded") and for transparency, not because the plan asked for them by name.
- **Missing `AcademicTermFactory`/etc. and the pre-existing Timetable test failures**: explicitly left alone — unrelated to Quran, and fixing an unbounded chain of missing factories for an unrelated module is outside this phase's scope.

## Confirmation nothing was committed or pushed

```
$ git log --oneline -5
6e63501 rendered the notes attached to a payment   <- unchanged, no new commits
57c5745 added a bulk student and guardian import...
6637d2b fixed exam status bug
2cf5eb1 added active filter to recent results in the exam detail page
5185b19 fixed the exam detail bug...

$ git branch --show-current
restructure/quran-module
```

All changes above are uncommitted working-tree modifications in `.worktrees/restructure-quran-module/`, ready for the human partner's review, commit, and push, per rule 0.3.
