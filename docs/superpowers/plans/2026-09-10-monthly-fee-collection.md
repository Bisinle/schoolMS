# Monthly Fee Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual monthly fee-collection ledger alongside the existing termly invoicing system — one row per guardian per month, an admin-editable "expected fee" per guardian, and one-click Mark Paid / Undo / edit-amount actions, with a matching read-only "amount due" view for guardians.

**Architecture:** Two new tables (a per-guardian standing rate, and a per-guardian-per-month history row), a small service that idempotently syncs the currently-open month (so a new guardian is picked up automatically the next time the page loads), a single controller reused for both the admin ledger and the guardian's own view (mirroring how `InvoiceController` already serves both audiences), and two Inertia/React pages.

**Tech Stack:** Laravel 12 (PHP 8.4 — this machine's default `php` is 8.5 and is missing `pdo_sqlite`; use `php8.4` for every artisan/composer command below), Pest (PHPUnit-style test classes, the house convention — see `tests/Feature/GuardianInvoiceOwnershipTest.php`), Inertia.js + React 18, Tailwind CSS, lucide-react icons.

**Spec:** No separate spec file — the design was confirmed interactively in conversation via an iterated, user-approved clickable HTML prototype (not committed to the repo). This plan is the durable, complete record of that confirmed design; read it standalone.

**Reference reports (context, not requirements to re-derive):** `reports/fee-management-current-structure-audit.md`, `reports/monthly-fee-module-feasibility.md`.

## Global Constraints

- Every new table and model MUST use the `App\Models\Traits\BelongsToSchool` trait — this is the project's non-negotiable tenant-isolation mechanism (see root `CLAUDE.md`). Do not hand-roll `school_id` filtering.
- Reuse the existing Spatie permissions `fees.manage` (admin/staff) and `fees.view-own-invoices` (guardian) — do not create new permissions or touch `database/seeders/RolePermissionSeeder.php`.
- Use `Guardian::allStudentIds()` / `Guardian::allStudents()` (in `app/Models/Guardian.php`) for "this guardian's children" everywhere in this feature — never the legacy `Guardian::students()` relation, which misses students linked only via the `guardian_student` pivot (a documented gap in the existing termly system that this feature must not repeat).
- `guardian_number` already exists and is already formatted `PAR-YY-XXX` by `UniqueIdentifierService::generateGuardianNumber()` — display it, never regenerate or reformat it.
- Status (`needs_fee` / `unpaid` / `partial` / `paid`) is always computed from `expected_amount`/`amount_collected` on read — never stored as a column.
- No payment integration of any kind (M-Pesa, Paystack, or otherwise) in this plan — the guardian "Pay Here" button is a visual no-op. Tracked separately in `reports/automatic-fee-payment-mpesa-integration.md`.
- No Super Admin `billing_mode` toggle in this plan — tracked separately in `reports/super-admin-billing-mode-toggle.md`. This feature ships as a standalone, always-visible nav item under the existing "Fees" section.
- No per-child fee breakdown and no multi-entry payment history — one `amount_collected` figure per guardian per month, full stop.
- All commands below assume the working directory is this worktree (`.claude/worktrees/feature+monthly-fee-collection`) on branch `worktree-feature+monthly-fee-collection`.

---

### Task 1: `monthly_fee_settings` and `monthly_fee_entries` migrations + models

**Files:**
- Create: `database/migrations/2026_09_10_000001_create_monthly_fee_settings_table.php`
- Create: `database/migrations/2026_09_10_000002_create_monthly_fee_entries_table.php`
- Create: `app/Models/MonthlyFeeSetting.php`
- Create: `app/Models/MonthlyFeeEntry.php`
- Modify: `app/Models/Guardian.php` (add two relationships)
- Test: `tests/Feature/MonthlyFeeEntryStatusTest.php`

**Interfaces:**
- Produces: `MonthlyFeeSetting` (fillable: `school_id`, `guardian_id`, `expected_fee`, `updated_by`, `notes`), `MonthlyFeeEntry` (fillable: `school_id`, `guardian_id`, `year`, `month`, `expected_amount`, `amount_collected`, `paid_date`, `recorded_by`, `notes`; computed `status` attribute — string, one of `needs_fee`/`unpaid`/`partial`/`paid`), `Guardian::monthlyFeeSetting()` (hasOne), `Guardian::monthlyFeeEntries()` (hasMany).

- [ ] **Step 1: Write the migrations**

`database/migrations/2026_09_10_000001_create_monthly_fee_settings_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_fee_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('guardian_id')->constrained('guardians')->cascadeOnDelete();
            $table->decimal('expected_fee', 10, 2)->default(0);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique('guardian_id');
            $table->index(['school_id', 'guardian_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_fee_settings');
    }
};
```

`database/migrations/2026_09_10_000002_create_monthly_fee_entries_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_fee_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('guardian_id')->constrained('guardians')->cascadeOnDelete();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->decimal('expected_amount', 10, 2)->default(0);
            $table->decimal('amount_collected', 10, 2)->nullable();
            $table->date('paid_date')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['guardian_id', 'year', 'month']);
            $table->index(['school_id', 'year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_fee_entries');
    }
};
```

- [ ] **Step 2: Run the migrations against the local dev DB**

Run: `php8.4 artisan migrate`
Expected: both tables created, no errors.

- [ ] **Step 3: Write the models**

`app/Models/MonthlyFeeSetting.php`:

```php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyFeeSetting extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'guardian_id',
        'expected_fee',
        'updated_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'expected_fee' => 'decimal:2',
        ];
    }

    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
```

`app/Models/MonthlyFeeEntry.php`:

```php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyFeeEntry extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'guardian_id',
        'year',
        'month',
        'expected_amount',
        'amount_collected',
        'paid_date',
        'recorded_by',
        'notes',
    ];

    protected $appends = ['status'];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'expected_amount' => 'decimal:2',
            'amount_collected' => 'decimal:2',
            'paid_date' => 'date',
        ];
    }

    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * Computed, never stored — recomputed from expected_amount/amount_collected
     * on every read so it can never drift out of sync with the two source
     * columns. needs_fee takes priority: an unset expected amount is a data
     * gap to fix, not "unpaid".
     */
    public function getStatusAttribute(): string
    {
        if ((float) $this->expected_amount <= 0) {
            return 'needs_fee';
        }

        if ($this->amount_collected === null || (float) $this->amount_collected <= 0) {
            return 'unpaid';
        }

        if ((float) $this->amount_collected < (float) $this->expected_amount) {
            return 'partial';
        }

        return 'paid';
    }
}
```

- [ ] **Step 4: Add the two relationships to `Guardian`**

In `app/Models/Guardian.php`, add next to the existing `feePreferences()`/`feeAdjustments()` methods (around line 128-177):

```php
    public function monthlyFeeSetting()
    {
        return $this->hasOne(MonthlyFeeSetting::class);
    }

    public function monthlyFeeEntries()
    {
        return $this->hasMany(MonthlyFeeEntry::class);
    }
```

- [ ] **Step 5: Write the failing test for the status accessor**

`tests/Feature/MonthlyFeeEntryStatusTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\School;
use App\Models\User;
use Tests\TestCase;

class MonthlyFeeEntryStatusTest extends TestCase
{
    private function makeGuardian(School $school): Guardian
    {
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);

        return Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $user->id]);
    }

    public function test_status_is_needs_fee_when_expected_amount_is_zero(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardian($school);

        $entry = MonthlyFeeEntry::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'year' => 2026,
            'month' => 9,
            'expected_amount' => 0,
        ]);

        $this->assertSame('needs_fee', $entry->status);
    }

    public function test_status_is_unpaid_when_nothing_collected(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardian($school);

        $entry = MonthlyFeeEntry::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'year' => 2026,
            'month' => 9,
            'expected_amount' => 32000,
        ]);

        $this->assertSame('unpaid', $entry->status);
    }

    public function test_status_is_partial_when_collected_is_less_than_expected(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardian($school);

        $entry = MonthlyFeeEntry::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'year' => 2026,
            'month' => 9,
            'expected_amount' => 32000,
            'amount_collected' => 10000,
        ]);

        $this->assertSame('partial', $entry->status);
    }

    public function test_status_is_paid_when_collected_meets_or_exceeds_expected(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardian($school);

        $entry = MonthlyFeeEntry::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'year' => 2026,
            'month' => 9,
            'expected_amount' => 32000,
            'amount_collected' => 32000,
        ]);

        $this->assertSame('paid', $entry->status);
    }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeEntryStatusTest.php`
Expected: PASS, 4 tests, 4 assertions.

- [ ] **Step 7: Commit**

```bash
git add database/migrations/2026_09_10_000001_create_monthly_fee_settings_table.php \
        database/migrations/2026_09_10_000002_create_monthly_fee_entries_table.php \
        app/Models/MonthlyFeeSetting.php app/Models/MonthlyFeeEntry.php app/Models/Guardian.php \
        tests/Feature/MonthlyFeeEntryStatusTest.php
git commit -m "feat: add monthly fee settings/entries tables and models"
```

---

### Task 2: `MonthlyFeeLedgerService` — sync, latest month, open next month

**Files:**
- Create: `app/Services/MonthlyFeeLedgerService.php`
- Test: `tests/Feature/MonthlyFeeLedgerServiceTest.php`

**Interfaces:**
- Consumes: `Guardian` (`school_id`, `status`, `allStudents()`), `MonthlyFeeEntry`, `MonthlyFeeSetting` (all from Task 1).
- Produces: `MonthlyFeeLedgerService::latestMonth(int $schoolId): array{year:int, month:int}`, `MonthlyFeeLedgerService::syncMonth(int $schoolId, int $year, int $month): void`, `MonthlyFeeLedgerService::openNextMonth(int $schoolId): array{year:int, month:int}`. Task 3's controller depends on exactly these three method names and signatures.

- [ ] **Step 1: Write the failing tests**

`tests/Feature/MonthlyFeeLedgerServiceTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\MonthlyFeeSetting;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Services\MonthlyFeeLedgerService;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class MonthlyFeeLedgerServiceTest extends TestCase
{
    private function makeGuardianWithActiveChild(School $school, float $expectedFee = 0): Guardian
    {
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create([
            'school_id' => $school->id,
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        Student::factory()->create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'status' => 'active',
        ]);

        if ($expectedFee > 0) {
            MonthlyFeeSetting::create([
                'school_id' => $school->id,
                'guardian_id' => $guardian->id,
                'expected_fee' => $expectedFee,
            ]);
        }

        return $guardian;
    }

    public function test_sync_creates_one_entry_per_active_guardian_using_their_standing_rate(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 32000);

        (new MonthlyFeeLedgerService())->syncMonth($school->id, 2026, 9);

        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)
            ->where('year', 2026)->where('month', 9)->first();

        $this->assertNotNull($entry);
        $this->assertSame('32000.00', $entry->expected_amount);
        $this->assertNull($entry->amount_collected);
    }

    public function test_sync_is_idempotent_and_never_overwrites_a_collected_amount(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 32000);

        $service = new MonthlyFeeLedgerService();
        $service->syncMonth($school->id, 2026, 9);

        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $entry->update(['amount_collected' => 32000, 'paid_date' => now()]);

        // Re-run sync — a mistaken double-click of the same month must not
        // touch what's already been recorded as paid.
        $service->syncMonth($school->id, 2026, 9);

        $this->assertSame(1, MonthlyFeeEntry::where('guardian_id', $guardian->id)->count());
        $this->assertSame('32000.00', $entry->fresh()->amount_collected);
    }

    public function test_sync_picks_up_a_guardian_who_joins_after_the_month_was_first_generated(): void
    {
        $school = School::factory()->create();
        $existing = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);

        $service = new MonthlyFeeLedgerService();
        $service->syncMonth($school->id, 2026, 9);

        $this->assertSame(1, MonthlyFeeEntry::where('year', 2026)->where('month', 9)->count());

        // A new guardian joins mid-month.
        $newGuardian = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);

        // Re-opening the month (what the admin page does on every load) syncs again.
        $service->syncMonth($school->id, 2026, 9);

        $this->assertSame(2, MonthlyFeeEntry::where('year', 2026)->where('month', 9)->count());
        $this->assertNotNull(
            MonthlyFeeEntry::where('guardian_id', $newGuardian->id)->where('year', 2026)->where('month', 9)->first()
        );
    }

    public function test_sync_skips_a_guardian_with_no_active_students(): void
    {
        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $user->id, 'status' => 'active']);
        // No students attached at all.

        (new MonthlyFeeLedgerService())->syncMonth($school->id, 2026, 9);

        $this->assertSame(0, MonthlyFeeEntry::where('year', 2026)->where('month', 9)->count());
    }

    public function test_latest_month_defaults_to_current_calendar_month_when_ledger_never_opened(): void
    {
        $school = School::factory()->create();
        $now = Carbon::now();

        $latest = (new MonthlyFeeLedgerService())->latestMonth($school->id);

        $this->assertSame($now->year, $latest['year']);
        $this->assertSame($now->month, $latest['month']);
    }

    public function test_open_next_month_advances_and_syncs_the_new_month(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 32000);

        $service = new MonthlyFeeLedgerService();
        $service->syncMonth($school->id, 2026, 9);

        $next = $service->openNextMonth($school->id);

        $this->assertSame(2026, $next['year']);
        $this->assertSame(10, $next['month']);
        $this->assertNotNull(
            MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 10)->first()
        );
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: FAIL — `Class "App\Services\MonthlyFeeLedgerService" not found`.

- [ ] **Step 3: Write the service**

`app/Services/MonthlyFeeLedgerService.php`:

```php
<?php

namespace App\Services;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\MonthlyFeeSetting;
use Illuminate\Support\Carbon;

class MonthlyFeeLedgerService
{
    /**
     * The (year, month) currently "open" for a school — the latest month
     * that has any entries at all, or the current calendar month if the
     * ledger has never been opened before (the very first page load
     * bootstraps itself against this).
     *
     * @return array{year: int, month: int}
     */
    public function latestMonth(int $schoolId): array
    {
        $latest = MonthlyFeeEntry::where('school_id', $schoolId)
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->first(['year', 'month']);

        if (! $latest) {
            $now = Carbon::now();

            return ['year' => $now->year, 'month' => $now->month];
        }

        return ['year' => $latest->year, 'month' => $latest->month];
    }

    /**
     * Upsert a monthly_fee_entries row for every active guardian with at
     * least one active student, for the given (year, month). Never touches
     * a row that already exists — this is what makes it safe to call on
     * every page load of the open month (a guardian who joins mid-month is
     * picked up the next time anyone opens the ledger) and safe to call
     * twice in a row without clobbering anything already collected.
     */
    public function syncMonth(int $schoolId, int $year, int $month): void
    {
        $guardianIds = Guardian::where('school_id', $schoolId)
            ->where('status', 'active')
            ->get()
            ->filter(fn (Guardian $guardian) => $guardian->allStudents()->where('status', 'active')->exists())
            ->pluck('id');

        if ($guardianIds->isEmpty()) {
            return;
        }

        $existingGuardianIds = MonthlyFeeEntry::where('school_id', $schoolId)
            ->where('year', $year)
            ->where('month', $month)
            ->whereIn('guardian_id', $guardianIds)
            ->pluck('guardian_id');

        $missingGuardianIds = $guardianIds->diff($existingGuardianIds);

        if ($missingGuardianIds->isEmpty()) {
            return;
        }

        $settingsByGuardian = MonthlyFeeSetting::whereIn('guardian_id', $missingGuardianIds)
            ->get()
            ->keyBy('guardian_id');

        foreach ($missingGuardianIds as $guardianId) {
            MonthlyFeeEntry::create([
                'school_id' => $schoolId,
                'guardian_id' => $guardianId,
                'year' => $year,
                'month' => $month,
                'expected_amount' => $settingsByGuardian->get($guardianId)?->expected_fee ?? 0,
            ]);
        }
    }

    /**
     * Advance the ledger to the month after whatever is currently open, and
     * sync it the same way syncMonth does for the open month. Assumes the
     * open month has already been synced at least once (true in practice —
     * the admin ledger page always syncs the open month on every load
     * before this action is ever reachable in the UI).
     *
     * @return array{year: int, month: int}
     */
    public function openNextMonth(int $schoolId): array
    {
        $latest = $this->latestMonth($schoolId);
        $next = Carbon::create($latest['year'], $latest['month'], 1)->addMonthNoOverflow();

        $this->syncMonth($schoolId, $next->year, $next->month);

        return ['year' => $next->year, 'month' => $next->month];
    }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add app/Services/MonthlyFeeLedgerService.php tests/Feature/MonthlyFeeLedgerServiceTest.php
git commit -m "feat: add MonthlyFeeLedgerService for idempotent month sync"
```

---

### Task 3: `MonthlyFeeController`, routes, and nav — reachable in the browser

**Files:**
- Create: `app/Http/Controllers/MonthlyFeeController.php`
- Modify: `routes/web.php`
- Modify: `resources/js/Config/navigation.js`
- Test: `tests/Feature/MonthlyFeeControllerTest.php`

**Interfaces:**
- Consumes: `MonthlyFeeLedgerService` (Task 2), `MonthlyFeeEntry`/`MonthlyFeeSetting`/`Guardian` (Task 1).
- Produces: routes `monthly-fees.index` (GET `/monthly-fees`), `monthly-fees.open-next-month` (POST `/monthly-fees/open-next-month`), `monthly-fees.update-expected` (PUT `/monthly-fees/guardians/{guardian}/expected-fee`), `monthly-fees.mark-paid` (POST `/monthly-fees/entries/{entry}/mark-paid`), `monthly-fees.undo` (POST `/monthly-fees/entries/{entry}/undo`), `monthly-fees.update-collected` (PUT `/monthly-fees/entries/{entry}`), `guardian.monthly-fees` (GET `/guardian/monthly-fees`). `index` renders Inertia component `Fees/MonthlyFees/Index` with props `year, month, monthLabel, isOpenMonth, canBrowseNext, prev:{year,month}, next:{year,month}, rows:[{entry_id, guardian_id, guardian_name, guardian_number, phone, children:[{name,grade}], expected_amount, amount_collected, paid_date, status}], totalCollected`. `guardianShow` renders `Fees/MonthlyFees/GuardianShow` with props `monthLabel, guardianName, guardianNumber, phone, amountDue, expectedAmount, status`. Task 4 and Task 5 depend on exactly these prop shapes.

This task is prioritized early specifically so the nav link exists and the page is clickable in a browser while Tasks 4-5 fill in the real UI — right after this task, `/monthly-fees` will render (Inertia will show a "page component not found" style error until Task 4 creates the React file; that's expected and resolved by the very next task, not left dangling).

- [ ] **Step 1: Write the failing controller tests**

`tests/Feature/MonthlyFeeControllerTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\MonthlyFeeSetting;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Tests\TestCase;

class MonthlyFeeControllerTest extends TestCase
{
    private function makeAdmin(School $school): User
    {
        return User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
    }

    private function makeGuardianWithActiveChild(School $school, float $expectedFee = 0): Guardian
    {
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create([
            'school_id' => $school->id,
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        Student::factory()->create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'status' => 'active',
        ]);

        if ($expectedFee > 0) {
            MonthlyFeeSetting::create([
                'school_id' => $school->id,
                'guardian_id' => $guardian->id,
                'expected_fee' => $expectedFee,
            ]);
        }

        return $guardian;
    }

    public function test_index_syncs_the_open_month_and_renders_the_guardian(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 32000);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('rows', 1)
            ->where('rows.0.guardian_id', $guardian->id)
            ->where('rows.0.status', 'unpaid')
        );
    }

    public function test_update_expected_fee_also_fixes_the_currently_open_unpaid_entry(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school); // no fee set yet

        $this->actingAs($admin)->get('/monthly-fees'); // syncs the open month with expected_amount = 0

        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $this->assertSame('needs_fee', $entry->status);

        $this->actingAs($admin)
            ->put("/monthly-fees/guardians/{$guardian->id}/expected-fee", ['expected_fee' => 24000])
            ->assertRedirect();

        $this->assertSame('24000.00', $entry->fresh()->expected_amount);
        $this->assertSame('unpaid', $entry->fresh()->status);
    }

    public function test_mark_paid_sets_collected_to_expected_amount(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 32000);
        $this->actingAs($admin)->get('/monthly-fees');
        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();

        $this->actingAs($admin)->post("/monthly-fees/entries/{$entry->id}/mark-paid")->assertRedirect();

        $entry->refresh();
        $this->assertSame('32000.00', $entry->amount_collected);
        $this->assertSame('paid', $entry->status);
        $this->assertNotNull($entry->paid_date);
    }

    public function test_undo_reverses_a_paid_entry_back_to_unpaid(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 32000);
        $this->actingAs($admin)->get('/monthly-fees');
        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $this->actingAs($admin)->post("/monthly-fees/entries/{$entry->id}/mark-paid");

        $this->actingAs($admin)->post("/monthly-fees/entries/{$entry->id}/undo")->assertRedirect();

        $entry->refresh();
        $this->assertNull($entry->amount_collected);
        $this->assertNull($entry->paid_date);
        $this->assertSame('unpaid', $entry->status);
    }

    public function test_update_collected_records_a_partial_amount(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 32000);
        $this->actingAs($admin)->get('/monthly-fees');
        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();

        $this->actingAs($admin)
            ->put("/monthly-fees/entries/{$entry->id}", ['amount' => 10000])
            ->assertRedirect();

        $entry->refresh();
        $this->assertSame('10000.00', $entry->amount_collected);
        $this->assertSame('partial', $entry->status);
    }

    public function test_update_collected_to_zero_behaves_like_undo(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 32000);
        $this->actingAs($admin)->get('/monthly-fees');
        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $this->actingAs($admin)->post("/monthly-fees/entries/{$entry->id}/mark-paid");

        $this->actingAs($admin)->put("/monthly-fees/entries/{$entry->id}", ['amount' => 0]);

        $entry->refresh();
        $this->assertNull($entry->amount_collected);
        $this->assertSame('unpaid', $entry->status);
    }

    public function test_open_next_month_advances_the_ledger(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $this->makeGuardianWithActiveChild($school, expectedFee: 32000);
        $this->actingAs($admin)->get('/monthly-fees');

        $response = $this->actingAs($admin)->post('/monthly-fees/open-next-month');

        $response->assertRedirect();
        $this->assertSame(2, MonthlyFeeEntry::count());
    }

    public function test_guardian_can_view_their_own_current_month(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);

        $response = $this->actingAs($guardian->user)->get('/guardian/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('guardianName', $guardian->full_name)
            ->where('expectedAmount', 16000.0)
        );
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeControllerTest.php`
Expected: FAIL — route `monthly-fees.index` / path `/monthly-fees` not found (404s).

- [ ] **Step 3: Write the controller**

`app/Http/Controllers/MonthlyFeeController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\MonthlyFeeSetting;
use App\Services\MonthlyFeeLedgerService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class MonthlyFeeController extends Controller
{
    public function __construct(private MonthlyFeeLedgerService $ledger)
    {
    }

    /**
     * Admin ledger view for a single month. Defaults to whichever month is
     * currently "open". Only the open month gets synced on load — browsing
     * to an older month never mutates it, so a guardian who joins after
     * September closes doesn't get silently injected into September's
     * history.
     */
    public function index(Request $request)
    {
        $schoolId = $request->user()->school_id;
        $latest = $this->ledger->latestMonth($schoolId);

        $year = (int) $request->query('year', $latest['year']);
        $month = (int) $request->query('month', $latest['month']);

        $isOpenMonth = $year === $latest['year'] && $month === $latest['month'];

        if ($isOpenMonth) {
            $this->ledger->syncMonth($schoolId, $year, $month);
        }

        $entries = MonthlyFeeEntry::where('school_id', $schoolId)
            ->where('year', $year)
            ->where('month', $month)
            ->with('guardian.user')
            ->get();

        $rows = $entries->map(function (MonthlyFeeEntry $entry) {
            $guardian = $entry->guardian;

            $children = $guardian->allStudents()
                ->where('status', 'active')
                ->with('grade')
                ->get()
                ->map(fn ($student) => [
                    'name' => trim($student->first_name . ' ' . $student->last_name),
                    'grade' => $student->grade->name ?? null,
                ])
                ->values();

            return [
                'entry_id' => $entry->id,
                'guardian_id' => $guardian->id,
                'guardian_name' => $guardian->full_name,
                'guardian_number' => $guardian->guardian_number,
                'phone' => $guardian->phone,
                'children' => $children,
                'expected_amount' => (float) $entry->expected_amount,
                'amount_collected' => $entry->amount_collected !== null ? (float) $entry->amount_collected : null,
                'paid_date' => $entry->paid_date?->format('Y-m-d'),
                'status' => $entry->status,
            ];
        })->sortBy('guardian_name')->values();

        $monthDate = Carbon::create($year, $month, 1);
        $prev = $monthDate->copy()->subMonthNoOverflow();
        $next = $monthDate->copy()->addMonthNoOverflow();
        $wouldBrowsePastOpenMonth = $isOpenMonth;

        return Inertia::render('Fees/MonthlyFees/Index', [
            'year' => $year,
            'month' => $month,
            'monthLabel' => $monthDate->format('F Y'),
            'isOpenMonth' => $isOpenMonth,
            'canBrowseNext' => ! $wouldBrowsePastOpenMonth,
            'prev' => ['year' => $prev->year, 'month' => $prev->month],
            'next' => ['year' => $next->year, 'month' => $next->month],
            'rows' => $rows,
            'totalCollected' => $rows->sum(
                fn ($row) => in_array($row['status'], ['paid', 'partial'], true) ? $row['amount_collected'] : 0
            ),
        ]);
    }

    public function openNextMonth(Request $request)
    {
        $next = $this->ledger->openNextMonth($request->user()->school_id);

        return redirect()->route('monthly-fees.index', $next);
    }

    public function updateExpected(Request $request, Guardian $guardian)
    {
        $validated = $request->validate([
            'expected_fee' => ['required', 'numeric', 'min:0'],
        ]);

        $setting = MonthlyFeeSetting::updateOrCreate(
            ['guardian_id' => $guardian->id],
            [
                'school_id' => $guardian->school_id,
                'expected_fee' => $validated['expected_fee'],
                'updated_by' => $request->user()->id,
            ]
        );

        // The currently open month's entry, if it hasn't been collected yet,
        // reflects the new rate immediately — this is what turns a flagged
        // "needs fee" row into a collectible one without waiting for next
        // month. An entry that already has a recorded amount is left alone;
        // its expected_amount stays the snapshot from when it was generated.
        $latest = $this->ledger->latestMonth($guardian->school_id);

        MonthlyFeeEntry::where('guardian_id', $guardian->id)
            ->where('year', $latest['year'])
            ->where('month', $latest['month'])
            ->whereNull('amount_collected')
            ->update(['expected_amount' => $setting->expected_fee]);

        return back()->with('success', 'Expected fee updated.');
    }

    public function markPaid(Request $request, MonthlyFeeEntry $entry)
    {
        $entry->update([
            'amount_collected' => $entry->expected_amount,
            'paid_date' => now()->toDateString(),
            'recorded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Marked as paid.');
    }

    public function undoPaid(Request $request, MonthlyFeeEntry $entry)
    {
        $entry->update([
            'amount_collected' => null,
            'paid_date' => null,
            'recorded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Payment undone.');
    }

    public function updateCollected(Request $request, MonthlyFeeEntry $entry)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $amount = (float) $validated['amount'];

        $entry->update([
            'amount_collected' => $amount > 0 ? $amount : null,
            'paid_date' => $amount > 0 ? ($entry->paid_date?->toDateString() ?? now()->toDateString()) : null,
            'recorded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Amount updated.');
    }

    /**
     * Guardian-facing view of their own current month — mirrors how
     * InvoiceController already serves both the admin and guardian invoice
     * routes from one controller under different route-group permissions.
     */
    public function guardianShow(Request $request)
    {
        $guardian = Guardian::where('user_id', $request->user()->id)->firstOrFail();
        $schoolId = $guardian->school_id;
        $latest = $this->ledger->latestMonth($schoolId);

        $this->ledger->syncMonth($schoolId, $latest['year'], $latest['month']);

        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)
            ->where('year', $latest['year'])
            ->where('month', $latest['month'])
            ->first();

        $monthDate = Carbon::create($latest['year'], $latest['month'], 1);
        $expected = $entry ? (float) $entry->expected_amount : 0;
        $collected = $entry ? (float) ($entry->amount_collected ?? 0) : 0;

        return Inertia::render('Fees/MonthlyFees/GuardianShow', [
            'monthLabel' => $monthDate->format('F Y'),
            'guardianName' => $guardian->full_name,
            'guardianNumber' => $guardian->guardian_number,
            'phone' => $guardian->phone,
            'amountDue' => max($expected - $collected, 0),
            'expectedAmount' => $expected,
            'status' => $entry->status ?? 'needs_fee',
        ]);
    }
}
```

- [ ] **Step 4: Add the routes**

In `routes/web.php`, add the import near the other fee controller imports (after the existing `use App\Http\Controllers\PaymentController;` line, around line 38):

```php
use App\Http\Controllers\MonthlyFeeController;
```

Then, inside the existing `permission:fees.manage` group, immediately after the `fee-preferences` routes block (after the line `Route::get('/fee-preferences/{guardian}/history', ...)`, around line 676), add:

```php
        // Monthly Fee Ledger
        Route::get('/monthly-fees', [MonthlyFeeController::class, 'index'])->name('monthly-fees.index');
        Route::post('/monthly-fees/open-next-month', [MonthlyFeeController::class, 'openNextMonth'])->name('monthly-fees.open-next-month');
        Route::put('/monthly-fees/guardians/{guardian}/expected-fee', [MonthlyFeeController::class, 'updateExpected'])->name('monthly-fees.update-expected');
        Route::post('/monthly-fees/entries/{entry}/mark-paid', [MonthlyFeeController::class, 'markPaid'])->name('monthly-fees.mark-paid');
        Route::post('/monthly-fees/entries/{entry}/undo', [MonthlyFeeController::class, 'undoPaid'])->name('monthly-fees.undo');
        Route::put('/monthly-fees/entries/{entry}', [MonthlyFeeController::class, 'updateCollected'])->name('monthly-fees.update-collected');
```

Then, inside the existing `permission:fees.view-own-invoices` guardian group (around line 697-701), add before its closing `});`:

```php
        Route::get('/guardian/monthly-fees', [MonthlyFeeController::class, 'guardianShow'])->name('guardian.monthly-fees');
```

- [ ] **Step 5: Add the nav entries**

In `resources/js/Config/navigation.js`, inside the admin `Fees` submenu array (after the `"Fee Preferences"` entry, around line 107), add:

```js
                    { name: "Monthly Fees", href: "/monthly-fees", icon: Calendar, permission: "fees.manage" },
```

(`Calendar` is already imported at the top of the file for the Timetables/Exams sections — no new import needed.)

In the guardian navigation array (near the existing `"Invoices"` entry, around line 229), add:

```js
            { name: "Monthly Fees", href: "/guardian/monthly-fees", icon: DollarSign, permission: "fees.view-own-invoices" },
```

- [ ] **Step 6: Run the controller tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeControllerTest.php`
Expected: PASS, 8 tests. (`test_index_syncs_the_open_month_and_renders_the_guardian` and the guardian test will pass even before Tasks 4-5 exist, since `withoutVite()` skips the asset-manifest check the way the existing house tests do — Inertia only needs the *route and props*, not a built frontend file, to satisfy `assertInertia`.)

- [ ] **Step 7: Manually verify the nav link is live**

Run: `php8.4 artisan serve` (or your usual `composer dev`) and log in as an admin. Confirm "Monthly Fees" now appears under the Fees section in the sidebar and following it hits `/monthly-fees` without a routing error (it will show Inertia's "page not found" until Task 4 adds the React component — that is expected at this checkpoint).

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/MonthlyFeeController.php routes/web.php resources/js/Config/navigation.js \
        tests/Feature/MonthlyFeeControllerTest.php
git commit -m "feat: add monthly fee controller, routes, and nav entries"
```

---

### Task 4: Admin ledger page — `Fees/MonthlyFees/Index.jsx`

**Files:**
- Create: `resources/js/Pages/Fees/MonthlyFees/Index.jsx`

**Interfaces:**
- Consumes: the exact prop shape `index()` renders in Task 3 (`year, month, monthLabel, isOpenMonth, canBrowseNext, prev, next, rows, totalCollected`), and posts to the five route paths added in Task 3 (`/monthly-fees` with `year`/`month` query params, `/monthly-fees/open-next-month`, `/monthly-fees/guardians/{id}/expected-fee`, `/monthly-fees/entries/{id}/mark-paid`, `/monthly-fees/entries/{id}/undo`, `/monthly-fees/entries/{id}` for PUT).

Style note: this page should look and feel like the rest of this app's admin screens (Tailwind utility classes, white cards, gray borders, indigo accents, `lucide-react` icons, `AuthenticatedLayout` — see `resources/js/Pages/Fees/Invoices/Show.jsx` for the established visual language) — it is not meant to reproduce any bespoke "ledger/stamp" visual theme; only the interaction model described below (expand rows, editable Expected/Collected cells, Mark Paid / Undo / pencil-edit, month switching, totals footer) is the fixed requirement, already confirmed with the user via an out-of-repo prototype.

- [ ] **Step 1: Write the page component**

`resources/js/Pages/Fees/MonthlyFees/Index.jsx`:

```jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronRight, ChevronLeft, Pencil, Check, Undo2 } from 'lucide-react';

export default function MonthlyFeesIndex({
    auth, year, month, monthLabel, isOpenMonth, canBrowseNext, prev, next, rows, totalCollected,
}) {
    const [openRows, setOpenRows] = useState({});
    const [editingExpected, setEditingExpected] = useState(null);
    const [editingAmount, setEditingAmount] = useState(null);

    const fmt = (n) => 'KES ' + Number(n || 0).toLocaleString('en-KE');

    const goToMonth = (target) => {
        router.get('/monthly-fees', { year: target.year, month: target.month });
    };

    const openNextMonth = () => {
        router.post('/monthly-fees/open-next-month');
    };

    const toggleRow = (guardianId) => {
        setOpenRows((prevState) => ({ ...prevState, [guardianId]: !prevState[guardianId] }));
    };

    const saveExpected = (guardianId, value) => {
        router.put(
            `/monthly-fees/guardians/${guardianId}/expected-fee`,
            { expected_fee: value },
            { preserveScroll: true, onSuccess: () => setEditingExpected(null) }
        );
    };

    const markPaid = (entryId) => {
        router.post(`/monthly-fees/entries/${entryId}/mark-paid`, {}, { preserveScroll: true });
    };

    const undoPaid = (entryId) => {
        router.post(`/monthly-fees/entries/${entryId}/undo`, {}, { preserveScroll: true });
    };

    const saveAmount = (entryId, value) => {
        router.put(
            `/monthly-fees/entries/${entryId}`,
            { amount: value },
            { preserveScroll: true, onSuccess: () => setEditingAmount(null) }
        );
    };

    const statusBadge = (status) => {
        const styles = {
            paid: 'bg-green-100 text-green-700',
            partial: 'bg-amber-100 text-amber-700',
            unpaid: 'bg-gray-100 text-gray-600',
            needs_fee: 'bg-red-100 text-red-700',
        };
        const labels = { paid: 'Paid', partial: 'Partial', unpaid: 'Unpaid', needs_fee: 'Needs fee' };
        return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <AuthenticatedLayout auth={auth} header={<h2 className="text-xl font-semibold text-gray-800">Monthly Fees</h2>}>
            <Head title="Monthly Fees" />

            <div className="py-6">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => goToMonth(prev)}
                                    className="rounded border border-gray-300 p-1.5 text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
                                    aria-label="Previous month"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div className="min-w-[10rem] text-center text-lg font-semibold text-gray-900">{monthLabel}</div>
                                <button
                                    onClick={() => goToMonth(next)}
                                    disabled={!canBrowseNext}
                                    className="rounded border border-gray-300 p-1.5 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Next month"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="max-w-xs text-xs text-gray-500">
                                {isOpenMonth
                                    ? "This month is re-checked for new guardians every time it's opened."
                                    : 'Viewing a past month — new guardians are not added here.'}
                            </p>
                            <button
                                onClick={openNextMonth}
                                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                            >
                                Open next month &rarr;
                            </button>
                        </div>

                        <div className="hidden grid-cols-[20px_2fr_1fr_1.1fr_1fr] gap-3 border-b border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 sm:grid">
                            <span></span>
                            <span>Guardian</span>
                            <span>Children</span>
                            <span className="text-right">Expected</span>
                            <span className="text-right">Collected</span>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {rows.map((row) => (
                                <div key={row.guardian_id}>
                                    <div
                                        className="grid cursor-pointer grid-cols-[20px_1fr] items-center gap-2 px-4 py-3 hover:bg-gray-50 sm:grid-cols-[20px_2fr_1fr_1.1fr_1fr] sm:gap-3"
                                        onClick={() => toggleRow(row.guardian_id)}
                                    >
                                        <ChevronRight
                                            className={`h-3.5 w-3.5 text-gray-400 transition-transform ${openRows[row.guardian_id] ? 'rotate-90' : ''}`}
                                        />
                                        <div>
                                            <div className="font-semibold text-gray-900">{row.guardian_name}</div>
                                            <div className="text-xs text-gray-400">{row.guardian_number}</div>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {row.children.length} {row.children.length === 1 ? 'child' : 'children'}
                                        </div>

                                        <div className="flex items-center justify-end gap-1.5 text-sm" onClick={(e) => e.stopPropagation()}>
                                            {editingExpected === row.guardian_id ? (
                                                <InlineAmountEditor
                                                    initial={row.expected_amount}
                                                    onSave={(value) => saveExpected(row.guardian_id, value)}
                                                />
                                            ) : (
                                                <>
                                                    <span>{row.expected_amount ? fmt(row.expected_amount) : '—'}</span>
                                                    <button
                                                        onClick={() => setEditingExpected(row.guardian_id)}
                                                        className="text-gray-400 hover:text-indigo-600"
                                                        title="Edit expected fee"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            {row.status === 'needs_fee' && statusBadge('needs_fee')}

                                            {row.status !== 'needs_fee' && editingAmount === row.entry_id && (
                                                <InlineAmountEditor
                                                    initial={row.amount_collected || 0}
                                                    onSave={(value) => saveAmount(row.entry_id, value)}
                                                />
                                            )}

                                            {row.status !== 'needs_fee' && editingAmount !== row.entry_id && (
                                                <>
                                                    {row.status === 'paid' && (
                                                        <>
                                                            <span className="text-sm font-medium text-green-700">{fmt(row.amount_collected)}</span>
                                                            <button onClick={() => setEditingAmount(row.entry_id)} className="text-gray-400 hover:text-indigo-600" title="Adjust amount">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button onClick={() => undoPaid(row.entry_id)} className="text-gray-400 hover:text-red-600" title="Undo — this was marked paid by mistake">
                                                                <Undo2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {row.status === 'partial' && (
                                                        <>
                                                            <span className="text-sm font-medium text-amber-700">{fmt(row.amount_collected)}</span>
                                                            <button onClick={() => setEditingAmount(row.entry_id)} className="text-gray-400 hover:text-indigo-600" title="Adjust amount">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {row.status === 'unpaid' && (
                                                        <>
                                                            <button
                                                                onClick={() => markPaid(row.entry_id)}
                                                                className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:border-green-500 hover:text-green-700"
                                                            >
                                                                Mark paid
                                                            </button>
                                                            <button onClick={() => setEditingAmount(row.entry_id)} className="text-gray-400 hover:text-indigo-600" title="Enter a specific amount">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {statusBadge(row.status)}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {openRows[row.guardian_id] && (
                                        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 pl-10 text-sm">
                                            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Children</div>
                                            {row.children.map((child) => (
                                                <div key={child.name} className="flex justify-between text-gray-600">
                                                    <span className="font-medium text-gray-800">{child.name}</span>
                                                    <span>{child.grade}</span>
                                                </div>
                                            ))}
                                            <div className="mt-2 flex justify-between text-gray-400">
                                                <span>Phone</span>
                                                <span>{row.phone}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {rows.length === 0 && (
                                <div className="px-4 py-10 text-center text-sm text-gray-400">
                                    No guardians with active students yet.
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
                            <span className="text-sm font-semibold text-gray-600">Collected so far — {monthLabel}</span>
                            <span className="text-lg font-bold text-gray-900">{fmt(totalCollected)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function InlineAmountEditor({ initial, onSave }) {
    const [value, setValue] = useState(initial);

    return (
        <div className="flex items-center gap-1">
            <input
                type="number"
                min="0"
                step="0.01"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-24 rounded border border-indigo-400 px-1.5 py-0.5 text-right text-sm"
            />
            <button onClick={() => onSave(value)} className="text-green-600 hover:text-green-800">
                <Check className="h-4 w-4" />
            </button>
        </div>
    );
}
```

- [ ] **Step 2: Rebuild frontend assets and re-run the controller test**

Run: `npm run build && php8.4 artisan test tests/Feature/MonthlyFeeControllerTest.php`
Expected: PASS, 8 tests (unchanged — this task doesn't add new backend behavior, it makes the already-passing route actually render a real page instead of an Inertia stub).

- [ ] **Step 3: Manually verify in the browser**

Log in as an admin, open "Monthly Fees" from the sidebar. Confirm: a guardian row expands to show children on click; the Expected cell has a working pencil that saves via the input; an Unpaid row's "Mark paid" turns it green with an Undo option; Undo reverts it; the pencil on a Partial/Paid row lets you type a different amount; the footer total updates after each change; "Open next month" advances the month label and creates a fresh set of rows.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Fees/MonthlyFees/Index.jsx
git commit -m "feat: add admin monthly fee ledger page"
```

---

### Task 5: Guardian page — `Fees/MonthlyFees/GuardianShow.jsx`

**Files:**
- Create: `resources/js/Pages/Fees/MonthlyFees/GuardianShow.jsx`

**Interfaces:**
- Consumes: the exact prop shape `guardianShow()` renders in Task 3 (`monthLabel, guardianName, guardianNumber, phone, amountDue, expectedAmount, status`).

- [ ] **Step 1: Write the page component**

`resources/js/Pages/Fees/MonthlyFees/GuardianShow.jsx`:

```jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function MonthlyFeeGuardianShow({
    auth, monthLabel, guardianName, guardianNumber, phone, amountDue, status,
}) {
    const [payPhone, setPayPhone] = useState(phone || '');
    const [showNote, setShowNote] = useState(false);

    const fmt = (n) => 'KES ' + Number(n || 0).toLocaleString('en-KE');

    return (
        <AuthenticatedLayout auth={auth} header={<h2 className="text-xl font-semibold text-gray-800">Monthly Fee</h2>}>
            <Head title="Monthly Fee" />

            <div className="py-6">
                <div className="mx-auto max-w-md sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <p className="text-xs uppercase tracking-wide text-gray-400">Monthly fee</p>
                        <p className="mb-4 text-lg font-semibold text-gray-900">{guardianName}</p>

                        <div className="mb-5 border-y border-dashed border-gray-200 py-4 text-center">
                            <p className="text-sm text-gray-500">Amount due for {monthLabel}</p>
                            {status === 'needs_fee' ? (
                                <p className="mt-1 text-sm text-gray-500">
                                    Your fee for this month hasn&apos;t been set yet — please check with the school office.
                                </p>
                            ) : status === 'paid' ? (
                                <p className="mt-1 text-2xl font-bold text-green-700">Fully paid</p>
                            ) : (
                                <p className="mt-1 text-3xl font-bold text-gray-900">{fmt(amountDue)}</p>
                            )}
                        </div>

                        {status !== 'needs_fee' && status !== 'paid' && (
                            <>
                                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="pay-phone">
                                    M-Pesa number to pay from
                                </label>
                                <input
                                    id="pay-phone"
                                    type="tel"
                                    value={payPhone}
                                    onChange={(e) => setPayPhone(e.target.value)}
                                    className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
                                />

                                <button
                                    onClick={() => setShowNote(true)}
                                    className="w-full rounded-md bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-500"
                                >
                                    Pay here
                                </button>

                                {showNote && (
                                    <div className="mt-4 rounded border border-dashed border-gray-300 p-3 text-sm text-gray-600">
                                        <strong className="text-gray-900">Online payments are coming soon.</strong> For now,
                                        please pay at the school office and ask them to record it against your account.
                                    </div>
                                )}
                            </>
                        )}

                        <p className="mt-6 text-center text-xs text-gray-400">Guardian ID {guardianNumber}</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

- [ ] **Step 2: Rebuild frontend assets and re-run the controller test**

Run: `npm run build && php8.4 artisan test tests/Feature/MonthlyFeeControllerTest.php`
Expected: PASS, 8 tests.

- [ ] **Step 3: Manually verify in the browser**

Log in as a guardian with an active student and a standing monthly fee set (or set one via the admin page from Task 4 first). Open "Monthly Fees" from the guardian nav. Confirm the amount due shows correctly, the phone field is pre-filled and editable, and "Pay here" shows the inline "coming soon" note and does nothing else.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Fees/MonthlyFees/GuardianShow.jsx
git commit -m "feat: add guardian monthly fee view"
```

---

### Task 6: Full suite regression check

**Files:** none (verification only).

- [ ] **Step 1: Run the entire test suite**

Run: `php8.4 artisan test`
Expected: PASS — the pre-existing 247 tests plus this feature's new tests (18 across Tasks 1-3), all green, 0 failures.

- [ ] **Step 2: If anything unrelated broke, stop and investigate before continuing**

Do not proceed to `finishing-a-development-branch` with a red suite.

---

## Self-Review Notes

- **Spec coverage:** sync/idempotency ✓ (Task 2), new-guardian-mid-month ✓ (Task 2 test 3), needs-fee flag + resolution ✓ (Task 1 status accessor, Task 3 `updateExpected`), Mark Paid ✓, Undo ✓, edit-to-partial ✓, status boundaries ✓ (Task 1), admin UI shape (single month, expand, editable cells, totals) ✓ (Task 4), guardian view (current month only, non-functional Pay Here) ✓ (Task 5), nav reachable early ✓ (Task 3, before Tasks 4-5 exist).
- **Type consistency checked:** `MonthlyFeeLedgerService::syncMonth(int $schoolId, int $year, int $month): void` / `latestMonth(int $schoolId): array` / `openNextMonth(int $schoolId): array` are the exact signatures used identically in Task 2's tests, Task 3's controller, and this header. Controller prop keys (`rows[].entry_id`, `guardian_id`, `expected_amount`, `amount_collected`, `status`, etc.) match exactly between Task 3's `index()`/`guardianShow()` and Tasks 4-5's React components.
- **Out of scope confirmed absent:** no `billing_mode` column/toggle, no M-Pesa/Paystack code, no per-child amount field, no payment-history table beyond `amount_collected`/`recorded_by`/`paid_date` on `monthly_fee_entries`.
