# Quran Module Connected-Workflow Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace today's four loosely-connected Quran entities (Schedule, Homework, Tracking, Assessment) with the single connected chain described in the design doc: Schedule (plan) → Homework (assign, chained to the plan) → Grade (record an assessment directly against that same Homework entry — no separate "Tracking" creation) → Progress (rolls up from graded Homework to the Schedule).

**Architecture:** `QuranTracking` is renamed into the new `QuranHomework` entity (its table, model, controller, and UI are reused almost as-is — it already has the richest, most recently-polished create/show experience in the module). The current `QuranHomework` model/table is deleted outright (confirmed: no real data exists in it). `QuranSchedule`'s schema is rebuilt from a pace-target model into a concrete From/To verse-range + date-range model. `QuranAssessment`'s foreign key moves from the old Tracking table onto the new Homework entity, and it gains `school_id`/`BelongsToSchool` (an existing gap, now fixed as part of this work). `QuranHomePractice` is untouched — its fate is a separate, still-open product decision the user wants to work through via `superpowers:brainstorming` before any code touches it.

**Tech Stack:** Laravel 12 / PHP 8.2+, Eloquent migrations, Pest feature tests (SQLite in-memory), Inertia.js + React 18 frontend, existing `QuranComApiClient`/`QuranTrackingCalculator` infra (untouched).

**Spec:** `docs/quran-module-architecture-redesign.md` (this plan implements §1–§5, excluding §2.3's `QuranHomePractice` question, which is explicitly deferred).

## Global Constraints

- School ID tenant isolation is non-negotiable on every table this plan touches — `BelongsToSchool` with no exceptions, including `QuranAssessment`, which currently lacks it (confirmed decision, no exceptions).
- No backfill needed for `QuranSchedule`/old `QuranHomework` — confirmed no real production data exists in either table. `QuranTracking` (renamed into the new Homework entity) IS assumed to carry real data and its rows must survive the migration intact.
- `QuranHomePractice` (model, controller, policy, routes, `resources/js/Pages/Quran/HomePractice/**`, and its three dedicated tests) is **out of scope** for this plan — do not modify, rename, or delete anything under it.
- TDD throughout: write the failing test, watch it fail, write minimal code, watch it pass — per `superpowers:test-driven-development`.
- No commits, no pushes. Everything stays uncommitted in this worktree (`.worktrees/restructure-quran-module`, branch `restructure/quran-module`) for the user's review.
- Run `superpowers:verification-before-completion` before reporting any task/milestone done — show real command output, not a claim.
- Work only in this worktree.

---

## Design decisions locked in by this plan (flag anything that looks wrong before merging Task 1)

These resolve places where the design doc was intentionally high-level and a concrete schema/behavior had to be chosen. None of them are guesses about the *target workflow* (that's fully specified in the design doc) — they're implementation choices for translating it into schema:

1. **The new Homework entity is the renamed `quran_tracking` table**, not the old `quran_homework` table. Old `quran_homework` is dropped outright. This preserves any real Tracking data; nothing is backfilled into it from the old Homework table (there's nothing there to backfill).
2. This deletes `resources/js/Pages/Quran/Homework/Create.jsx` and `Show.jsx` in their current form — the Option B UX work done earlier this session for the *old* Homework entity. Nothing is lost functionally: the renamed Tracking pages already have equivalent (page-preview, live Arabic text) or better UX, per the redesign's own intent. Flagging so this isn't mistaken for accidental regression during review.
3. **New columns on the renamed table:** `quran_schedule_id` (nullable FK — must be nullable for existing rows, which predate Schedules entirely), `status` enum (`pending`, `graded`, `absent`, `not_prepared`) default `pending`. All **pre-existing** rows are backfilled to `status = 'graded'` (they represent already-recorded, already-complete sessions under the old Tracking model — there's no "pending"/"absent"/"not-prepared" concept for data that already happened). `date` is renamed to `assigned_date` to match the design doc's vocabulary.
4. **Corrected per user review: Absent and Not Prepared are two distinct status values, not one combined "missed" status.** `absent` = the student didn't attend at all, nothing to assess. `not_prepared` = the student attended but didn't do the assigned work. Both are outcomes of *grading* (the teacher records what happened), and both are distinct from the quality-rating scale used when work *was* done.
5. **The old `difficulty` field (very_well/middle/difficult) is renamed to `quality_rating` with a new four-value scale: `excellent`, `very_good`, `moderate`, `poor`** — matching the design doc's own §2.4 vocabulary ("quality rating, e.g. Excellent / Very Good / Moderate / Poor"). It's set only when `status = 'graded'` (nullable — there's nothing to rate when a student was absent or didn't prepare). Pre-existing rows' old `difficulty` values are remapped on migration: `very_well → excellent`, `middle → moderate`, `difficult → poor` (a reasonable best/mid/worst-preserving map for historical data; flag if you'd prefer a different mapping — it only affects old rows' cosmetic labeling, not new behavior).
6. **Field split between assignment-time and grading-time**, since the redesign moves grading to a separate, later action:
   - *At creation (assign):* `student_id`, `reading_type` (what kind of practice this is), `surah_to`/`verse_to` (`surah_from`/`verse_from` are server-derived, never user input), `page_from`/`page_to` (optional, auto-derived exactly as today), `notes` (teacher instructions).
   - *At grading (later, via the new `grade` action, only when status becomes `graded`):* `quality_rating`, `subac_participation`, `fluency_rating`, `tajweed_rating`, `mistakes_count`, `assessment_notes` — these are inherently post-hoc judgments about a session that already happened, so they no longer belong on the create screen.
   - *Marking absent/not-prepared* is a separate, simpler action (no quality rating involved at all — see Task 5's `markUngraded()`).
   - This resolves an apparent tension in the design doc's text (§2.2 "same fields... same everything" vs. §2.4 "no grading at creation") in favor of §2.4's explicit statement.
7. `homework_type` (memorize/revise/read, from the old Homework table) is dropped. The renamed table keeps Tracking's existing `reading_type` (new_learning/revision/subac).
8. `QuranSchedule` rebuild: drops `schedule_type`, `target_pages_per_period`, `target_verses_per_period`; adds `surah_from`/`verse_from`/`surah_to`/`verse_to`; renames `expected_completion_date` → `end_date`. `target_total_pages` becomes a **computed accessor** (via the existing `QuranTrackingCalculator`), not a stored input.
9. `QuranSchedule::progress_percentage`/`current_progress` are rewritten to sum **graded** Homework rows FK'd to that schedule (`$this->homework()->where('status', 'graded')->sum('pages_memorized')`), replacing today's unscoped "all of the student's tracking history since `start_date`" query. Only `status = 'graded'` counts — `absent`/`not_prepared` correctly contribute nothing, same as `pending`.
10. The dead route/method `quran-homework.student` → `QuranHomeworkController::studentHomework()` (renders `Quran/Homework/StudentView`, a page that has never existed) is fixed rather than deleted — it's a natural fit for the design doc's §2.3 "guardian sees the Homework entry, plus history" requirement, and touching it doesn't require resolving the `QuranHomePractice` question (this is a *read view of Homework*, a different model entirely). `StudentView.jsx` is built as part of Task 8.
11. `app/Console/Commands/QuranBackfillPages.php` and `QuranBackfillStructuralUnits.php` (plus their shared test) are deleted — they were one-time historical backfill utilities for structural-unit data that the Observer now always computes at write time; there's nothing left to backfill once this migration lands.

---

## File Structure

**Migrations (new):**
- `database/migrations/2026_08_23_000001_drop_quran_homework_table.php`
- `database/migrations/2026_08_23_000002_rebuild_quran_schedules_table.php`
- `database/migrations/2026_08_23_000003_rename_quran_tracking_to_quran_homework.php`
- `database/migrations/2026_08_23_000004_update_quran_assessments_for_homework.php`

**Models:**
- Modify: `app/Models/QuranSchedule.php` (new fields/accessors)
- Delete: `app/Models/QuranTracking.php`
- Overwrite: `app/Models/QuranHomework.php` (merged content)
- Modify: `app/Models/QuranAssessment.php` (FK rename, `BelongsToSchool`)
- Modify: `app/Models/Student.php` (relationship updates)

**Observers/Services:**
- Delete: `app/Observers/QuranTrackingObserver.php`
- Create: `app/Observers/QuranHomeworkObserver.php`
- Modify: `app/Providers/AppServiceProvider.php` (observer binding)

**Console commands (deleted, see decision 10):**
- Delete: `app/Console/Commands/QuranBackfillPages.php`
- Delete: `app/Console/Commands/QuranBackfillStructuralUnits.php`
- Delete: `tests/Feature/QuranBackfillStructuralUnitsTest.php`

**Controllers:**
- Delete: `app/Http/Controllers/QuranTrackingController.php`
- Overwrite: `app/Http/Controllers/QuranHomeworkController.php`
- Modify: `app/Http/Controllers/QuranScheduleController.php` (`show()` only)
- Modify: `app/Http/Controllers/DashboardController.php`
- Modify → rename: `app/Http/Controllers/GuardianQuranTrackingController.php` → `app/Http/Controllers/GuardianQuranHomeworkController.php`

**Factories:**
- Delete: `database/factories/QuranTrackingFactory.php`
- Overwrite: `database/factories/QuranHomeworkFactory.php`
- Modify: `database/factories/QuranScheduleFactory.php`

**Routes:**
- Modify: `routes/web.php` (Quran block + guardian route)

**Frontend:**
- Delete: `resources/js/Pages/Quran/Tracking/` (whole folder)
- Overwrite: `resources/js/Pages/Quran/Homework/{Create,Edit,Index,Show}.jsx`
- Create: `resources/js/Pages/Quran/Homework/{StudentReport,StudentView}.jsx`
- Modify: `resources/js/Pages/Quran/Schedule/{Create,Edit,Index,Show}.jsx`
- Modify: `resources/js/Config/navigation.js`

**Tests:**
- Delete: `tests/Feature/QuranTrackingShowVerseTextTest.php` (superseded — see decision below)
- Modify (rewrite bodies to new model/route names): `tests/Feature/QuranHomeworkShowVerseTextTest.php`, `QuranHomeworkTenantIsolationTest.php`, `QuranScheduleTenantIsolationTest.php`, `QuranTrackingCalculatedVersesBugTest.php` → rename to `QuranHomeworkCalculatedVersesBugTest.php`, `QuranTrackingObserverStructuralUnitsTest.php` → rename to `QuranHomeworkObserverStructuralUnitsTest.php`, `QuranTrackingPageRangeApiTest.php`, `QuranTrackingPageVersesApiTest.php`
- Create: new tests per task below (schedule rebuild, chaining, grading, tenant isolation on `QuranAssessment`)
- Untouched: everything under `QuranHomePractice*`

---

### Task 1: Rebuild `QuranSchedule` schema and model

**Files:**
- Create: `database/migrations/2026_08_23_000002_rebuild_quran_schedules_table.php`
- Modify: `app/Models/QuranSchedule.php`
- Modify: `database/factories/QuranScheduleFactory.php`
- Modify: `tests/Feature/QuranScheduleTenantIsolationTest.php`
- Test: `tests/Feature/QuranScheduleRebuildTest.php` (new)

**Interfaces:**
- Produces: `QuranSchedule` fillable now `student_id, teacher_id, school_id, surah_from, verse_from, surah_to, verse_to, start_date, end_date, is_active, notes`; new accessor `getTargetTotalPagesAttribute()`; new relationship `homework(): HasMany<QuranHomework>` (consumed by Task 6).

- [ ] **Step 1: Write the failing test for the new schema shape**

```php
<?php

namespace Tests\Feature;

use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuranScheduleRebuildTest extends TestCase
{
    use RefreshDatabase;

    public function test_schedule_stores_verse_range_and_date_range(): void
    {
        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::create([
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'school_id' => $school->id,
            'surah_from' => 2,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 286,
            'start_date' => '2026-01-01',
            'end_date' => '2026-06-01',
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('quran_schedules', [
            'id' => $schedule->id,
            'surah_from' => 2,
            'verse_to' => 286,
        ]);
        $this->assertDatabaseMissing('quran_schedules', ['schedule_type' => 'weekly']);
    }

    public function test_target_total_pages_is_computed_not_stored(): void
    {
        \Illuminate\Support\Facades\Http::fake([
            'api.quran.com/api/v4/verses/by_key/1:1*' => \Illuminate\Support\Facades\Http::response([
                'verse' => ['page_number' => 1],
            ], 200),
            'api.quran.com/api/v4/verses/by_key/1:7*' => \Illuminate\Support\Facades\Http::response([
                'verse' => ['page_number' => 1],
            ], 200),
        ]);

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'surah_from' => 1,
            'verse_from' => 1,
            'surah_to' => 1,
            'verse_to' => 7,
        ]);

        // Al-Fatiha is entirely on page 1 — a single page.
        $this->assertSame(1, $schedule->target_total_pages);
    }
}
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `php8.4 artisan test --filter=QuranScheduleRebuildTest`
Expected: FAIL — column `surah_from` doesn't exist on `quran_schedules` yet (or `target_total_pages` attribute doesn't resolve).

- [ ] **Step 3: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quran_schedules', function (Blueprint $table) {
            $table->dropColumn(['schedule_type', 'target_pages_per_period', 'target_verses_per_period', 'target_total_pages']);
            $table->renameColumn('expected_completion_date', 'end_date');
        });

        Schema::table('quran_schedules', function (Blueprint $table) {
            $table->integer('surah_from')->after('school_id')->comment('Starting surah number (1-114)');
            $table->integer('verse_from')->after('surah_from')->comment('Starting verse number');
            $table->integer('surah_to')->after('verse_from')->comment('Ending surah number (1-114)');
            $table->integer('verse_to')->after('surah_to')->comment('Ending verse number');
        });
    }

    public function down(): void
    {
        Schema::table('quran_schedules', function (Blueprint $table) {
            $table->dropColumn(['surah_from', 'verse_from', 'surah_to', 'verse_to']);
            $table->renameColumn('end_date', 'expected_completion_date');
            $table->enum('schedule_type', ['daily', 'weekly', 'monthly'])->default('weekly');
            $table->integer('target_pages_per_period')->nullable();
            $table->integer('target_verses_per_period')->nullable();
            $table->integer('target_total_pages')->nullable();
        });
    }
};
```

- [ ] **Step 4: Rewrite `app/Models/QuranSchedule.php`**

```php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use App\Services\QuranTrackingCalculator;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuranSchedule extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'student_id',
        'teacher_id',
        'school_id',
        'surah_from',
        'verse_from',
        'surah_to',
        'verse_to',
        'start_date',
        'end_date',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'surah_from' => 'integer',
        'verse_from' => 'integer',
        'surah_to' => 'integer',
        'verse_to' => 'integer',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function homework()
    {
        return $this->hasMany(QuranHomework::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function getDaysElapsedAttribute()
    {
        return $this->start_date->diffInDays(Carbon::now());
    }

    public function getDaysRemainingAttribute()
    {
        if (! $this->end_date) {
            return null;
        }

        $remaining = Carbon::now()->diffInDays($this->end_date, false);

        return $remaining > 0 ? $remaining : 0;
    }

    public function getIsOverdueAttribute()
    {
        if (! $this->end_date) {
            return false;
        }

        return Carbon::now()->isAfter($this->end_date);
    }

    /**
     * Computed, not stored — derived from the verse range via the same
     * page-mapping infra Homework uses, so it can never drift from it.
     */
    public function getTargetTotalPagesAttribute()
    {
        $calculator = app(QuranTrackingCalculator::class);
        $pages = $calculator->derivePagesFromVerses($this->surah_from, $this->verse_from, $this->surah_to, $this->verse_to);

        if (! $pages) {
            return null;
        }

        return $calculator->computePages($pages[0], $pages[1]);
    }

    public function getProgressPercentageAttribute()
    {
        $target = $this->target_total_pages;

        if (! $target) {
            return 0;
        }

        return min(100, round(($this->current_progress / $target) * 100));
    }

    public function getCurrentProgressAttribute()
    {
        return $this->homework()->where('status', 'graded')->sum('pages_memorized');
    }

    public function getStatusBadgeAttribute()
    {
        if (! $this->is_active) {
            return 'inactive';
        }

        if ($this->is_overdue) {
            return 'overdue';
        }

        $progress = $this->progress_percentage;

        if ($progress >= 100) {
            return 'completed';
        } elseif ($progress >= 75) {
            return 'on_track';
        } elseif ($progress >= 50) {
            return 'behind';
        } else {
            return 'significantly_behind';
        }
    }

    public function deactivate()
    {
        $this->update(['is_active' => false]);
    }

    public function activate()
    {
        self::where('student_id', $this->student_id)
            ->where('id', '!=', $this->id)
            ->update(['is_active' => false]);

        $this->update(['is_active' => true]);
    }

    public static function validationRules()
    {
        return [
            'student_id' => 'required|exists:students,id',
            'surah_from' => 'required|integer|min:1|max:114',
            'verse_from' => 'required|integer|min:1',
            'surah_to' => 'required|integer|min:1|max:114',
            'verse_to' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($schedule) {
            if ($schedule->is_active) {
                self::where('student_id', $schedule->student_id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }
        });

        static::updating(function ($schedule) {
            if ($schedule->is_active && $schedule->isDirty('is_active')) {
                self::where('student_id', $schedule->student_id)
                    ->where('id', '!=', $schedule->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }
        });
    }
}
```

- [ ] **Step 5: Update the factory**

```php
<?php

namespace Database\Factories;

use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuranSchedule>
 */
class QuranScheduleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'teacher_id' => User::factory()->state(['role' => 'teacher']),
            'school_id' => School::factory(),
            'surah_from' => 1,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 5,
            'start_date' => now(),
            'is_active' => true,
        ];
    }
}
```

- [ ] **Step 6: Run migration and test, confirm pass**

Run: `php8.4 artisan migrate --env=testing` (or let RefreshDatabase handle it) then `php8.4 artisan test --filter=QuranScheduleRebuildTest`
Expected: PASS

- [ ] **Step 7: Fix `tests/Feature/QuranScheduleTenantIsolationTest.php`**

Open the file — it creates schedules via `QuranSchedule::factory()->create([...])`. Since the factory's default state already has valid values for every new column, this test should need **no changes at all** unless it passes explicit old-field overrides (`schedule_type`, etc.) inline. Read it, and only touch lines that reference a field this migration removed.

Run: `php8.4 artisan test --filter=QuranScheduleTenantIsolationTest`
Expected: PASS (with no edits, or minimal edits if old fields were referenced)

- [ ] **Step 8: Commit**

```bash
git add database/migrations/2026_08_23_000002_rebuild_quran_schedules_table.php app/Models/QuranSchedule.php database/factories/QuranScheduleFactory.php tests/Feature/QuranScheduleRebuildTest.php tests/Feature/QuranScheduleTenantIsolationTest.php
git commit -m "refactor(quran): rebuild QuranSchedule as a verse-range + date-range plan"
```

---

### Task 2: Delete the old `QuranHomework` entity and obsolete backfill commands

**Files:**
- Create: `database/migrations/2026_08_23_000001_drop_quran_homework_table.php`
- Delete: `app/Console/Commands/QuranBackfillPages.php`
- Delete: `app/Console/Commands/QuranBackfillStructuralUnits.php`
- Delete: `tests/Feature/QuranBackfillStructuralUnitsTest.php`

**Interfaces:**
- Produces: an empty `quran_homework` table name, free for Task 3 to claim via rename.

- [ ] **Step 1: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('quran_homework');
    }

    public function down(): void
    {
        // Deliberately not recreated — the old QuranHomework schema is gone
        // for good (confirmed: no real data existed in this table). A
        // rollback of this migration is only meaningful together with a
        // rollback of every later migration in this set.
    }
};
```

- [ ] **Step 2: Delete the obsolete console commands and their test**

```bash
rm app/Console/Commands/QuranBackfillPages.php
rm app/Console/Commands/QuranBackfillStructuralUnits.php
rm tests/Feature/QuranBackfillStructuralUnitsTest.php
```

These were one-time historical utilities to backfill structural-unit data (Juz/Hizb/Rub) onto rows that predated the Observer computing them automatically. Nothing is left to backfill once this migration set lands, and their test directly instantiates `QuranHomework`/`QuranTracking` in the old shape, which no longer exists after this task.

- [ ] **Step 3: Run the full suite to confirm nothing else references the deleted commands**

Run: `grep -rn "QuranBackfillPages\|QuranBackfillStructuralUnits" app/ tests/ routes/`
Expected: no matches (these commands aren't called from any controller/route — they were `artisan` CLI-only).

Run: `php8.4 artisan test --filter=Quran`
Expected: Task 1's tests still pass; everything Homework/Tracking-related still fails at this point (expected — Task 3 hasn't run yet). Confirm no *new* failures were introduced by this task specifically (compare against Task 1's baseline).

- [ ] **Step 4: Commit**

```bash
git add database/migrations/2026_08_23_000001_drop_quran_homework_table.php
git rm app/Console/Commands/QuranBackfillPages.php app/Console/Commands/QuranBackfillStructuralUnits.php tests/Feature/QuranBackfillStructuralUnitsTest.php
git commit -m "refactor(quran): drop the old QuranHomework table and obsolete backfill commands"
```

---

### Task 3: Rename `QuranTracking` → `QuranHomework` (table, model, observer, factory)

**Files:**
- Create: `database/migrations/2026_08_23_000003_rename_quran_tracking_to_quran_homework.php`
- Delete: `app/Models/QuranTracking.php`
- Overwrite: `app/Models/QuranHomework.php`
- Delete: `app/Observers/QuranTrackingObserver.php`
- Create: `app/Observers/QuranHomeworkObserver.php`
- Modify: `app/Providers/AppServiceProvider.php`
- Delete: `database/factories/QuranTrackingFactory.php`
- Overwrite: `database/factories/QuranHomeworkFactory.php`
- Test: `tests/Feature/QuranHomeworkObserverStructuralUnitsTest.php` (renamed from `QuranTrackingObserverStructuralUnitsTest.php`)

**Interfaces:**
- Produces: `QuranHomework` model with fillable `student_id, teacher_id, school_id, quran_schedule_id, assigned_date, status, reading_type, surah_from, verse_from, surah_to, verse_to, page_from, page_to, quality_rating, pages_memorized, surahs_memorized, juz_memorized, juz_from, juz_to, hizb_from, hizb_to, rub_from, rub_to, subac_participation, notes`; relationships `student()`, `teacher()`, `school()`, `schedule(): BelongsTo<QuranSchedule>`, `assessment(): HasOne<QuranAssessment>`; scopes `pending()`, `graded()`, `absent()`, `notPrepared()`. Consumed by Task 4 (`assessment()`), Task 5 (controller), Task 6 (`QuranSchedule::homework()`).

- [ ] **Step 1: Rename the existing structural-units test file**

```bash
git mv tests/Feature/QuranTrackingObserverStructuralUnitsTest.php tests/Feature/QuranHomeworkObserverStructuralUnitsTest.php
```

Open it and replace every `QuranTracking` reference with `QuranHomework`, and the class name `QuranTrackingObserverStructuralUnitsTest` with `QuranHomeworkObserverStructuralUnitsTest`. This test already exercises the Observer's Juz/Hizb/Rub computation — it doesn't need new assertions, just retargeting.

- [ ] **Step 2: Run it, confirm it fails**

Run: `php8.4 artisan test --filter=QuranHomeworkObserverStructuralUnitsTest`
Expected: FAIL — `QuranHomework` model doesn't have these fields/behavior yet (or references break because `QuranTracking` class was already partially touched).

- [ ] **Step 3: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('quran_tracking', 'quran_homework');

        Schema::table('quran_homework', function (Blueprint $table) {
            $table->foreignId('quran_schedule_id')->nullable()->after('school_id')
                ->constrained('quran_schedules')->onDelete('cascade');
            $table->enum('status', ['pending', 'graded', 'absent', 'not_prepared'])
                ->default('pending')->after('quran_schedule_id');
            // Added alongside the old `difficulty` column (not replacing it in
            // place) so the CASE-based remap below can read the old values
            // before they're dropped.
            $table->enum('quality_rating', ['excellent', 'very_good', 'moderate', 'poor'])
                ->nullable()->after('difficulty');
        });

        // Every pre-existing row predates the assign-then-grade lifecycle —
        // it already represents a recorded, complete session.
        DB::table('quran_homework')->update(['status' => 'graded']);

        // Remap the old 3-value difficulty scale onto the new 4-value
        // quality-rating scale (best/mid/worst preserved; there's no
        // historical data for the new "very_good" tier).
        DB::statement("UPDATE quran_homework SET quality_rating = CASE difficulty
            WHEN 'very_well' THEN 'excellent'
            WHEN 'middle' THEN 'moderate'
            WHEN 'difficult' THEN 'poor'
            ELSE NULL END");

        Schema::table('quran_homework', function (Blueprint $table) {
            $table->dropColumn('difficulty');
            $table->renameColumn('date', 'assigned_date');
        });
    }

    public function down(): void
    {
        Schema::table('quran_homework', function (Blueprint $table) {
            $table->renameColumn('assigned_date', 'date');
            $table->enum('difficulty', ['very_well', 'middle', 'difficult'])->default('middle')->after('quran_schedule_id');
        });

        DB::statement("UPDATE quran_homework SET difficulty = CASE quality_rating
            WHEN 'excellent' THEN 'very_well'
            WHEN 'very_good' THEN 'very_well'
            WHEN 'moderate' THEN 'middle'
            WHEN 'poor' THEN 'difficult'
            ELSE 'middle' END");

        Schema::table('quran_homework', function (Blueprint $table) {
            $table->dropColumn('quality_rating');
            $table->dropForeign(['quran_schedule_id']);
            $table->dropColumn(['quran_schedule_id', 'status']);
        });

        Schema::rename('quran_homework', 'quran_tracking');
    }
};
```

- [ ] **Step 4: Delete `app/Models/QuranTracking.php` and write `app/Models/QuranHomework.php`**

```bash
rm app/Models/QuranTracking.php
rm app/Models/QuranHomework.php
```

Then create `app/Models/QuranHomework.php`:

```php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuranHomework extends Model
{
    use HasFactory, BelongsToSchool;

    protected $table = 'quran_homework';

    protected $fillable = [
        'student_id',
        'teacher_id',
        'school_id',
        'quran_schedule_id',
        'assigned_date',
        'status',
        'reading_type',
        'surah_from',
        'verse_from',
        'surah_to',
        'verse_to',
        'page_from',
        'page_to',
        'quality_rating',
        'pages_memorized',
        'surahs_memorized',
        'juz_memorized',
        'juz_from',
        'juz_to',
        'hizb_from',
        'hizb_to',
        'rub_from',
        'rub_to',
        'subac_participation',
        'notes',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'surah_from' => 'integer',
        'verse_from' => 'integer',
        'surah_to' => 'integer',
        'verse_to' => 'integer',
        'page_from' => 'integer',
        'page_to' => 'integer',
        'pages_memorized' => 'integer',
        'surahs_memorized' => 'integer',
        'juz_memorized' => 'integer',
        'juz_from' => 'integer',
        'juz_to' => 'integer',
        'hizb_from' => 'integer',
        'hizb_to' => 'integer',
        'rub_from' => 'integer',
        'rub_to' => 'integer',
        'subac_participation' => 'boolean',
    ];

    protected $appends = ['reading_type_label', 'quality_rating_label', 'total_verses', 'status_label'];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function schedule()
    {
        return $this->belongsTo(QuranSchedule::class, 'quran_schedule_id');
    }

    public function assessment()
    {
        return $this->hasOne(QuranAssessment::class);
    }

    public function scopeReadingType($query, $type)
    {
        return $query->where('reading_type', $type);
    }

    public function scopeDateRange($query, $from, $to)
    {
        return $query->whereBetween('assigned_date', [$from, $to]);
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeGraded($query)
    {
        return $query->where('status', 'graded');
    }

    public function scopeAbsent($query)
    {
        return $query->where('status', 'absent');
    }

    public function scopeNotPrepared($query)
    {
        return $query->where('status', 'not_prepared');
    }

    public function getTotalVersesAttribute()
    {
        if ($this->surah_from == $this->surah_to) {
            return ($this->verse_to - $this->verse_from) + 1;
        }

        // Multi-surah: computed in the controller via QuranApiClient.
        return null;
    }

    public function getIsMultiSurahAttribute()
    {
        return $this->surah_from != $this->surah_to;
    }

    public function getSurahRangeAttribute()
    {
        if ($this->surah_from == $this->surah_to) {
            return "Surah {$this->surah_from}";
        }

        return "Surah {$this->surah_from} - {$this->surah_to}";
    }

    public function getReadingTypeLabelAttribute()
    {
        return match ($this->reading_type) {
            'new_learning' => 'New Learning',
            'revision' => 'Revision',
            'subac' => 'Subac',
            default => $this->reading_type,
        };
    }

    public function getQualityRatingLabelAttribute()
    {
        return match ($this->quality_rating) {
            'excellent' => 'Excellent',
            'very_good' => 'Very Good',
            'moderate' => 'Moderate',
            'poor' => 'Poor',
            default => null,
        };
    }

    public function getStatusLabelAttribute()
    {
        return match ($this->status) {
            'pending' => 'Pending',
            'graded' => 'Graded',
            'absent' => 'Absent',
            'not_prepared' => 'Not Prepared',
            default => $this->status,
        };
    }
}
```

- [ ] **Step 5: Rename the Observer**

```bash
rm app/Observers/QuranTrackingObserver.php
```

Create `app/Observers/QuranHomeworkObserver.php`:

```php
<?php

namespace App\Observers;

use App\Models\QuranHomework;
use App\Services\QuranTrackingCalculator;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;

/**
 * Automatically computes pages_memorized, surahs_memorized, juz_memorized,
 * and the Juz/Hizb/Rub ranges on create and update.
 */
class QuranHomeworkObserver
{
    protected QuranTrackingCalculator $calculator;

    public function __construct()
    {
        $this->calculator = App::make(QuranTrackingCalculator::class);
    }

    public function creating(QuranHomework $model): void
    {
        $this->computeAndSet($model);
    }

    public function updating(QuranHomework $model): void
    {
        $this->computeAndSet($model);
    }

    protected function computeAndSet(QuranHomework $model): void
    {
        try {
            $metrics = $this->calculator->computeAllMetrics(
                $model->page_from,
                $model->page_to,
                $model->surah_from,
                $model->surah_to,
                $model->verse_from,
                $model->verse_to
            );

            if (! empty($metrics['page_from']) && empty($model->page_from)) {
                $model->page_from = $metrics['page_from'];
            }
            if (! empty($metrics['page_to']) && empty($model->page_to)) {
                $model->page_to = $metrics['page_to'];
            }

            $model->pages_memorized = $metrics['pages_memorized'];
            $model->surahs_memorized = $metrics['surahs_memorized'];
            $model->juz_memorized = $metrics['juz_memorized'];
            $model->juz_from = $metrics['juz_from'];
            $model->juz_to = $metrics['juz_to'];
            $model->hizb_from = $metrics['hizb_from'];
            $model->hizb_to = $metrics['hizb_to'];
            $model->rub_from = $metrics['rub_from'];
            $model->rub_to = $metrics['rub_to'];
        } catch (\Exception $e) {
            Log::error('QuranHomeworkObserver: Failed to compute metrics', [
                'model_id' => $model->id ?? 'new',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $model->pages_memorized = $model->pages_memorized ?? 0;
            $model->surahs_memorized = $model->surahs_memorized ?? 0;
            $model->juz_memorized = $model->juz_memorized ?? 0;
        }
    }
}
```

Note: there is no `created()`/auto-complete method anymore — grading now happens directly against the same row that was created, so there's nothing to search for and match.

- [ ] **Step 6: Update the observer binding**

In `app/Providers/AppServiceProvider.php`, replace:

```php
QuranTracking::observe(QuranTrackingObserver::class);
```

with:

```php
QuranHomework::observe(QuranHomeworkObserver::class);
```

(and update the corresponding `use` imports at the top of the file.)

- [ ] **Step 7: Rename the factory**

```bash
rm database/factories/QuranTrackingFactory.php
rm database/factories/QuranHomeworkFactory.php
```

Create `database/factories/QuranHomeworkFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuranHomework>
 */
class QuranHomeworkFactory extends Factory
{
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'teacher_id' => User::factory()->state(['role' => 'teacher']),
            'school_id' => School::factory(),
            'quran_schedule_id' => null,
            'assigned_date' => now(),
            'status' => 'pending',
            'reading_type' => 'new_learning',
            'surah_from' => 1,
            'surah_to' => 1,
            'verse_from' => 1,
            'verse_to' => 7,
            'quality_rating' => null,
        ];
    }
}
```

- [ ] **Step 8: Run the renamed test, confirm it passes**

Run: `php8.4 artisan test --filter=QuranHomeworkObserverStructuralUnitsTest`
Expected: PASS

- [ ] **Step 9: Update `app/Models/Student.php` relationships**

Replace:

```php
public function quranTracking()
{
    return $this->hasMany(QuranTracking::class);
}

public function quranHomework()
{
    return $this->hasMany(QuranHomework::class);
}

public function pendingQuranHomework()
{
    return $this->hasMany(QuranHomework::class)
        ->where('completed', false);
}
```

with:

```php
public function quranHomework()
{
    return $this->hasMany(QuranHomework::class);
}

public function pendingQuranHomework()
{
    return $this->hasMany(QuranHomework::class)
        ->where('status', 'pending');
}
```

Leave `quranHomePractice()`, `quranSchedules()`, `activeQuranSchedule()` untouched.

- [ ] **Step 10: Run the full Quran suite**

Run: `php8.4 artisan test --filter=Quran`
Expected: everything from Task 1 still passes; Task 3's own test passes; controller/route/frontend-dependent tests still fail (expected — Task 5 hasn't run).

- [ ] **Step 11: Commit**

```bash
git add database/migrations/2026_08_23_000003_rename_quran_tracking_to_quran_homework.php app/Models/QuranHomework.php app/Observers/QuranHomeworkObserver.php app/Providers/AppServiceProvider.php app/Models/Student.php database/factories/QuranHomeworkFactory.php tests/Feature/QuranHomeworkObserverStructuralUnitsTest.php
git rm app/Models/QuranTracking.php app/Observers/QuranTrackingObserver.php database/factories/QuranTrackingFactory.php
git commit -m "refactor(quran): rename QuranTracking into the new QuranHomework entity"
```

---

### Task 4: Repoint `QuranAssessment`'s FK onto Homework and fix its tenant-isolation gap

**Files:**
- Create: `database/migrations/2026_08_23_000004_update_quran_assessments_for_homework.php`
- Modify: `app/Models/QuranAssessment.php`
- Test: `tests/Feature/QuranAssessmentTenantIsolationTest.php` (new)

**Interfaces:**
- Consumes: `QuranHomework` (Task 3).
- Produces: `QuranAssessment` fillable `quran_homework_id, school_id, fluency_rating, tajweed_rating, mistakes_count, assessment_notes`; relationship `homework(): BelongsTo<QuranHomework>`. Consumed by Task 5's `grade()`/`markMissed()` actions.

- [ ] **Step 1: Write the failing tenant-isolation test**

```php
<?php

namespace Tests\Feature;

use App\Models\QuranAssessment;
use App\Models\QuranHomework;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuranAssessmentTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_assessment_is_scoped_to_its_school(): void
    {
        $schoolA = School::factory()->create();
        $schoolB = School::factory()->create();

        $teacherUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $schoolA->id, 'user_id' => $teacherUserA->id]);
        $studentA = Student::factory()->create(['school_id' => $schoolA->id]);

        $homeworkA = QuranHomework::factory()->create([
            'school_id' => $schoolA->id,
            'student_id' => $studentA->id,
            'teacher_id' => $teacherUserA->id,
        ]);

        $this->actingAs($teacherUserA);
        $assessment = QuranAssessment::create([
            'quran_homework_id' => $homeworkA->id,
            'fluency_rating' => 5,
        ]);

        $this->assertSame($schoolA->id, $assessment->school_id);

        $teacherUserB = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'teacher']);
        $this->actingAs($teacherUserB);

        $this->assertNull(QuranAssessment::find($assessment->id));
    }
}
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `php8.4 artisan test --filter=QuranAssessmentTenantIsolationTest`
Expected: FAIL — no `school_id` column on `quran_assessments` yet, and no global scope applied.

- [ ] **Step 3: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quran_assessments', function (Blueprint $table) {
            $table->foreignId('quran_homework_id')->nullable()->after('id')
                ->constrained('quran_homework')->onDelete('cascade');
            $table->foreignId('school_id')->nullable()->after('quran_homework_id')
                ->constrained('schools')->onDelete('cascade');
        });

        // Same underlying rows as before — quran_tracking_id just becomes
        // quran_homework_id, since quran_tracking was renamed in the
        // previous migration.
        DB::table('quran_assessments')->orderBy('id')->chunkById(200, function ($rows) {
            foreach ($rows as $row) {
                DB::table('quran_assessments')->where('id', $row->id)->update([
                    'quran_homework_id' => $row->quran_tracking_id,
                ]);
            }
        });

        DB::table('quran_assessments')->orderBy('id')->chunkById(200, function ($rows) {
            foreach ($rows as $row) {
                $schoolId = DB::table('quran_homework')->where('id', $row->quran_homework_id)->value('school_id');
                if ($schoolId) {
                    DB::table('quran_assessments')->where('id', $row->id)->update(['school_id' => $schoolId]);
                }
            }
        });

        Schema::table('quran_assessments', function (Blueprint $table) {
            $table->dropForeign(['quran_tracking_id']);
            $table->dropColumn('quran_tracking_id');
        });

        Schema::table('quran_assessments', function (Blueprint $table) {
            $table->foreignId('quran_homework_id')->nullable(false)->change();
            $table->foreignId('school_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('quran_assessments', function (Blueprint $table) {
            $table->foreignId('quran_tracking_id')->nullable()->after('id')
                ->constrained('quran_homework')->onDelete('cascade');
        });

        DB::table('quran_assessments')->orderBy('id')->chunkById(200, function ($rows) {
            foreach ($rows as $row) {
                DB::table('quran_assessments')->where('id', $row->id)->update([
                    'quran_tracking_id' => $row->quran_homework_id,
                ]);
            }
        });

        Schema::table('quran_assessments', function (Blueprint $table) {
            $table->dropForeign(['quran_homework_id']);
            $table->dropForeign(['school_id']);
            $table->dropColumn(['quran_homework_id', 'school_id']);
            $table->foreignId('quran_tracking_id')->nullable(false)->change();
        });
    }
};
```

- [ ] **Step 4: Update `app/Models/QuranAssessment.php`**

```php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuranAssessment extends Model
{
    use HasFactory, BelongsToSchool;

    protected $table = 'quran_assessments';

    protected $fillable = [
        'quran_homework_id',
        'school_id',
        'fluency_rating',
        'tajweed_rating',
        'mistakes_count',
        'assessment_notes',
    ];

    protected $casts = [
        'fluency_rating' => 'integer',
        'tajweed_rating' => 'integer',
        'mistakes_count' => 'integer',
    ];

    public function homework()
    {
        return $this->belongsTo(QuranHomework::class, 'quran_homework_id');
    }

    public function getAverageRatingAttribute()
    {
        $ratings = array_filter([$this->fluency_rating, $this->tajweed_rating]);

        if (empty($ratings)) {
            return null;
        }

        return round(array_sum($ratings) / count($ratings), 1);
    }

    public function hasRatings()
    {
        return $this->fluency_rating !== null || $this->tajweed_rating !== null;
    }

    public function getPerformanceLevelAttribute()
    {
        $avg = $this->average_rating;

        if ($avg === null) {
            return null;
        }

        return match (true) {
            $avg >= 4.5 => 'Excellent',
            $avg >= 3.5 => 'Very Good',
            $avg >= 2.5 => 'Good',
            $avg >= 1.5 => 'Fair',
            default => 'Needs Improvement',
        };
    }
}
```

`BelongsToSchool` auto-populates `school_id` from the authenticated user on create, so the app never needs to set it explicitly going forward — only the migration's one-time backfill above deals with pre-existing rows.

- [ ] **Step 5: Run the test, confirm it passes**

Run: `php8.4 artisan test --filter=QuranAssessmentTenantIsolationTest`
Expected: PASS

- [ ] **Step 6: Run the full Quran suite**

Run: `php8.4 artisan test --filter=Quran`
Expected: no new failures beyond what's still pending controller/route work (Task 5).

- [ ] **Step 7: Commit**

```bash
git add database/migrations/2026_08_23_000004_update_quran_assessments_for_homework.php app/Models/QuranAssessment.php tests/Feature/QuranAssessmentTenantIsolationTest.php
git commit -m "fix(quran): repoint QuranAssessment onto Homework and add school_id isolation"
```

---

### Task 5: Rebuild `QuranHomeworkController`, its routes, and the chaining/grading logic

**Files:**
- Delete: `app/Http/Controllers/QuranTrackingController.php`
- Overwrite: `app/Http/Controllers/QuranHomeworkController.php`
- Modify: `routes/web.php`
- Test: `tests/Feature/QuranHomeworkChainingTest.php` (new)
- Test: `tests/Feature/QuranHomeworkGradingTest.php` (new)
- Modify: `tests/Feature/QuranHomeworkShowVerseTextTest.php`
- Delete: `tests/Feature/QuranTrackingShowVerseTextTest.php` (now a duplicate of the file above, once retargeted)
- Modify: `tests/Feature/QuranHomeworkTenantIsolationTest.php`
- Rename + modify: `tests/Feature/QuranTrackingCalculatedVersesBugTest.php` → `QuranHomeworkCalculatedVersesBugTest.php`
- Modify: `tests/Feature/QuranTrackingPageRangeApiTest.php`, `tests/Feature/QuranTrackingPageVersesApiTest.php` (rename if they reference the old controller/model directly; leave as-is if they only hit the unchanged `api.quran.*` route names)

**Interfaces:**
- Consumes: `QuranHomework::schedule()`, `QuranSchedule` (Task 1), `QuranAssessment::homework()` (Task 4).
- Produces: routes `quran-homework.{index,create,store,edit,update,destroy,show,student-report,student,grade,mark-ungraded}`, `api.quran.homework.next-from`.

- [ ] **Step 1: Write the failing chaining test**

```php
<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuranHomeworkChainingTest extends TestCase
{
    use RefreshDatabase;

    protected function fakeQuranApi(): void
    {
        Http::fake([
            'api.quran.com/api/v4/chapters/*' => Http::response([
                'chapter' => ['id' => 2, 'name_simple' => 'Al-Baqarah', 'name_arabic' => 'البقرة', 'verses_count' => 286],
            ], 200),
            'api.quran.com/*' => Http::response([], 200),
        ]);
    }

    public function test_first_homework_entry_derives_from_point_from_schedule(): void
    {
        $this->withoutVite();
        $this->fakeQuranApi();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'surah_from' => 2,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 286,
        ]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.store'), [
            'student_id' => $student->id,
            'reading_type' => 'new_learning',
            'surah_to' => 2,
            'verse_to' => 10,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('quran_homework', [
            'student_id' => $student->id,
            'quran_schedule_id' => $schedule->id,
            'surah_from' => 2,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 10,
            'status' => 'pending',
        ]);
    }

    public function test_second_homework_entry_derives_from_point_from_previous_entry(): void
    {
        $this->withoutVite();
        $this->fakeQuranApi();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'surah_from' => 2,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 286,
        ]);

        QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'quran_schedule_id' => $schedule->id,
            'surah_from' => 2,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 10,
        ]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.store'), [
            'student_id' => $student->id,
            'reading_type' => 'new_learning',
            'surah_to' => 2,
            'verse_to' => 20,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('quran_homework', [
            'student_id' => $student->id,
            'surah_from' => 2,
            'verse_from' => 10,
            'surah_to' => 2,
            'verse_to' => 20,
        ]);
    }

    public function test_homework_creation_is_blocked_without_an_active_schedule(): void
    {
        $this->withoutVite();
        $this->fakeQuranApi();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.store'), [
            'student_id' => $student->id,
            'reading_type' => 'new_learning',
            'surah_to' => 2,
            'verse_to' => 10,
        ]);

        $response->assertSessionHasErrors('student_id');
        $this->assertDatabaseCount('quran_homework', 0);
    }
}
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `php8.4 artisan test --filter=QuranHomeworkChainingTest`
Expected: FAIL — `store()` still validates/accepts free-choice `surah_from`/`verse_from` and doesn't consult any schedule.

- [ ] **Step 3: Write the failing grading test**

```php
<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuranHomeworkGradingTest extends TestCase
{
    use RefreshDatabase;

    public function test_grading_marks_status_graded_and_stores_assessment(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.grade', $homework->id), [
            'quality_rating' => 'excellent',
            'fluency_rating' => 5,
            'tajweed_rating' => 4,
            'mistakes_count' => 1,
        ]);

        $response->assertRedirect();

        $homework->refresh();
        $this->assertSame('graded', $homework->status);
        $this->assertSame('excellent', $homework->quality_rating);

        $this->assertDatabaseHas('quran_assessments', [
            'quran_homework_id' => $homework->id,
            'fluency_rating' => 5,
            'tajweed_rating' => 4,
        ]);
    }

    public function test_marking_absent_clears_any_existing_assessment_and_quality_rating(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'graded',
            'quality_rating' => 'excellent',
        ]);
        $homework->assessment()->create(['school_id' => $school->id, 'fluency_rating' => 5]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.mark-ungraded', $homework->id), [
            'status' => 'absent',
            'notes' => 'Student was absent.',
        ]);

        $response->assertRedirect();

        $homework->refresh();
        $this->assertSame('absent', $homework->status);
        $this->assertNull($homework->quality_rating);
        $this->assertNull($homework->assessment()->first());
    }

    public function test_marking_not_prepared_is_accepted_as_a_distinct_status(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.mark-ungraded', $homework->id), [
            'status' => 'not_prepared',
        ]);

        $response->assertRedirect();
        $this->assertSame('not_prepared', $homework->fresh()->status);
    }

    public function test_mark_ungraded_rejects_an_invalid_status_value(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.mark-ungraded', $homework->id), [
            'status' => 'graded', // not a valid value for this endpoint — grading has its own action
        ]);

        $response->assertSessionHasErrors('status');
    }
}
```

- [ ] **Step 4: Run it, confirm it fails**

Run: `php8.4 artisan test --filter=QuranHomeworkGradingTest`
Expected: FAIL — routes `quran-homework.grade`/`quran-homework.mark-ungraded` don't exist yet.

- [ ] **Step 5: Delete the old Tracking controller and rewrite the Homework controller**

```bash
rm app/Http/Controllers/QuranTrackingController.php
```

Overwrite `app/Http/Controllers/QuranHomeworkController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\External\QuranApiClient;
use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuranHomeworkController extends Controller
{
    protected $quranApi;

    public function __construct(QuranApiClient $quranApi)
    {
        $this->quranApi = $quranApi;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $query = QuranHomework::with(['student.grade', 'teacher', 'schedule'])
            ->where('school_id', $user->school_id);

        if ($user->isTeacher()) {
            $query->where('teacher_id', $user->id);
        }

        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('student_id'), fn ($q) => $q->where('student_id', $request->student_id))
            ->when($request->filled('reading_type'), fn ($q) => $q->where('reading_type', $request->reading_type));

        $homework = $query->orderBy('assigned_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Quran/Homework/Index', [
            'homework' => $homework,
            'students' => $this->studentsForUser($user),
            'filters' => $request->only(['status', 'student_id', 'reading_type']),
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        // Homework's From point is always derived from the student's active
        // Schedule (or the previous entry) — never freely chosen — so a
        // student without one isn't offered here.
        $students = $this->studentsForUser($user)
            ->filter(fn ($student) => $student->activeQuranSchedule !== null)
            ->values();

        return Inertia::render('Quran/Homework/Create', [
            'students' => $students,
            'surahs' => $this->quranApi->getSurahs(),
            'preSelectedStudentId' => $request->query('student_id'),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', QuranHomework::class);

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'reading_type' => 'required|in:new_learning,revision,subac',
            'surah_to' => 'required|integer|min:1|max:114',
            'verse_to' => 'required|integer|min:1',
            'page_from' => 'nullable|integer|min:1|max:604',
            'page_to' => 'nullable|integer|min:1|max:604',
            'notes' => 'nullable|string|max:1000',
        ]);

        $schedule = QuranSchedule::where('student_id', $validated['student_id'])
            ->where('is_active', true)
            ->first();

        if (! $schedule) {
            return back()->withErrors([
                'student_id' => 'This student has no active Quran schedule. Create one before assigning homework.',
            ])->withInput();
        }

        [$surahFrom, $verseFrom] = $this->deriveFromPoint($schedule);

        $validation = $this->quranApi->validateMultiSurahRange(
            $surahFrom,
            $validated['surah_to'],
            $verseFrom,
            $validated['verse_to']
        );

        if (! $validation['valid']) {
            return back()->withErrors(['verse_range' => $validation['error']])->withInput();
        }

        $homework = QuranHomework::create([
            'student_id' => $validated['student_id'],
            'teacher_id' => auth()->id(),
            'school_id' => auth()->user()->school_id,
            'quran_schedule_id' => $schedule->id,
            'assigned_date' => now(),
            'status' => 'pending',
            'reading_type' => $validated['reading_type'],
            'surah_from' => $surahFrom,
            'verse_from' => $verseFrom,
            'surah_to' => $validated['surah_to'],
            'verse_to' => $validated['verse_to'],
            'page_from' => $validated['page_from'] ?? null,
            'page_to' => $validated['page_to'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('quran-homework.show', $homework)
            ->with('success', 'Homework assigned successfully!');
    }

    /**
     * The rule that stops Homework drifting from its Schedule: the first
     * entry starts where the Schedule starts; every entry after that starts
     * where the previous one ended.
     */
    protected function deriveFromPoint(QuranSchedule $schedule): array
    {
        $previous = QuranHomework::where('quran_schedule_id', $schedule->id)
            ->orderByDesc('assigned_date')
            ->orderByDesc('id')
            ->first();

        if ($previous) {
            return [$previous->surah_to, $previous->verse_to];
        }

        return [$schedule->surah_from, $schedule->verse_from];
    }

    /**
     * Backs the Create screen's read-only "Starting from" display once a
     * student is selected, before the teacher enters where it ends.
     */
    public function nextFrom(Student $student)
    {
        $schedule = QuranSchedule::where('student_id', $student->id)
            ->where('is_active', true)
            ->first();

        if (! $schedule) {
            return response()->json(['error' => 'No active schedule for this student.'], 404);
        }

        [$surahFrom, $verseFrom] = $this->deriveFromPoint($schedule);

        return response()->json(['surah_from' => $surahFrom, 'verse_from' => $verseFrom]);
    }

    public function show(Request $request, QuranHomework $quranHomework)
    {
        $this->authorize('view', $quranHomework);

        $quranHomework->load(['student', 'teacher', 'schedule', 'assessment']);

        $surahs = $this->quranApi->getSurahs();
        $surahsById = collect($surahs)->keyBy('id');

        if ($quranHomework->surah_from == $quranHomework->surah_to) {
            $surah = $surahsById->get($quranHomework->surah_from);
            $quranHomework->surah_name = $surah['name_simple'] ?? "Surah {$quranHomework->surah_from}";
            $quranHomework->surah_name_arabic = $surah['name_arabic'] ?? '';
        } else {
            $fromSurah = $surahsById->get($quranHomework->surah_from);
            $toSurah = $surahsById->get($quranHomework->surah_to);
            $quranHomework->surah_name = ($fromSurah['name_simple'] ?? "Surah {$quranHomework->surah_from}").
                                         ' - '.
                                         ($toSurah['name_simple'] ?? "Surah {$quranHomework->surah_to}");
            $quranHomework->surah_name_arabic = '';
        }

        $quranHomework->calculated_total_verses = $this->quranApi->calculateTotalVerses(
            $quranHomework->surah_from,
            $quranHomework->surah_to,
            $quranHomework->verse_from,
            $quranHomework->verse_to
        );

        $quranHomework->starting_verse_reference = "{$quranHomework->surah_from}:{$quranHomework->verse_from}";

        if ($quranHomework->page_from && $quranHomework->page_to) {
            $quranHomework->page_from_verses = $this->quranApi->getPageVerses($quranHomework->page_from);
            $quranHomework->page_to_verses = $quranHomework->page_to !== $quranHomework->page_from
                ? $this->quranApi->getPageVerses($quranHomework->page_to)
                : [];
        }

        return Inertia::render('Quran/Homework/Show', ['homework' => $quranHomework]);
    }

    public function edit(Request $request, QuranHomework $quranHomework)
    {
        $this->authorize('update', $quranHomework);

        $quranHomework->load(['student', 'schedule']);

        return Inertia::render('Quran/Homework/Edit', [
            'homework' => $quranHomework,
            'surahs' => $this->quranApi->getSurahs(),
        ]);
    }

    public function update(Request $request, QuranHomework $quranHomework)
    {
        $this->authorize('update', $quranHomework);

        $validated = $request->validate([
            'surah_to' => 'required|integer|min:1|max:114',
            'verse_to' => 'required|integer|min:1',
            'page_from' => 'nullable|integer|min:1|max:604',
            'page_to' => 'nullable|integer|min:1|max:604',
            'reading_type' => 'required|in:new_learning,revision,subac',
            'notes' => 'nullable|string|max:1000',
        ]);

        $validation = $this->quranApi->validateMultiSurahRange(
            $quranHomework->surah_from,
            $validated['surah_to'],
            $quranHomework->verse_from,
            $validated['verse_to']
        );

        if (! $validation['valid']) {
            return back()->withErrors(['verse_range' => $validation['error']])->withInput();
        }

        $quranHomework->update($validated);

        return redirect()->route('quran-homework.show', $quranHomework)
            ->with('success', 'Homework updated successfully!');
    }

    public function destroy(QuranHomework $quranHomework)
    {
        $this->authorize('delete', $quranHomework);

        $quranHomework->delete();

        return redirect()->route('quran-homework.index')
            ->with('success', 'Homework deleted successfully.');
    }

    /**
     * Grading — the redesigned "Tracking" step. Records an assessment
     * directly against the Homework entry that already exists; no new
     * record is created. Only reachable when work was actually done —
     * absent/not-prepared go through markUngraded() instead.
     */
    public function grade(Request $request, QuranHomework $quranHomework)
    {
        $this->authorize('update', $quranHomework);

        $validated = $request->validate([
            'quality_rating' => 'required|in:excellent,very_good,moderate,poor',
            'subac_participation' => 'nullable|boolean',
            'fluency_rating' => 'nullable|integer|min:1|max:5',
            'tajweed_rating' => 'nullable|integer|min:1|max:5',
            'mistakes_count' => 'nullable|integer|min:0',
            'assessment_notes' => 'nullable|string|max:1000',
        ]);

        $quranHomework->update([
            'status' => 'graded',
            'quality_rating' => $validated['quality_rating'],
            'subac_participation' => $validated['subac_participation'] ?? false,
        ]);

        if (($validated['fluency_rating'] ?? null) !== null || ($validated['tajweed_rating'] ?? null) !== null) {
            $quranHomework->assessment()->updateOrCreate([], [
                'fluency_rating' => $validated['fluency_rating'] ?? null,
                'tajweed_rating' => $validated['tajweed_rating'] ?? null,
                'mistakes_count' => $validated['mistakes_count'] ?? 0,
                'assessment_notes' => $validated['assessment_notes'] ?? null,
            ]);
        }

        return back()->with('success', 'Homework graded successfully!');
    }

    /**
     * Records a non-graded outcome — Absent (didn't attend, nothing to
     * assess) or Not Prepared (attended, but didn't do the work) — as a
     * first-class result, not a gap in the record. Either one still counts
     * against Schedule progress (as "not graded"), same as a missing entry
     * would, but is now an explicit, visible fact rather than silence.
     */
    public function markUngraded(Request $request, QuranHomework $quranHomework)
    {
        $this->authorize('update', $quranHomework);

        $validated = $request->validate([
            'status' => 'required|in:absent,not_prepared',
            'notes' => 'nullable|string|max:1000',
        ]);

        $quranHomework->assessment()->delete();

        $quranHomework->update([
            'status' => $validated['status'],
            'quality_rating' => null,
            'notes' => $validated['notes'] ?? $quranHomework->notes,
        ]);

        return back()->with('success', 'Homework marked '.($validated['status'] === 'absent' ? 'Absent' : 'Not Prepared').'.');
    }

    public function studentReport(Request $request, Student $student)
    {
        $user = $request->user();
        if ($user->isGuardian()) {
            $guardian = $user->guardian;
            if (! $guardian || ! $guardian->students()->where('students.id', $student->id)->exists()) {
                abort(403, "You can only view your own children's Quran reports.");
            }
        }

        $sessions = QuranHomework::where('student_id', $student->id)
            ->with(['teacher', 'assessment'])
            ->orderBy('assigned_date', 'desc')
            ->get();

        $surahs = $this->quranApi->getSurahs();
        $surahsMap = collect($surahs)->keyBy('id')->toArray();

        $sessions->transform(function ($record) use ($surahsMap) {
            if ($record->surah_from == $record->surah_to) {
                $record->surah_name = $surahsMap[$record->surah_from]['name_simple'] ?? "Surah {$record->surah_from}";
                $record->surah_name_arabic = $surahsMap[$record->surah_from]['name_arabic'] ?? '';
            } else {
                $fromName = $surahsMap[$record->surah_from]['name_simple'] ?? "Surah {$record->surah_from}";
                $toName = $surahsMap[$record->surah_to]['name_simple'] ?? "Surah {$record->surah_to}";
                $record->surah_name = "{$fromName} - {$toName}";
                $record->surah_name_arabic = '';
            }

            $record->calculated_total_verses = $this->quranApi->calculateTotalVerses(
                $record->surah_from, $record->surah_to, $record->verse_from, $record->verse_to
            );

            return $record;
        });

        $graded = $sessions->where('status', 'graded');
        $newLearningGraded = $graded->where('reading_type', 'new_learning');

        $analytics = [
            'total_sessions' => $sessions->count(),
            'graded_count' => $graded->count(),
            'absent_count' => $sessions->where('status', 'absent')->count(),
            'not_prepared_count' => $sessions->where('status', 'not_prepared')->count(),
            'pending_count' => $sessions->where('status', 'pending')->count(),
            'total_verses' => $graded->sum('calculated_total_verses'),
            'pages_memorized' => $newLearningGraded->sum('pages_memorized'),
            'surahs_memorized' => $newLearningGraded->sum('surahs_memorized'),
            'juz_memorized' => $newLearningGraded->sum('juz_memorized'),
        ];

        return Inertia::render('Quran/Homework/StudentReport', [
            'student' => $student->load('grade'),
            'sessions' => $sessions,
            'analytics' => $analytics,
        ]);
    }

    public function studentHomework(Request $request, Student $student)
    {
        $user = $request->user();
        if ($user->isGuardian()) {
            $guardian = $user->guardian;
            if (! $guardian || ! $guardian->students()->where('students.id', $student->id)->exists()) {
                abort(403, "You can only view your own children's homework.");
            }
        }

        $homework = QuranHomework::where('student_id', $student->id)
            ->with('teacher')
            ->orderBy('assigned_date', 'desc')
            ->get();

        return Inertia::render('Quran/Homework/StudentView', [
            'student' => $student->load('grade'),
            'homework' => $homework,
        ]);
    }

    public function getSurahDetails(int $surahNumber)
    {
        $surah = $this->quranApi->getSurah($surahNumber);

        return $surah ? response()->json($surah) : response()->json(['error' => 'Surah not found'], 404);
    }

    public function getPageImage(int $pageNumber, Request $request)
    {
        try {
            $quality = $request->query('quality', 'medium');
            $imageUrl = $this->quranApi->getPageImageUrl($pageNumber, $quality);

            return response()->json(['page_number' => $pageNumber, 'image_url' => $imageUrl, 'quality' => $quality]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function getPageDetails(int $pageNumber)
    {
        return response()->json($this->quranApi->getPageDetails($pageNumber));
    }

    public function getPageVerses(int $pageNumber)
    {
        return response()->json($this->quranApi->getPageVerses($pageNumber));
    }

    public function getPageRange(Request $request)
    {
        $validated = $request->validate([
            'surah_from' => 'required|integer|min:1|max:114',
            'surah_to' => 'required|integer|min:1|max:114',
            'verse_from' => 'required|integer|min:1',
            'verse_to' => 'required|integer|min:1',
        ]);

        return response()->json($this->quranApi->calculatePageRange(
            $validated['surah_from'], $validated['surah_to'], $validated['verse_from'], $validated['verse_to']
        ));
    }

    public function getAllJuz()
    {
        return response()->json($this->quranApi->getAllJuz());
    }

    public function getVerseText(int $surahNumber, int $verseNumber)
    {
        $text = $this->quranApi->getVerseText($surahNumber, $verseNumber);

        if (! $text) {
            return response()->json(['error' => 'Verse not found'], 404);
        }

        return response()->json(['surah_number' => $surahNumber, 'verse_number' => $verseNumber, 'text' => $text]);
    }

    protected function studentsForUser($user)
    {
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            $query = Student::whereIn('grade_id', $teacherGradeIds);
        } else {
            $query = Student::query();
        }

        return $query->where('status', 'active')
            ->with(['grade', 'activeQuranSchedule'])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }
}
```

- [ ] **Step 6: Update `routes/web.php`**

Delete the entire `quran-tracking.*` route block (lines currently registering `QuranTrackingController` routes and the `api.quran.*` group under it). Replace the `Quran Homework Routes` sections with:

```php
// Admin and Teacher only routes (must come BEFORE wildcard routes)
Route::middleware(['role:admin,teacher'])->group(function () {
    Route::get('/quran-homework', [QuranHomeworkController::class, 'index'])->name('quran-homework.index');
    Route::get('/quran-homework/create', [QuranHomeworkController::class, 'create'])->name('quran-homework.create');
    Route::post('/quran-homework', [QuranHomeworkController::class, 'store'])->name('quran-homework.store');
    Route::get('/quran-homework/{quranHomework}/edit', [QuranHomeworkController::class, 'edit'])->name('quran-homework.edit');
    Route::put('/quran-homework/{quranHomework}', [QuranHomeworkController::class, 'update'])->name('quran-homework.update');
    Route::delete('/quran-homework/{quranHomework}', [QuranHomeworkController::class, 'destroy'])->name('quran-homework.destroy');
    Route::post('/quran-homework/{quranHomework}/grade', [QuranHomeworkController::class, 'grade'])->name('quran-homework.grade');
    Route::post('/quran-homework/{quranHomework}/mark-ungraded', [QuranHomeworkController::class, 'markUngraded'])->name('quran-homework.mark-ungraded');

    Route::get('/api/quran/surah/{surahNumber}', [QuranHomeworkController::class, 'getSurahDetails'])->name('api.quran.surah');
    Route::get('/api/quran/page/{pageNumber}/image', [QuranHomeworkController::class, 'getPageImage'])->name('api.quran.page-image');
    Route::get('/api/quran/page/{pageNumber}/details', [QuranHomeworkController::class, 'getPageDetails'])->name('api.quran.page-details');
    Route::get('/api/quran/page/{pageNumber}/verses', [QuranHomeworkController::class, 'getPageVerses'])->name('api.quran.page-verses');
    Route::get('/api/quran/page-range', [QuranHomeworkController::class, 'getPageRange'])->name('api.quran.page-range');
    Route::get('/api/quran/juz', [QuranHomeworkController::class, 'getAllJuz'])->name('api.quran.juz');
    Route::get('/api/quran/verse/{surahNumber}/{verseNumber}', [QuranHomeworkController::class, 'getVerseText'])->name('api.quran.verse');
    Route::get('/api/quran/homework/next-from/{student}', [QuranHomeworkController::class, 'nextFrom'])->name('api.quran.homework.next-from');
});

// Read-only routes (admin, teacher, guardian) - wildcard routes come AFTER specific routes
Route::middleware(['role:admin,teacher,guardian'])->group(function () {
    Route::get('/quran-homework/student/{student}/report', [QuranHomeworkController::class, 'studentReport'])->name('quran-homework.student-report');
    Route::get('/quran-homework/student/{student}', [QuranHomeworkController::class, 'studentHomework'])->name('quran-homework.student');
    Route::get('/quran-homework/{quranHomework}', [QuranHomeworkController::class, 'show'])->name('quran-homework.show');
});
```

Leave the `Quran Dashboard`, `Home Practice`, and `Quran Schedule` route groups exactly as they are.

- [ ] **Step 7: Fix `tests/Feature/QuranHomeworkShowVerseTextTest.php` and delete the duplicate**

Read `tests/Feature/QuranTrackingShowVerseTextTest.php` — it already covers exactly the same "page verses present when range is set / absent when it isn't" behavior that `QuranHomeworkShowVerseTextTest.php` (from the earlier Option B work) also covers, just against the old model. Rewrite `QuranHomeworkShowVerseTextTest.php` in place: swap any leftover `homework_type`/optional-page-range assumptions for the merged shape (`reading_type`, `status`), keep asserting `homework.starting_verse_reference` and `homework.page_from_verses`. Then:

```bash
rm tests/Feature/QuranTrackingShowVerseTextTest.php
```

- [ ] **Step 8: Fix `tests/Feature/QuranHomeworkTenantIsolationTest.php`**

The factory already produces valid data for the new shape — this test likely needs no changes beyond what Task 3's factory rewrite already handles. Read it and confirm; edit only if it references a removed field.

- [ ] **Step 9: Rename and fix the calculated-verses bug test**

```bash
git mv tests/Feature/QuranTrackingCalculatedVersesBugTest.php tests/Feature/QuranHomeworkCalculatedVersesBugTest.php
```

Update model references (`QuranTracking` → `QuranHomework`) and route names (`quran-tracking.*` → `quran-homework.*`) inside it.

- [ ] **Step 10: Check the two generic page-range/page-verses API tests**

Read `tests/Feature/QuranTrackingPageRangeApiTest.php` and `tests/Feature/QuranTrackingPageVersesApiTest.php`. These hit the `api.quran.*` route names, which are **unchanged** by this task (only the controller class backing them changed). If they reference `QuranTrackingController` or `QuranTracking` directly in setup, update those references and rename the files to `QuranHomeworkPageRangeApiTest.php`/`QuranHomeworkPageVersesApiTest.php`; if they only call `route('api.quran.page-range')`-style helpers, leave them as-is.

- [ ] **Step 11: Run everything from this task**

Run: `php8.4 artisan test --filter=QuranHomeworkChainingTest`
Run: `php8.4 artisan test --filter=QuranHomeworkGradingTest`
Expected: both PASS.

Run: `php8.4 artisan test --filter=Quran`
Expected: PASS across the board except Task 6/7's still-pending Schedule-progress and Dashboard work (if those tests already exist) — no unexplained failures from this task's own changes.

- [ ] **Step 12: Commit**

```bash
git add app/Http/Controllers/QuranHomeworkController.php routes/web.php tests/Feature/QuranHomeworkChainingTest.php tests/Feature/QuranHomeworkGradingTest.php tests/Feature/QuranHomeworkShowVerseTextTest.php tests/Feature/QuranHomeworkTenantIsolationTest.php tests/Feature/QuranHomeworkCalculatedVersesBugTest.php
git rm app/Http/Controllers/QuranTrackingController.php tests/Feature/QuranTrackingShowVerseTextTest.php tests/Feature/QuranTrackingCalculatedVersesBugTest.php
git commit -m "feat(quran): rebuild QuranHomeworkController with schedule-chained creation and grading actions"
```

---

### Task 6: Wire `QuranSchedule`'s progress rollup and `show()` to the new Homework chain

**Files:**
- Modify: `app/Http/Controllers/QuranScheduleController.php` (`show()` only)
- Test: `tests/Feature/QuranScheduleProgressTest.php` (new)

**Interfaces:**
- Consumes: `QuranSchedule::homework()` (Task 1), `QuranHomework::status` (Task 3).

- [ ] **Step 1: Write the failing test**

```php
<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuranScheduleProgressTest extends TestCase
{
    use RefreshDatabase;

    public function test_progress_only_counts_graded_homework_for_this_schedule(): void
    {
        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'surah_from' => 1, 'verse_from' => 1, 'surah_to' => 1, 'verse_to' => 7,
        ]);

        QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'quran_schedule_id' => $schedule->id,
            'status' => 'graded',
            'pages_memorized' => 3,
        ]);

        // Pending — must not count.
        QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'quran_schedule_id' => $schedule->id,
            'status' => 'pending',
            'pages_memorized' => 5,
        ]);

        $this->assertSame(3, $schedule->fresh()->current_progress);
    }

    public function test_show_page_lists_this_schedules_homework_not_all_tracking(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
        ]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'quran_schedule_id' => $schedule->id,
        ]);

        $response = $this->actingAs($teacherUser)->get(route('quran-schedule.show', $schedule->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('homeworkRecords', 1)
            ->where('homeworkRecords.0.id', $homework->id)
        );
    }
}
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `php8.4 artisan test --filter=QuranScheduleProgressTest`
Expected: FAIL — `show()` still queries `$quranSchedule->student->quranTracking()`, which no longer exists.

- [ ] **Step 3: Update `QuranScheduleController::show()`**

Replace:

```php
public function show(QuranSchedule $quranSchedule)
{
    $this->authorize('view', $quranSchedule);

    $quranSchedule->load(['student.grade', 'teacher']);

    // Get student's tracking records since schedule start
    $trackingRecords = $quranSchedule->student->quranTracking()
        ->where('date', '>=', $quranSchedule->start_date)
        ->orderBy('date', 'desc')
        ->get();

    return Inertia::render('Quran/Schedule/Show', [
        'schedule' => $quranSchedule,
        'trackingRecords' => $trackingRecords,
    ]);
}
```

with:

```php
public function show(QuranSchedule $quranSchedule)
{
    $this->authorize('view', $quranSchedule);

    $quranSchedule->load(['student.grade', 'teacher']);

    $homeworkRecords = $quranSchedule->homework()
        ->orderBy('assigned_date', 'desc')
        ->get();

    return Inertia::render('Quran/Schedule/Show', [
        'schedule' => $quranSchedule,
        'homeworkRecords' => $homeworkRecords,
    ]);
}
```

(No changes needed to `getProgressPercentageAttribute()`/`getCurrentProgressAttribute()` here — those already live on the model and were rewritten in Task 1 to read `$this->homework()->where('status', 'graded')`.)

- [ ] **Step 4: Run the test, confirm it passes**

Run: `php8.4 artisan test --filter=QuranScheduleProgressTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/QuranScheduleController.php tests/Feature/QuranScheduleProgressTest.php
git commit -m "fix(quran): Schedule progress and Show page read from the Homework chain"
```

---

### Task 7: `DashboardController` widgets and the guardian-facing Homework controller

**Files:**
- Modify: `app/Http/Controllers/DashboardController.php`
- Rename + modify: `app/Http/Controllers/GuardianQuranTrackingController.php` → `app/Http/Controllers/GuardianQuranHomeworkController.php`
- Modify: `routes/web.php` (the one `guardian.quran-tracking` route, outside the `madrasah.only` Quran block)
- Test: `tests/Feature/DashboardQuranWidgetTest.php` (new)

**Interfaces:**
- Consumes: `QuranHomework` (Task 3).

- [ ] **Step 1: Write the failing test**

```php
<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardQuranWidgetTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_loads_with_quran_widget_for_madrasah_school(): void
    {
        $this->withoutVite();

        $school = School::factory()->create(['school_type' => 'madrasah']);
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'graded',
            'reading_type' => 'new_learning',
            'pages_memorized' => 2,
        ]);

        $response = $this->actingAs($adminUser)->get(route('dashboard'));

        $response->assertOk();
    }
}
```

(This is intentionally a smoke test — the goal is proving the widget query doesn't reference a dropped model/column and the page still renders; the exact dashboard route name may need checking against `routes/web.php` before finalizing this test.)

- [ ] **Step 2: Run it, confirm it fails**

Run: `php8.4 artisan test --filter=DashboardQuranWidgetTest`
Expected: FAIL — `DashboardController` still references `App\Models\QuranTracking`, which no longer exists (class-not-found or column-not-found error).

- [ ] **Step 3: Update `DashboardController`**

Replace the `use App\Models\QuranTracking;` import with `use App\Models\QuranHomework;`.

Replace the admin quick-stats block:

```php
$quranStats = null;
if (auth()->user()->school && auth()->user()->school->school_type === 'madrasah') {
    $quranStats = [
        'total_sessions' => QuranHomework::where('status', 'graded')->count(),
        'total_pages_memorized' => QuranHomework::where('reading_type', 'new_learning')->where('status', 'graded')->sum('pages_memorized'),
        'total_surahs_memorized' => QuranHomework::where('reading_type', 'new_learning')->where('status', 'graded')->sum('surahs_memorized'),
        'total_juz_memorized' => QuranHomework::where('reading_type', 'new_learning')->where('status', 'graded')->sum('juz_memorized'),
        'sessions_this_month' => QuranHomework::whereMonth('assigned_date', now()->month)
            ->whereYear('assigned_date', now()->year)
            ->count(),
        'students_tracked' => QuranHomework::distinct('student_id')->count('student_id'),
    ];
}
```

Replace the guardian multi-child block:

```php
$quranHomeworkData = null;
if ($user->school && $user->school->school_type === 'madrasah' && $studentIds->isNotEmpty()) {
    $quranHomeworkData = QuranHomework::whereIn('student_id', $studentIds)
        ->with(['student', 'teacher'])
        ->orderBy('assigned_date', 'desc')
        ->take(20)
        ->get()
        ->map(function ($homework) {
            return [
                'id' => $homework->id,
                'student_name' => $homework->student
                    ? trim($homework->student->first_name.' '.$homework->student->last_name)
                    : 'Unknown',
                'student_id' => $homework->student_id,
                'teacher_name' => $homework->teacher?->name ?? 'N/A',
                'date' => $homework->assigned_date->format('M d, Y'),
                'reading_type' => $homework->reading_type_label,
                'surah_range' => $homework->surah_range,
                'pages_memorized' => $homework->pages_memorized,
                'surahs_memorized' => $homework->surahs_memorized,
                'juz_memorized' => $homework->juz_memorized,
                'quality_rating' => $homework->quality_rating_label,
                'notes' => $homework->notes,
            ];
        });

    $quranStats = [
        'total_sessions' => QuranHomework::whereIn('student_id', $studentIds)->where('status', 'graded')->count(),
        'total_pages' => QuranHomework::whereIn('student_id', $studentIds)
            ->where('reading_type', 'new_learning')->where('status', 'graded')
            ->sum('pages_memorized'),
        'total_surahs' => QuranHomework::whereIn('student_id', $studentIds)
            ->where('reading_type', 'new_learning')->where('status', 'graded')
            ->sum('surahs_memorized'),
        'total_juz' => QuranHomework::whereIn('student_id', $studentIds)
            ->where('reading_type', 'new_learning')->where('status', 'graded')
            ->sum('juz_memorized'),
        'this_month' => QuranHomework::whereIn('student_id', $studentIds)
            ->whereMonth('assigned_date', now()->month)
            ->whereYear('assigned_date', now()->year)
            ->count(),
    ];
} else {
    $quranStats = null;
}
```

Find every further use of the old `$quranTrackingData` variable name further down this method (`grep -n "quranTrackingData" app/Http/Controllers/DashboardController.php`) and rename it to `$quranHomeworkData` consistently, including the Inertia prop key it's passed under — then update the one frontend page that reads that prop (`grep -rn "quranTrackingData" resources/js/`) to match.

- [ ] **Step 4: Rename and update the guardian controller**

```bash
git mv app/Http/Controllers/GuardianQuranTrackingController.php app/Http/Controllers/GuardianQuranHomeworkController.php
```

Update its class name to `GuardianQuranHomeworkController`, its `use App\Models\QuranTracking;` import to `use App\Models\QuranHomework;`, every `QuranTracking::` reference to `QuranHomework::`, `$latestTracking->date` to `$latestTracking->assigned_date`, and the Inertia render target if it names the old model (check the render call's data — it currently returns a `latest_tracking` shaped array; keep the same JSON shape so the frontend page for it doesn't need edits, just rename the underlying query).

- [ ] **Step 5: Update the one guardian route**

In `routes/web.php`, find (outside the `madrasah.only` Quran block, near the other guardian routes):

```php
Route::get('/guardian/quran-tracking', [GuardianQuranTrackingController::class, 'index'])->name('guardian.quran-tracking');
```

Replace with:

```php
Route::get('/guardian/quran-homework', [GuardianQuranHomeworkController::class, 'index'])->name('guardian.quran-homework');
```

Update the `use App\Http\Controllers\GuardianQuranTrackingController;` import at the top of `routes/web.php` to `GuardianQuranHomeworkController`.

- [ ] **Step 6: Run the test, confirm it passes**

Run: `php8.4 artisan test --filter=DashboardQuranWidgetTest`
Expected: PASS

- [ ] **Step 7: Run the full suite**

Run: `php8.4 artisan test`
Expected: PASS across the whole application — this is the first point where a genuinely full run (not just `--filter=Quran`) matters, since `DashboardController` is shared, non-Quran-specific code.

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/DashboardController.php app/Http/Controllers/GuardianQuranHomeworkController.php routes/web.php tests/Feature/DashboardQuranWidgetTest.php
git rm app/Http/Controllers/GuardianQuranTrackingController.php
git commit -m "fix(quran): update DashboardController and guardian controller for the renamed Homework entity"
```

---

### Task 8: Frontend — Homework pages, Schedule pages, navigation

**Files:**
- Delete: `resources/js/Pages/Quran/Tracking/` (whole folder)
- Overwrite: `resources/js/Pages/Quran/Homework/Create.jsx`, `Edit.jsx`, `Index.jsx`, `Show.jsx`
- Create: `resources/js/Pages/Quran/Homework/StudentReport.jsx`, `StudentView.jsx`
- Modify: `resources/js/Pages/Quran/Schedule/Create.jsx`, `Edit.jsx`, `Index.jsx`, `Show.jsx`
- Modify: `resources/js/Config/navigation.js`

This task has no backend tests of its own — the backend contract is already covered by Tasks 5–7's feature tests. Correctness here is verified by manual `agent-browser` walkthroughs per this session's established convention (per `superpowers:verification-before-completion`, this is not optional — show the screenshots/output, don't just claim it works).

- [ ] **Step 1: Move the Tracking pages into Homework, deleting the old Option B Homework pages**

```bash
rm resources/js/Pages/Quran/Homework/Create.jsx resources/js/Pages/Quran/Homework/Show.jsx resources/js/Pages/Quran/Homework/Edit.jsx resources/js/Pages/Quran/Homework/Index.jsx
git mv resources/js/Pages/Quran/Tracking/Create.jsx resources/js/Pages/Quran/Homework/Create.jsx
git mv resources/js/Pages/Quran/Tracking/Show.jsx resources/js/Pages/Quran/Homework/Show.jsx
git mv resources/js/Pages/Quran/Tracking/Edit.jsx resources/js/Pages/Quran/Homework/Edit.jsx
git mv resources/js/Pages/Quran/Tracking/StudentReport.jsx resources/js/Pages/Quran/Homework/StudentReport.jsx
```

(`Tracking/Index.jsx` doesn't move — the per-student "latest session" index it implements doesn't match the new assignment-list index; the pre-existing `Homework/Index.jsx` table-of-assignments pattern is closer to right and gets edited in place per Step 4 below, so delete `Tracking/Index.jsx` without a replacement transplant.)

```bash
rm resources/js/Pages/Quran/Tracking/Index.jsx
rmdir resources/js/Pages/Quran/Tracking
```

- [ ] **Step 2: Edit the moved `Create.jsx`**

Open it and:
- Remove the `surah_from`/`verse_from` input fields entirely. Replace with a read-only "Starting from" display block, populated by calling `GET /api/quran/homework/next-from/{student_id}` (via axios, same debounce pattern already used for the page-range auto-derivation) whenever `data.student_id` changes. Show a loading state and an error state (no active schedule) exactly like the existing page-range auto-derive block does.
- Remove the `difficulty`/quality-rating select and the whole "Assessment (optional)" fields block (fluency/tajweed/mistakes/assessment_notes) — grading happens later, on the Show page, not here.
- Keep the `surah_to`/`verse_to` inputs, the auto-derived page range + `QuranPageText` preview block, the verse-count summary, and `reading_type` select, unchanged in behavior.
- The student dropdown only lists students the `create()` controller action already filtered to those with an active schedule (`students` prop) — no client-side filtering needed, but do surface a clear empty-state message ("No students have an active Quran schedule yet — create one first") if that list is empty.

- [ ] **Step 3: Edit the moved `Show.jsx`**

Open it and:
- Keep the existing "Quran Pages" Arabic-text preview section, the fullscreen viewer, and the verse-count summary as-is (unchanged from the Tracking page's already-polished version).
- Add a status badge (`Pending` / `Graded` / `Absent` / `Not Prepared`) near the top, styled consistently with existing badge patterns elsewhere in this page — give `Absent` and `Not Prepared` visually distinct treatment (e.g. different badge colors) since they're different outcomes, not two labels for the same thing.
- Add a Schedule summary block (link to `quran-schedule.show`, showing the surah/verse range and dates) sourced from the `homework.schedule` prop.
- Add a **Grade panel**, visible only when `homework.status === 'pending'`: a form posting to `route('quran-homework.grade', homework.id)` with fields `quality_rating` (select — Excellent / Very Good / Moderate / Poor, required), `subac_participation` (checkbox), `fluency_rating`/`tajweed_rating` (1-5 star inputs, reuse whatever star-input pattern already exists in this codebase for ratings), `mistakes_count` (number), `assessment_notes` (textarea). Alongside it, two secondary buttons — "Mark Absent" and "Mark Not Prepared" — each opening the existing `ConfirmationModal` component (already imported in this file) with copy specific to that outcome, and on confirm posting to `route('quran-homework.mark-ungraded', homework.id)` with `status: 'absent'` or `status: 'not_prepared'` respectively, plus an optional notes field.
- When `homework.status !== 'pending'`, replace the Grade panel with a read-only summary: the quality rating and any assessment detail when `graded`, or "Marked Absent" / "Marked Not Prepared" plus its notes for the other two statuses.

- [ ] **Step 4: Edit the moved `Edit.jsx`**

- Display `surah_from`/`verse_from` as read-only (chained, not editable).
- Keep `surah_to`/`verse_to`, page range, `reading_type`, `notes` editable.
- Remove any assessment-related fields, including `difficulty`/quality rating (same reasoning as Create — grading, including marking absent/not-prepared, only happens via Show).

- [ ] **Step 5: Edit the existing `Homework/Index.jsx`**

- Update the status filter options from `pending`/`completed`/`overdue` to `pending`/`graded`/`absent`/`not_prepared` (four options, labeled `Pending` / `Graded` / `Absent` / `Not Prepared`).
- Update the reading-type filter options from `memorize`/`revise`/`read` to `new_learning`/`revision`/`subac`.
- Update the table's status badge rendering to the four new values/labels, giving `Absent` and `Not Prepared` visually distinct badge colors from each other.

- [ ] **Step 6: Create `StudentReport.jsx`**

Base it on the moved-then-adjusted analytics page: use the `analytics` shape now returned by `studentReport()` (`total_sessions`, `graded_count`, `absent_count`, `not_prepared_count`, `pending_count`, `total_verses`, `pages_memorized`, `surahs_memorized`, `juz_memorized`) plus the `sessions` list. Keep chart/visualization patterns consistent with what the original `Tracking/StudentReport.jsx` already established, adjusting only the field/prop names that changed.

- [ ] **Step 7: Create `StudentView.jsx`** (net new — this route/page never existed before)

A simple guardian-facing read view: student header (name, grade), then a list of the student's Homework entries (`assigned_date`, surah/verse range, status badge, link to `quran-homework.show` for the ones the guardian is allowed to view). Keep it minimal — this is explicitly not the `QuranHomePractice` self-logging UI; it's a read-only history of what's been assigned/graded.

- [ ] **Step 8: Update Schedule pages**

In `Create.jsx` and `Edit.jsx`: replace the `schedule_type`/`target_pages_per_period`/`target_verses_per_period`/`target_total_pages` fields with `surah_from`/`verse_from`/`surah_to`/`verse_to` inputs (reuse the same verse-range picker UI already established on the Homework Create screen) plus `start_date`/`end_date` date pickers.

In `Show.jsx`: read `homeworkRecords` (not `trackingRecords`) from props; display the computed `target_total_pages` (now an accessor, arrives as a plain number on the `schedule` prop) instead of an editable field; remove the schedule-type badge display.

In `Index.jsx`: remove the schedule-type column/filter; add a surah/verse-range column.

- [ ] **Step 9: Update `resources/js/Config/navigation.js`**

Remove the standalone "Tracking" nav entry from the admin and teacher sidebar sections (lines currently at `{ name: "Tracking", href: "/quran-tracking", icon: Book }` — two occurrences). Rename the guardian sidebar's "Tracking" entry to "Homework" with `href: "/guardian/quran-homework"`.

- [ ] **Step 10: Build and manually verify**

Run: `pnpm run build`
Expected: succeeds with no errors. Revert the `public/sw.js` version bump afterward (`git checkout -- public/sw.js`), per this session's established practice.

Then, using `agent-browser` (per the established workflow this session): start the dev server, log in as a teacher, create a Schedule for a student, create a first Homework entry (confirm the From point matches the Schedule's start and is read-only), create a second Homework entry for the same student (confirm the From point matches the first entry's To), open the first entry and grade it with a quality rating (confirm status flips to Graded and the Schedule's progress reflects it), mark the second one Absent and a third one Not Prepared (confirm both statuses are visibly distinct and neither credits progress), and view the Schedule's Show page (confirm it lists all three Homework entries). Take screenshots at each step as evidence for the verification report — do not claim this works without them.

- [ ] **Step 11: Commit**

```bash
git add resources/js/Pages/Quran/Homework resources/js/Pages/Quran/Schedule resources/js/Config/navigation.js
git rm -r resources/js/Pages/Quran/Tracking
git commit -m "feat(quran): rebuild Homework and Schedule frontend for the connected workflow"
```

---

### Task 9: Full-suite verification and cleanup pass

**Files:** none new — this task is verification and fixing whatever it surfaces.

- [ ] **Step 1: Search for anything still referencing removed names**

```bash
grep -rln "QuranTracking\b" app/ resources/js/ database/ tests/ routes/
grep -rln "quran-tracking\.\|mark-missed\|markMissed" resources/js/ routes/ tests/ app/
grep -rn "quran_tracking_id\|schedule_type\|target_pages_per_period\|target_verses_per_period\|homework_type\b\|'difficulty'\|difficulty_label\|status.*'missed'\|'missed'" app/ resources/js/ tests/ database/
```

Fix every real hit (a leftover test, a stale comment referencing the old shape, a dangling import). A hit inside a migration's `down()` method rolling back to the *old* shape is expected and correct — don't "fix" those.

- [ ] **Step 2: Run the entire backend suite**

Run: `composer test`
Expected: 100% pass, pristine output (no warnings/errors), full test count roughly matching the pre-migration count minus the deleted backfill-command test plus the new tests added across Tasks 1–7.

- [ ] **Step 3: Run Pint**

Run: `./vendor/bin/pint`
Expected: no diffs, or only whitespace-level fixes on the new/rewritten files — apply and re-run the test suite if it touches anything.

- [ ] **Step 4: Re-run the manual `agent-browser` walkthrough from Task 8, Step 10, end-to-end, one more time** after all backend changes have landed, to catch any drift between the two.

- [ ] **Step 5: Final `git status` review**

Run: `git status`
Confirm the diff is exactly the intended set of changes across all 9 tasks — no stray files, nothing committed beyond what was explicitly asked for, `public/sw.js` reverted.

- [ ] **Step 6: Report to the user**

Summarize what changed, show the full test-suite pass output, list every file touched, and explicitly restate: no commits pushed, `QuranHomePractice` untouched pending the separate brainstorming session on §2.3.
