# Monthly Fees — Holiday Months Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a Monthly Fees school mark a recurring set of calendar months (e.g. July, August) as holiday months — no fee expected, no fee collected, no "needs fee" alert, and no prepaid credit silently consumed against them.

**Architecture:** A `holiday_months` JSON array on `schools` (school-admin-configured), consulted by `MonthlyFeeLedgerService::syncMonth()` when it opens a new month — a designated holiday month's entries get `expected_amount = 0` and a new, permanent `is_holiday` flag, and skip the existing credit-auto-consumption step entirely. A new `'holiday'` status (checked before the existing `needs_fee` check) is what actually distinguishes this from "nobody configured a fee yet."

**Tech Stack:** Laravel 12 (PHP 8.4), Inertia.js + React 18, PHPUnit-style Pest test classes with `RefreshDatabase`.

**Spec:** `docs/superpowers/specs/2026-09-11-monthly-fee-holiday-months-design.md`

## Global Constraints

- Tests are PHPUnit-style classes extending `Tests\TestCase` with explicit `use RefreshDatabase;`, matching every existing test in this repo (not Pest closures).
- Every test hitting an Inertia page must call `$this->withoutVite();` first.
- Use `php8.4` explicitly for all artisan/composer commands — the default `php` on this machine is 8.5 and lacks `pdo_sqlite`.
- `is_holiday` is set once, at entry-creation time inside `syncMonth()`, and never recomputed or updated afterward by any other code path — a school changing its `holiday_months` configuration later must never retroactively rewrite what a past month already was.
- Holiday months need not be contiguous — `[4, 8, 11, 12]` is exactly as valid as `[7, 8]`. No code anywhere in this plan may assume a single start/end range.
- Partial/mid-month holidays are out of scope — a holiday month is always a whole month with `expected_amount = 0` for every guardian, never a partial amount.
- The new `monthly-fees.update-holiday-months` route must sit inside the existing `fee-module:monthly`-gated route group — unreachable (404) for a `fee_module: 'termly'` school, matching how every other Monthly Fees route already behaves.

---

### Task 1: Migrations + model changes

**Files:**
- Create: `database/migrations/2026_09_11_200000_add_holiday_months_to_schools_table.php`
- Create: `database/migrations/2026_09_11_200001_add_is_holiday_to_monthly_fee_entries_table.php`
- Modify: `app/Models/School.php` (`$fillable`, `$casts`)
- Modify: `app/Models/MonthlyFeeEntry.php` (`$fillable`, casts, `getStatusAttribute()`)
- Test: `tests/Feature/MonthlyFeeHolidayColumnsTest.php`

**Interfaces:**
- Produces: `schools.holiday_months` (nullable JSON array of ints 1-12, cast to `array`), `monthly_fee_entries.is_holiday` (boolean, `default(false)`), `MonthlyFeeEntry::getStatusAttribute()` returning `'holiday'` when `is_holiday` is true (checked before the existing `needs_fee` branch).

- [ ] **Step 1: Write the failing tests**

Create `tests/Feature/MonthlyFeeHolidayColumnsTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonthlyFeeHolidayColumnsTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_school_created_with_no_explicit_holiday_months_has_none(): void
    {
        $school = School::factory()->create();

        $this->assertNull($school->fresh()->holiday_months);
    }

    public function test_holiday_months_is_mass_assignable_and_casts_to_an_array(): void
    {
        $school = School::factory()->create(['holiday_months' => [7, 8]]);

        $this->assertSame([7, 8], $school->fresh()->holiday_months);
    }

    public function test_holiday_months_supports_a_non_contiguous_set(): void
    {
        $school = School::factory()->create(['holiday_months' => [4, 8, 11, 12]]);

        $this->assertSame([4, 8, 11, 12], $school->fresh()->holiday_months);
    }

    public function test_a_monthly_fee_entry_created_with_no_explicit_is_holiday_defaults_to_false(): void
    {
        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $user->id, 'status' => 'active']);
        Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id, 'status' => 'active']);

        $entry = MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 9, 'expected_amount' => 16000,
        ]);

        $this->assertFalse($entry->fresh()->is_holiday);
    }

    public function test_status_is_holiday_when_is_holiday_is_true_even_though_expected_amount_is_zero(): void
    {
        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $user->id, 'status' => 'active']);
        Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id, 'status' => 'active']);

        $entry = MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 7, 'expected_amount' => 0, 'is_holiday' => true,
        ]);

        $this->assertSame('holiday', $entry->status);
    }

    public function test_status_is_still_needs_fee_when_expected_amount_is_zero_and_is_holiday_is_false(): void
    {
        // Regression guard: the pre-existing "nobody set a fee yet" signal
        // must be completely unaffected by this change.
        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $user->id, 'status' => 'active']);
        Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id, 'status' => 'active']);

        $entry = MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 9, 'expected_amount' => 0,
        ]);

        $this->assertSame('needs_fee', $entry->status);
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeHolidayColumnsTest.php`
Expected: FAIL — neither column exists yet.

- [ ] **Step 3: Write the migrations**

Create `database/migrations/2026_09_11_200000_add_holiday_months_to_schools_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->json('holiday_months')->nullable()->after('fee_module');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn('holiday_months');
        });
    }
};
```

Create `database/migrations/2026_09_11_200001_add_is_holiday_to_monthly_fee_entries_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monthly_fee_entries', function (Blueprint $table) {
            $table->boolean('is_holiday')->default(false)->after('credit_applied');
        });
    }

    public function down(): void
    {
        Schema::table('monthly_fee_entries', function (Blueprint $table) {
            $table->dropColumn('is_holiday');
        });
    }
};
```

- [ ] **Step 4: Add `holiday_months` to `School`**

In `app/Models/School.php`, add `'holiday_months'` to `$fillable` immediately after the existing `'fee_module'` entry:

```php
    protected $fillable = [
        'name',
        'tagline',
        'motto',
        'vision',
        'mission',
        'email',
        'phone_primary',
        'phone_secondary',
        'physical_address',
        'slug',
        'domain',
        'admin_name',
        'admin_email',
        'admin_phone',
        'is_active',
        'status',
        'school_type',
        'fee_module',
        'holiday_months',
        'trial_ends_at',
        'current_student_count',
        'address',
        'logo_path',
    ];
```

Add `'holiday_months' => 'array'` to `$casts`:

```php
    protected $casts = [
        'is_active' => 'boolean',
        'trial_ends_at' => 'datetime',
        'current_student_count' => 'integer',
        'holiday_months' => 'array',
    ];
```

- [ ] **Step 5: Add `is_holiday` to `MonthlyFeeEntry` and update `getStatusAttribute()`**

In `app/Models/MonthlyFeeEntry.php`, add `'is_holiday'` to `$fillable` immediately after `'credit_applied'`:

```php
    protected $fillable = [
        'school_id',
        'guardian_id',
        'year',
        'month',
        'expected_amount',
        'amount_collected',
        'credit_applied',
        'is_holiday',
        'paid_date',
        'recorded_by',
        'notes',
    ];
```

Add `'is_holiday' => 'boolean'` to the `casts()` method:

```php
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'expected_amount' => 'decimal:2',
            'amount_collected' => 'decimal:2',
            'credit_applied' => 'decimal:2',
            'is_holiday' => 'boolean',
            'paid_date' => 'date',
        ];
    }
```

Replace `getStatusAttribute()`:

```php
    /**
     * Computed, never stored — recomputed from expected_amount/amount_collected
     * (and is_holiday) on every read so it can never drift out of sync with
     * its source columns. is_holiday takes priority over everything else —
     * a holiday month's expected_amount is a deliberate, correct zero, not
     * the same "nobody set a fee yet" gap that needs_fee represents, so it
     * must never fall into that branch. needs_fee takes priority over the
     * rest: an unset expected amount is a data gap to fix, not "unpaid".
     */
    public function getStatusAttribute(): string
    {
        if ($this->is_holiday) {
            return 'holiday';
        }

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
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeHolidayColumnsTest.php`
Expected: PASS, 6 tests.

- [ ] **Step 7: Run the full monthly-fee suite to confirm no regressions**

Run: `php8.4 artisan test --filter=MonthlyFee`
Expected: PASS — every existing test unaffected, since `is_holiday` defaults to `false` and the new `getStatusAttribute()` branch is a no-op for every existing entry.

- [ ] **Step 8: Commit**

```bash
git add database/migrations/2026_09_11_200000_add_holiday_months_to_schools_table.php database/migrations/2026_09_11_200001_add_is_holiday_to_monthly_fee_entries_table.php app/Models/School.php app/Models/MonthlyFeeEntry.php tests/Feature/MonthlyFeeHolidayColumnsTest.php
git commit -m "feat: add holiday_months and is_holiday columns for the Monthly Fees holiday-month feature"
```

---

### Task 2: Service-layer logic — `syncMonth()` holiday handling

**This is the core correctness task: a holiday month must never expect a fee, never trigger needs_fee, and never silently consume a guardian's prepaid credit.**

**Files:**
- Modify: `app/Services/MonthlyFeeLedgerService.php` (`syncMonth()`)
- Test: `tests/Feature/MonthlyFeeLedgerServiceTest.php` (extend the existing file — do not remove any of its current tests)

**Interfaces:**
- Consumes: `School::$holiday_months` (Task 1), `MonthlyFeeEntry::$is_holiday` (Task 1).
- Produces: no new public method — `syncMonth()`'s existing signature and behavior for non-holiday months are completely unchanged.

- [ ] **Step 1: Write the failing tests**

Append to `tests/Feature/MonthlyFeeLedgerServiceTest.php` (inside the existing class, after `test_sync_skips_a_guardian_with_no_active_students`):

```php
    public function test_sync_marks_a_designated_holiday_month_with_zero_expected_amount(): void
    {
        $school = School::factory()->create(['holiday_months' => [7, 8]]);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);

        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 7);

        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)
            ->where('year', 2026)->where('month', 7)->first();

        $this->assertNotNull($entry);
        $this->assertSame('0.00', $entry->expected_amount);
        $this->assertTrue($entry->is_holiday);
        $this->assertSame('holiday', $entry->status);
    }

    public function test_sync_does_not_touch_credit_balance_when_opening_a_holiday_month(): void
    {
        $school = School::factory()->create(['holiday_months' => [7, 8]]);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $guardian->monthlyFeeSetting->update(['credit_balance' => 32000]);

        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 7);

        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)
            ->where('year', 2026)->where('month', 7)->first();

        $this->assertNull($entry->amount_collected);
        $this->assertSame('0.00', $entry->credit_applied);
        $this->assertSame('32000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
    }

    public function test_sync_on_a_non_holiday_month_is_completely_unaffected(): void
    {
        // Regression guard: a school with holiday_months configured must
        // still bill every ordinary month exactly as before.
        $school = School::factory()->create(['holiday_months' => [7, 8]]);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);

        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);

        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)
            ->where('year', 2026)->where('month', 9)->first();

        $this->assertSame('16000.00', $entry->expected_amount);
        $this->assertFalse($entry->is_holiday);
        $this->assertSame('unpaid', $entry->status);
    }

    public function test_sync_with_no_holiday_months_configured_bills_every_month_normally(): void
    {
        // Regression guard: a school that never configured holiday_months
        // at all (null) must behave exactly as it does today.
        $school = School::factory()->create(); // holiday_months left null
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);

        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 7);

        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)
            ->where('year', 2026)->where('month', 7)->first();

        $this->assertSame('16000.00', $entry->expected_amount);
        $this->assertFalse($entry->is_holiday);
    }

    public function test_sync_supports_a_non_contiguous_holiday_month_set(): void
    {
        $school = School::factory()->create(['holiday_months' => [4, 8, 11, 12]]);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);

        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 8);
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 11);

        $august = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 8)->first();
        $september = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 9)->first();
        $november = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 11)->first();

        $this->assertTrue($august->is_holiday);
        $this->assertFalse($september->is_holiday);
        $this->assertTrue($november->is_holiday);
    }

    public function test_a_guardians_standing_rate_is_overridden_by_a_holiday_month_not_required_to_already_be_zero(): void
    {
        $school = School::factory()->create(['holiday_months' => [7]]);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 24000);

        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 7);

        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 7)->first();

        $this->assertSame('0.00', $entry->expected_amount);
        $this->assertTrue($entry->is_holiday);
    }

    public function test_outstanding_balance_excludes_a_past_holiday_month(): void
    {
        $school = School::factory()->create(['holiday_months' => [7]]);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;

        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 6, 'expected_amount' => 16000, 'amount_collected' => null,
        ]);
        $service->syncMonth($school->id, 2026, 7); // the holiday month itself

        $balance = $service->outstandingBalanceFor($guardian->id, 2026, 8);

        // Only June's real 16000 shortfall counts — July's holiday entry
        // (expected_amount 0) contributes nothing, with or without special-casing.
        $this->assertSame(16000.0, $balance);
    }

    public function test_record_payment_during_a_holiday_month_becomes_pure_credit_not_a_collected_amount(): void
    {
        $school = School::factory()->create(['holiday_months' => [7]]);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 7); // opens the holiday month as "current"
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $service->recordPayment($guardian->id, 16000, $admin->id);

        $holidayEntry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 7)->first();
        $this->assertNull($holidayEntry->amount_collected);
        $this->assertSame('16000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
    }
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: FAIL — every new test fails because `syncMonth()` doesn't check `holiday_months` yet, so entries get the guardian's real rate and credit is consumed normally.

- [ ] **Step 3: Update `syncMonth()`**

In `app/Services/MonthlyFeeLedgerService.php`, find the `foreach ($missingGuardianIds as $guardianId)` loop inside `syncMonth()`:

```php
        $settingsByGuardian = MonthlyFeeSetting::whereIn('guardian_id', $missingGuardianIds)
            ->get()
            ->keyBy('guardian_id');

        foreach ($missingGuardianIds as $guardianId) {
            DB::transaction(function () use ($schoolId, $guardianId, $year, $month, $settingsByGuardian) {
                $setting = MonthlyFeeSetting::lockForUpdate()->find($settingsByGuardian->get($guardianId)?->id);
                $expectedAmount = (float) ($setting->expected_fee ?? 0);
                $creditBalance = (float) ($setting->credit_balance ?? 0);
                $creditApplied = min($creditBalance, $expectedAmount);

                $entry = MonthlyFeeEntry::create([
                    'school_id' => $schoolId,
                    'guardian_id' => $guardianId,
                    'year' => $year,
                    'month' => $month,
                    'expected_amount' => $expectedAmount,
                ]);

                if ($creditApplied > 0) {
                    $entry->update([
                        'amount_collected' => $creditApplied,
                        'credit_applied' => $creditApplied,
                        'paid_date' => now()->toDateString(),
                        'recorded_by' => null,
                    ]);
                    $setting->decrement('credit_balance', $creditApplied);
                }
            });
        }
```

Replace it with:

```php
        $settingsByGuardian = MonthlyFeeSetting::whereIn('guardian_id', $missingGuardianIds)
            ->get()
            ->keyBy('guardian_id');

        $holidayMonths = School::find($schoolId)?->holiday_months ?? [];
        $isHolidayMonth = in_array($month, $holidayMonths, true);

        foreach ($missingGuardianIds as $guardianId) {
            DB::transaction(function () use ($schoolId, $guardianId, $year, $month, $settingsByGuardian, $isHolidayMonth) {
                $setting = MonthlyFeeSetting::lockForUpdate()->find($settingsByGuardian->get($guardianId)?->id);

                if ($isHolidayMonth) {
                    // A holiday month's expected amount is a deliberate,
                    // correct zero — never the guardian's standing rate, and
                    // never anything that consumes their prepaid credit
                    // (there's nothing real to consume it against).
                    MonthlyFeeEntry::create([
                        'school_id' => $schoolId,
                        'guardian_id' => $guardianId,
                        'year' => $year,
                        'month' => $month,
                        'expected_amount' => 0,
                        'is_holiday' => true,
                    ]);

                    return;
                }

                $expectedAmount = (float) ($setting->expected_fee ?? 0);
                $creditBalance = (float) ($setting->credit_balance ?? 0);
                $creditApplied = min($creditBalance, $expectedAmount);

                $entry = MonthlyFeeEntry::create([
                    'school_id' => $schoolId,
                    'guardian_id' => $guardianId,
                    'year' => $year,
                    'month' => $month,
                    'expected_amount' => $expectedAmount,
                ]);

                if ($creditApplied > 0) {
                    $entry->update([
                        'amount_collected' => $creditApplied,
                        'credit_applied' => $creditApplied,
                        'paid_date' => now()->toDateString(),
                        'recorded_by' => null,
                    ]);
                    $setting->decrement('credit_balance', $creditApplied);
                }
            });
        }
```

Add the `School` import at the top of the file, alongside the existing model imports:

```php
use App\Models\School;
```

(Check the current imports first — `Guardian`, `MonthlyFeeEntry`, `MonthlyFeePayment`, `MonthlyFeeSetting` are already imported; add `School` alongside them, keeping alphabetical order.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: PASS, all existing tests plus the 8 new ones (check the exact total against the file's current count before this task — it should be the pre-existing count + 8).

- [ ] **Step 5: Run the full monthly-fee suite**

Run: `php8.4 artisan test --filter=MonthlyFee`
Expected: PASS, no regressions.

- [ ] **Step 6: Commit**

```bash
git add app/Services/MonthlyFeeLedgerService.php tests/Feature/MonthlyFeeLedgerServiceTest.php
git commit -m "feat: skip fee expectation and credit consumption for designated holiday months"
```

---

### Task 3: Controller action + route

**Files:**
- Modify: `app/Http/Controllers/MonthlyFeeController.php` (new `updateHolidayMonths` action, `index()` gains `holidayMonths` prop)
- Modify: `routes/web.php` (one new route, inside the existing `fee-module:monthly` group)
- Test: `tests/Feature/MonthlyFeeHolidayMonthsControllerTest.php`

**Interfaces:**
- Consumes: `School::$holiday_months` (Task 1).
- Produces: route `monthly-fees.update-holiday-months` (`PUT /monthly-fees/holiday-months`), `index()`'s new `holidayMonths` prop (array of ints, `[]` if unset).

- [ ] **Step 1: Write the failing tests**

Create `tests/Feature/MonthlyFeeHolidayMonthsControllerTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonthlyFeeHolidayMonthsControllerTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(School $school): User
    {
        return User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
    }

    public function test_admin_can_set_the_schools_holiday_months(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);

        $response = $this->actingAs($admin)
            ->put('/monthly-fees/holiday-months', ['holiday_months' => [7, 8]]);

        $response->assertRedirect();
        $this->assertSame([7, 8], $school->fresh()->holiday_months);
    }

    public function test_holiday_months_accepts_a_non_contiguous_set(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);

        $this->actingAs($admin)->put('/monthly-fees/holiday-months', ['holiday_months' => [4, 8, 11, 12]]);

        $this->assertSame([4, 8, 11, 12], $school->fresh()->holiday_months);
    }

    public function test_holiday_months_rejects_an_out_of_range_month(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);

        $response = $this->actingAs($admin)
            ->put('/monthly-fees/holiday-months', ['holiday_months' => [0, 13]]);

        $response->assertSessionHasErrors();
        $this->assertNull($school->fresh()->holiday_months);
    }

    public function test_holiday_months_can_be_cleared_back_to_an_empty_set(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['holiday_months' => [7, 8]]);
        $admin = $this->makeAdmin($school);

        $this->actingAs($admin)->put('/monthly-fees/holiday-months', ['holiday_months' => []]);

        $this->assertSame([], $school->fresh()->holiday_months);
    }

    public function test_index_exposes_the_schools_current_holiday_months(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['holiday_months' => [7, 8]]);
        $admin = $this->makeAdmin($school);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('holidayMonths', [7, 8]));
    }

    public function test_index_exposes_an_empty_array_when_no_holiday_months_are_configured(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(); // holiday_months left null
        $admin = $this->makeAdmin($school);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('holidayMonths', []));
    }

    public function test_termly_school_gets_404_on_the_holiday_months_route(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'termly']);
        $admin = $this->makeAdmin($school);

        $response = $this->actingAs($admin)
            ->put('/monthly-fees/holiday-months', ['holiday_months' => [7, 8]]);

        $response->assertNotFound();
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeHolidayMonthsControllerTest.php`
Expected: FAIL — the route doesn't exist yet (404 on the PUT, and `index()` doesn't expose `holidayMonths` yet).

- [ ] **Step 3: Add the controller action**

In `app/Http/Controllers/MonthlyFeeController.php`, add `use App\Models\School;` to the imports (alongside the existing `Guardian`, `MonthlyFeeEntry`, `MonthlyFeeSetting` imports, alphabetically). Add this new method, placed after `applyCredit()` (find that method first to place this consistently with the rest of the file's method ordering — if you can't find an `applyCredit()` method, place this new method immediately before `openNextMonth()` instead):

```php
    public function updateHolidayMonths(Request $request)
    {
        $validated = $request->validate([
            'holiday_months' => ['required', 'array'],
            'holiday_months.*' => ['integer', 'between:1,12'],
        ]);

        $school = School::findOrFail($request->user()->school_id);
        $school->update(['holiday_months' => $validated['holiday_months']]);

        return back()->with('success', 'Holiday months updated.');
    }
```

- [ ] **Step 4: Expose `holidayMonths` from `index()`**

In the same file's `index()` method, find the `return Inertia::render('Fees/MonthlyFees/Index', [...])` call. Add one new line to the props array, anywhere after `'arrearsActivity' => $arrearsActivity,` (the last line before the closing `]);`):

```php
            'arrearsActivity' => $arrearsActivity,
            'holidayMonths' => School::find($schoolId)?->holiday_months ?? [],
        ]);
```

- [ ] **Step 5: Add the route**

In `routes/web.php`, find the `fee-module:monthly` group inside the admin fee route block (it contains `monthly-fees.index`, `monthly-fees.open-next-month`, etc. — the exact same group Task 2 of the fee-module-toggle plan created). Add this line inside that group, alongside the other `monthly-fees.*` routes:

```php
            Route::put('/monthly-fees/holiday-months', [MonthlyFeeController::class, 'updateHolidayMonths'])->name('monthly-fees.update-holiday-months');
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeHolidayMonthsControllerTest.php`
Expected: PASS, 7 tests.

- [ ] **Step 7: Run the full monthly-fee suite**

Run: `php8.4 artisan test --filter=MonthlyFee`
Expected: PASS, no regressions.

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/MonthlyFeeController.php routes/web.php tests/Feature/MonthlyFeeHolidayMonthsControllerTest.php
git commit -m "feat: add holiday-months controller action and route"
```

---

### Task 4: Frontend — Holiday Months settings control + ledger display

**Files:**
- Create: `resources/js/Components/MonthlyFees/HolidayMonthsModal.jsx`
- Modify: `resources/js/Pages/Fees/MonthlyFees/Index.jsx`

**Interfaces:**
- Consumes: `holidayMonths` prop (Task 3), route `monthly-fees.update-holiday-months` (Task 3), the `'holiday'` status value (Task 1).
- Produces: nothing consumed by a later task — this task is a leaf, verified live rather than by an automated frontend test (this repo has no frontend test suite).

- [ ] **Step 1: Create `HolidayMonthsModal.jsx`**

Create `resources/js/Components/MonthlyFees/HolidayMonthsModal.jsx`:

```jsx
import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const MONTHS = [
    { number: 1, label: 'January' }, { number: 2, label: 'February' }, { number: 3, label: 'March' },
    { number: 4, label: 'April' }, { number: 5, label: 'May' }, { number: 6, label: 'June' },
    { number: 7, label: 'July' }, { number: 8, label: 'August' }, { number: 9, label: 'September' },
    { number: 10, label: 'October' }, { number: 11, label: 'November' }, { number: 12, label: 'December' },
];

export default function HolidayMonthsModal({ show, onClose, holidayMonths }) {
    const [selected, setSelected] = useState(holidayMonths || []);
    const [processing, setProcessing] = useState(false);

    // Re-seed from the current prop every time the modal opens, so a
    // second open always starts from the school's real saved state rather
    // than whatever was left selected (but not saved) last time.
    useEffect(() => {
        if (show) {
            setSelected(holidayMonths || []);
        }
    }, [show]);

    const toggleMonth = (monthNumber) => {
        setSelected((prev) =>
            prev.includes(monthNumber) ? prev.filter((m) => m !== monthNumber) : [...prev, monthNumber].sort((a, b) => a - b)
        );
    };

    const submit = () => {
        setProcessing(true);
        router.put(
            '/monthly-fees/holiday-months',
            { holiday_months: selected },
            {
                preserveScroll: true,
                onSuccess: () => { setProcessing(false); onClose(); },
                onError: () => setProcessing(false),
            }
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900">Holiday Months</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Months you mark here are treated as fee-free every year — no fee is expected, no "needs fee" alert, and no
                    prepaid credit is spent against them. Guardians can still record a payment during a holiday month; it's
                    simply held as credit for the next real month.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                    {MONTHS.map((month) => (
                        <label
                            key={month.number}
                            className="flex items-center gap-2 rounded border border-gray-200 px-2.5 py-2 text-sm hover:bg-gray-50"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(month.number)}
                                onChange={() => toggleMonth(month.number)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-gray-700">{month.label}</span>
                        </label>
                    ))}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        Close
                    </button>
                    <button
                        onClick={submit}
                        disabled={processing}
                        className="rounded bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
```

- [ ] **Step 2: Wire the modal into `Index.jsx`**

In `resources/js/Pages/Fees/MonthlyFees/Index.jsx`, add the import alongside the existing `RecordPaymentModal` import:

```jsx
import RecordPaymentModal from '@/Components/MonthlyFees/RecordPaymentModal';
import HolidayMonthsModal from '@/Components/MonthlyFees/HolidayMonthsModal';
```

Add `holidayMonths` to the destructured props (find the component's prop list, currently starting `export default function MonthlyFeesIndex({ auth, year, month, ... })`, and add `holidayMonths` anywhere in that list).

Add a new state variable alongside the existing `recordPaymentGuardian` state:

```jsx
    const [showHolidayMonthsModal, setShowHolidayMonthsModal] = useState(false);
```

Find the Toolbar block's "Open next month →" button:

```jsx
                            <button
                                onClick={openNextMonth}
                                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                            >
                                Open next month &rarr;
                            </button>
```

Add a new button immediately before it (same flex row, so they sit side by side):

```jsx
                            <button
                                onClick={() => setShowHolidayMonthsModal(true)}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Holiday Months
                            </button>
                            <button
                                onClick={openNextMonth}
                                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                            >
                                Open next month &rarr;
                            </button>
```

Find where `<RecordPaymentModal ... />` is rendered near the end of the component (just before `</AuthenticatedLayout>`), and add the new modal right after it:

```jsx
            <RecordPaymentModal
                show={!!recordPaymentGuardian}
                guardian={recordPaymentGuardian}
                onClose={() => setRecordPaymentGuardian(null)}
            />

            <HolidayMonthsModal
                show={showHolidayMonthsModal}
                holidayMonths={holidayMonths}
                onClose={() => setShowHolidayMonthsModal(false)}
            />
```

(Read the file first to get the exact surrounding whitespace/closing-tag structure right — this must slot in as a sibling of `<RecordPaymentModal>`, both still inside whatever their shared parent element is.)

- [ ] **Step 3: Add `'holiday'` to `statusMeta` and `stripeColor`**

Find:

```jsx
    const statusMeta = (row) => {
        const map = {
            paid: { style: 'bg-green-100 text-green-700 border-green-200', label: row.outstanding_balance > 0 ? 'This month paid' : 'Paid' },
            partial: { style: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Partial' },
            unpaid: { style: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Unpaid' },
            needs_fee: { style: 'bg-red-100 text-red-700 border-red-200', label: 'Needs fee' },
        };
        return map[row.status];
    };

    const stripeColor = (status) => ({
        paid: 'border-l-green-500', partial: 'border-l-amber-500', unpaid: 'border-l-gray-300', needs_fee: 'border-l-red-500',
    }[status]);
```

Replace with (adding a `holiday` entry to both — a neutral blue, distinct from every other status's color, since nothing is wrong or owed):

```jsx
    const statusMeta = (row) => {
        const map = {
            paid: { style: 'bg-green-100 text-green-700 border-green-200', label: row.outstanding_balance > 0 ? 'This month paid' : 'Paid' },
            partial: { style: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Partial' },
            unpaid: { style: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Unpaid' },
            needs_fee: { style: 'bg-red-100 text-red-700 border-red-200', label: 'Needs fee' },
            holiday: { style: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Holiday' },
        };
        return map[row.status];
    };

    const stripeColor = (status) => ({
        paid: 'border-l-green-500', partial: 'border-l-amber-500', unpaid: 'border-l-gray-300', needs_fee: 'border-l-red-500', holiday: 'border-l-blue-400',
    }[status]);
```

(This is required, not cosmetic — the mobile card header renders `{row.status !== 'needs_fee' && <StatusBadge row={row} />}` unconditionally for every other status including `holiday`, and `StatusBadge` reads `meta.style`/`meta.label` directly — without this entry, a holiday row would crash the mobile view with a "cannot read properties of undefined" error.)

- [ ] **Step 4: Suppress the "Set fee" prompt on a holiday row in `ExpectedCell`**

Find:

```jsx
    const ExpectedCell = ({ row, align = 'end' }) => (
        <div className={`flex flex-col gap-1 ${align === 'end' ? 'items-end' : 'items-start'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5">
                {isOpenMonth && editingExpected === row.guardian_id ? (
                    <InlineAmountEditor initial={row.expected_amount} onSave={(value) => saveExpected(row.guardian_id, value)} />
                ) : row.expected_amount ? (
                    <>
                        <span className="font-mono text-sm font-semibold text-gray-900">{fmt(row.expected_amount)}</span>
                        {isOpenMonth && (
                            <button onClick={() => setEditingExpected(row.guardian_id)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600" title="Edit expected fee">
                                <Pencil className="h-4 w-4" />
                            </button>
                        )}
                    </>
                ) : isOpenMonth ? (
                    <button
                        onClick={() => setEditingExpected(row.guardian_id)}
                        className="rounded border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:border-red-400 hover:bg-red-100"
                    >
                        Set fee
                    </button>
                ) : (
                    <span className="text-gray-400">&mdash;</span>
                )}
            </div>
```

Replace the opening of that `<div className="flex items-center gap-1.5">` block with a new first branch for the holiday case (everything else — the `outstanding_balance`/`credit_balance` blocks below this one — stays exactly as-is, untouched):

```jsx
    const ExpectedCell = ({ row, align = 'end' }) => (
        <div className={`flex flex-col gap-1 ${align === 'end' ? 'items-end' : 'items-start'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5">
                {row.status === 'holiday' ? (
                    <span className="text-xs font-semibold text-blue-600">On holiday — no fee</span>
                ) : isOpenMonth && editingExpected === row.guardian_id ? (
                    <InlineAmountEditor initial={row.expected_amount} onSave={(value) => saveExpected(row.guardian_id, value)} />
                ) : row.expected_amount ? (
                    <>
                        <span className="font-mono text-sm font-semibold text-gray-900">{fmt(row.expected_amount)}</span>
                        {isOpenMonth && (
                            <button onClick={() => setEditingExpected(row.guardian_id)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600" title="Edit expected fee">
                                <Pencil className="h-4 w-4" />
                            </button>
                        )}
                    </>
                ) : isOpenMonth ? (
                    <button
                        onClick={() => setEditingExpected(row.guardian_id)}
                        className="rounded border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:border-red-400 hover:bg-red-100"
                    >
                        Set fee
                    </button>
                ) : (
                    <span className="text-gray-400">&mdash;</span>
                )}
            </div>
```

- [ ] **Step 5: Build the frontend**

Run: `pnpm run build`
Expected: builds cleanly, no errors.

- [ ] **Step 6: Verify live in a browser**

Log in as an admin at a `fee_module: 'monthly'` school (switch a demo school via `php8.4 artisan tinker --execute="App\Models\School::find(1)->update(['fee_module' => 'monthly']);"` if needed — restore it to `'termly'` afterward if it's shared demo data). Confirm:
- The "Holiday Months" button opens the modal, showing 12 unchecked checkboxes initially.
- Checking July and August (non-contiguous is not required to test, but if you want extra confidence, check April + August + November + December instead and confirm all four save correctly) and clicking Save persists and closes the modal.
- Reopening the modal shows the previously-saved months still checked.
- Use `php8.4 artisan tinker` to directly set `holiday_months` on the school and advance the ledger into one of those months (e.g. via repeated "Open next month" clicks, or directly creating an entry) — confirm the resulting row shows a blue "Holiday" badge, "On holiday — no fee" in the Expected column, no "Set fee" prompt, and the green "Record Payment" plus button is still present and clickable.
- Confirm the mobile card view (resize to ~390px width) renders the holiday row without any console error (this is the specific crash risk Step 3 exists to prevent).

- [ ] **Step 7: Commit**

```bash
git add resources/js/Components/MonthlyFees/HolidayMonthsModal.jsx resources/js/Pages/Fees/MonthlyFees/Index.jsx
git commit -m "feat: add Holiday Months settings control and holiday-status display to the Monthly Fees ledger"
```

---

### Task 5: Final whole-branch review and full suite regression check

**Files:** none (verification only).

- [ ] **Step 1: Run the entire test suite**

Run: `php8.4 artisan test`
Expected: PASS — all pre-existing tests plus every test added across Tasks 1-3, all green, 0 failures.

- [ ] **Step 2: Run Pint on every file this plan touched**

Run: `./vendor/bin/pint app/Models/School.php app/Models/MonthlyFeeEntry.php app/Services/MonthlyFeeLedgerService.php app/Http/Controllers/MonthlyFeeController.php routes/web.php tests/Feature/MonthlyFeeHolidayColumnsTest.php tests/Feature/MonthlyFeeLedgerServiceTest.php tests/Feature/MonthlyFeeHolidayMonthsControllerTest.php`
Expected: PASS, no style violations. If Pint reports changes to `routes/web.php`, `School.php`, or any other file with known pre-existing style debt from unrelated code, inspect the diff before committing anything — if the flagged lines are outside this plan's own additions (pre-existing whole-file formatting drift), revert them rather than committing an unrelated reformat, matching the precedent already established in this branch's history. If the flagged lines are genuinely part of this plan's own new code, keep the fix.

- [ ] **Step 3: If anything unrelated broke, stop and investigate before continuing**

Do not proceed to `finishing-a-development-branch` with a red suite.

---
