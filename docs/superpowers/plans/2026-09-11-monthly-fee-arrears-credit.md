# Monthly Fee Arrears, Prepayment/Credit, and Cash-Accurate Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin record one lump payment that automatically settles a guardian's oldest unpaid months first, then the current month, with any leftover held as reserve credit for future months — replacing the impractical "browse back to each unpaid month" workflow — while keeping "Collected this period" a true cash-basis figure that's never inflated by credit quietly settling a later bill with money received earlier.

**Architecture:** One new append-only cash-receipt log table (`monthly_fee_payments`), one new column on the existing settings table (`credit_balance`, a per-guardian reserve), one new column on the existing entries table (`credit_applied`, tracking how much of a settled entry came from credit vs. real cash — this is what keeps Undo correct once credit and cash can both touch the same row), a consolidated addition to the existing `MonthlyFeeLedgerService` (kept as one task deliberately — these methods share locking/bookkeeping logic that must stay internally consistent), controller wiring, and two frontend passes (analytics/drill-down, then the Record Payment modal and visual treatment).

**Tech Stack:** Laravel 12 (PHP 8.4 — this machine's default `php` is 8.5 and is missing `pdo_sqlite`; use `php8.4` for every artisan/composer command below), PHPUnit-style test classes extending `Tests\TestCase` with explicit `use RefreshDatabase;` (the house convention in this exact module — `tests/Pest.php`'s `uses()->in('Feature')` binding only auto-applies to Pest-closure syntax, not hand-written classes; every existing `MonthlyFee*Test.php` file already adds the trait explicitly), Inertia.js + React 18, Tailwind CSS, `lucide-react` icons, `@headlessui/react` (already used by `Modal.jsx`).

**Spec:** `/home/abdiwadud/.claude/plans/steady-dreaming-fountain.md` — read it in full; it is the complete, four-times-reviewed design this plan implements. This plan does not re-derive or re-litigate anything in it; every task below cites the exact spec section it implements.

## Global Constraints

- Every `credit_balance`/entry read-modify-write (`recordPayment`, `syncMonth()`'s credit-consumption step, `undoPaid()`'s credit-refund path, `applyCreditToArrears`) runs inside `DB::transaction()` with `lockForUpdate()` on the guardian's `MonthlyFeeSetting` row, covering the **entire** operation including any entry it creates — not just the `credit_balance` touch (spec §3 "Concurrency", round-2 fix #3, round-3 fix #6).
- The ledger-service layer (`recordPayment()`, `syncMonth()`'s credit step, `applyCreditToArrears()`, `undoPaid()`) is implemented as **one consolidated task (Task 2)** — never split across parallel implementers. These methods share the `credit_applied`/locking logic and must stay internally consistent; this is exactly the kind of cross-method interaction that produced the spec's round-3 and round-4 findings (spec §4d).
- `applied_to_arrears + applied_to_current_month + applied_to_credit` always sums to a `monthly_fee_payments` row's `amount` (spec §2).
- A correction is always a **new** row with negative amounts — the original log entry is never mutated or deleted (spec §2, round-2 fix #4).
- `recorded_by` on `monthly_fee_entries` is informational only ("who last touched this row" / null for fully-automatic) — never load-bearing for any decision. `credit_applied` is the only field that decides how `undoPaid()` splits its refund/correction (spec §4b fix #2, spec §4c).
- The three new analytics methods (and `arrearsActivityForSchool()`'s period bucketing) are bounded by **the ledger's own open period** (from when an abstract month first opened until the next one did, or now) — never a strict calendar-month box (spec §4b fix #4, confirmed with the user directly).
- Every `credit_balance`/`credit_applied` write path defensively `updateOrCreate`s/creates what it needs rather than assuming a row already exists (spec §4b fix #1, round-2 fix #2).
- No new permissions, no new payment-integration code (M-Pesa/Paystack), no per-child fee breakdown — same boundaries the base module already established.
- All commands below assume the working directory is this worktree (`.claude/worktrees/feature+monthly-fee-collection`) on branch `worktree-feature+monthly-fee-collection`.

---

### Task 1: Migrations + models — `monthly_fee_payments`, `credit_balance`, `credit_applied`

**Files:**
- Create: `database/migrations/2026_09_11_000001_create_monthly_fee_payments_table.php`
- Create: `database/migrations/2026_09_11_000002_add_credit_balance_to_monthly_fee_settings_table.php`
- Create: `database/migrations/2026_09_11_000003_add_credit_applied_to_monthly_fee_entries_table.php`
- Create: `app/Models/MonthlyFeePayment.php`
- Modify: `app/Models/MonthlyFeeSetting.php` (add `credit_balance` to fillable/casts)
- Modify: `app/Models/MonthlyFeeEntry.php` (add `credit_applied` to fillable/casts)
- Modify: `app/Models/Guardian.php` (add `monthlyFeePayments()` relationship)
- Test: `tests/Feature/MonthlyFeePaymentTest.php`

**Interfaces:**
- Produces: `MonthlyFeePayment` model (fillable: `school_id`, `guardian_id`, `amount`, `applied_to_arrears`, `applied_to_current_month`, `applied_to_credit`, `received_at`, `recorded_by`, `corrects_entry_id`, `notes`), `MonthlyFeeSetting::$credit_balance` (decimal, default 0), `MonthlyFeeEntry::$credit_applied` (decimal, default 0), `Guardian::monthlyFeePayments()` (hasMany).

- [ ] **Step 1: Write the migrations**

`database/migrations/2026_09_11_000001_create_monthly_fee_payments_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_fee_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('guardian_id')->constrained('guardians')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->decimal('applied_to_arrears', 10, 2)->default(0);
            $table->decimal('applied_to_current_month', 10, 2)->default(0);
            $table->decimal('applied_to_credit', 10, 2)->default(0);
            $table->date('received_at');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('corrects_entry_id')->nullable()->constrained('monthly_fee_entries')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'guardian_id']);
            $table->index(['school_id', 'received_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_fee_payments');
    }
};
```

`database/migrations/2026_09_11_000002_add_credit_balance_to_monthly_fee_settings_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monthly_fee_settings', function (Blueprint $table) {
            $table->decimal('credit_balance', 10, 2)->default(0)->after('expected_fee');
        });
    }

    public function down(): void
    {
        Schema::table('monthly_fee_settings', function (Blueprint $table) {
            $table->dropColumn('credit_balance');
        });
    }
};
```

`database/migrations/2026_09_11_000003_add_credit_applied_to_monthly_fee_entries_table.php`:

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
            $table->decimal('credit_applied', 10, 2)->default(0)->after('amount_collected');
        });
    }

    public function down(): void
    {
        Schema::table('monthly_fee_entries', function (Blueprint $table) {
            $table->dropColumn('credit_applied');
        });
    }
};
```

- [ ] **Step 2: Run the migrations**

Run: `php8.4 artisan migrate`
Expected: all three migrations run, no errors.

- [ ] **Step 3: Write the `MonthlyFeePayment` model**

`app/Models/MonthlyFeePayment.php`:

```php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyFeePayment extends Model
{
    use BelongsToSchool, HasFactory;

    protected $fillable = [
        'school_id',
        'guardian_id',
        'amount',
        'applied_to_arrears',
        'applied_to_current_month',
        'applied_to_credit',
        'received_at',
        'recorded_by',
        'corrects_entry_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'applied_to_arrears' => 'decimal:2',
            'applied_to_current_month' => 'decimal:2',
            'applied_to_credit' => 'decimal:2',
            'received_at' => 'date',
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

    public function correctsEntry()
    {
        return $this->belongsTo(MonthlyFeeEntry::class, 'corrects_entry_id');
    }
}
```

- [ ] **Step 4: Add `credit_balance` to `MonthlyFeeSetting`**

In `app/Models/MonthlyFeeSetting.php`, update the fillable array and casts:

```php
    protected $fillable = [
        'school_id',
        'guardian_id',
        'expected_fee',
        'credit_balance',
        'updated_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'expected_fee' => 'decimal:2',
            'credit_balance' => 'decimal:2',
        ];
    }
```

- [ ] **Step 5: Add `credit_applied` to `MonthlyFeeEntry`**

In `app/Models/MonthlyFeeEntry.php`, update the fillable array and casts:

```php
    protected $fillable = [
        'school_id',
        'guardian_id',
        'year',
        'month',
        'expected_amount',
        'amount_collected',
        'credit_applied',
        'paid_date',
        'recorded_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'expected_amount' => 'decimal:2',
            'amount_collected' => 'decimal:2',
            'credit_applied' => 'decimal:2',
            'paid_date' => 'date',
        ];
    }
```

Leave `getStatusAttribute()` untouched — status still derives purely from `expected_amount`/`amount_collected`, unaffected by the credit/cash split underneath.

- [ ] **Step 6: Add `Guardian::monthlyFeePayments()`**

In `app/Models/Guardian.php`, add next to the existing `monthlyFeeSetting()`/`monthlyFeeEntries()` methods:

```php
    public function monthlyFeePayments()
    {
        return $this->hasMany(MonthlyFeePayment::class);
    }
```

- [ ] **Step 7: Write the failing model tests**

`tests/Feature/MonthlyFeePaymentTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\MonthlyFeePayment;
use App\Models\MonthlyFeeSetting;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonthlyFeePaymentTest extends TestCase
{
    use RefreshDatabase;

    private function makeGuardian(School $school): Guardian
    {
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);

        return Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $user->id]);
    }

    public function test_a_payment_row_can_be_created_with_the_full_breakdown(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardian($school);

        $payment = MonthlyFeePayment::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'amount' => 48000,
            'applied_to_arrears' => 0,
            'applied_to_current_month' => 16000,
            'applied_to_credit' => 32000,
            'received_at' => '2026-09-11',
        ]);

        $this->assertSame('48000.00', $payment->amount);
        $this->assertSame('32000.00', $payment->applied_to_credit);
        $this->assertSame('2026-09-11', $payment->received_at->format('Y-m-d'));
    }

    public function test_a_correction_row_references_the_entry_it_corrects(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardian($school);
        $entry = MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 9, 'expected_amount' => 16000, 'amount_collected' => 16000,
        ]);

        $correction = MonthlyFeePayment::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'amount' => -16000,
            'applied_to_current_month' => -16000,
            'received_at' => now()->toDateString(),
            'corrects_entry_id' => $entry->id,
        ]);

        $this->assertSame($entry->id, $correction->correctsEntry->id);
    }

    public function test_monthly_fee_setting_defaults_credit_balance_to_zero(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardian($school);

        $setting = MonthlyFeeSetting::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'expected_fee' => 8000,
        ]);

        $this->assertSame('0.00', $setting->credit_balance);
    }

    public function test_monthly_fee_entry_defaults_credit_applied_to_zero(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardian($school);

        $entry = MonthlyFeeEntry::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'year' => 2026,
            'month' => 9,
            'expected_amount' => 8000,
        ]);

        $this->assertSame('0.00', $entry->credit_applied);
    }
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeePaymentTest.php`
Expected: PASS, 4 tests.

- [ ] **Step 9: Commit**

```bash
git add database/migrations/2026_09_11_000001_create_monthly_fee_payments_table.php \
        database/migrations/2026_09_11_000002_add_credit_balance_to_monthly_fee_settings_table.php \
        database/migrations/2026_09_11_000003_add_credit_applied_to_monthly_fee_entries_table.php \
        app/Models/MonthlyFeePayment.php app/Models/MonthlyFeeSetting.php app/Models/MonthlyFeeEntry.php \
        app/Models/Guardian.php tests/Feature/MonthlyFeePaymentTest.php
git commit -m "feat: add monthly_fee_payments table, credit_balance, and credit_applied"
```

---

### Task 2: The ledger-service layer — `recordPayment`, credit consumption, `undoPaid`, `applyCreditToArrears`, analytics

**This is deliberately one consolidated task — do not split it.** Every method below shares the `credit_applied`/locking bookkeeping and must stay internally consistent (spec §4d).

**Files:**
- Modify: `app/Services/MonthlyFeeLedgerService.php`
- Test: `tests/Feature/MonthlyFeeLedgerServiceTest.php` (extend the existing file — do not remove any of its current 10 tests)

**Interfaces:**
- Consumes: `MonthlyFeeEntry`, `MonthlyFeeSetting`, `MonthlyFeePayment` (Task 1), the existing `beforeMonth()` private helper.
- Produces: `recordPayment(int $guardianId, float $amountReceived, int $recordedBy, ?string $receivedAt = null, ?string $notes = null): array`, `applyCreditToArrears(int $guardianId, int $recordedBy): array`, `collectedThisPeriod(int $schoolId, int $year, int $month): float`, `arrearsCollectedThisPeriod(int $schoolId, int $year, int $month): float`, `creditRecognizedThisPeriod(int $schoolId, int $year, int $month): float`, `arrearsActivityForSchool(int $schoolId, int $year, int $month): \Illuminate\Support\Collection`, plus changes to the existing `syncMonth()` (credit consumption) and a new `refundCredit(MonthlyFeeEntry $entry, int $recordedBy): void` helper used by `undoPaid()` (Task 3 wires `undoPaid()` in the controller — this task only adds the service-layer piece it needs). Task 3's controller depends on exactly these method names/signatures.

- [ ] **Step 1: Write the failing tests for `recordPayment()` — the core allocation algorithm**

First, add one import to `tests/Feature/MonthlyFeeLedgerServiceTest.php` — every test appended across this task references `MonthlyFeePayment` directly (bare, unqualified), but the file's existing `use` block doesn't have it yet. Add this line alongside the existing `use App\Models\MonthlyFeeSetting;` import:

```php
use App\Models\MonthlyFeePayment;
```

Then append the following to the same file (inside the existing class, after `test_outstanding_balances_for_school_computes_every_guardian_in_one_pass`):

```php
    public function test_record_payment_settles_multiple_old_months_oldest_first_then_current_month_then_credit(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);

        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 3, 'expected_amount' => 16000,
        ]);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 4, 'expected_amount' => 16000,
        ]);
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);
        $current = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 9)->first();

        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $result = (new MonthlyFeeLedgerService)->recordPayment($guardian->id, 48000, $admin->id);

        $march = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 3)->first();
        $april = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 4)->first();
        $this->assertSame('16000.00', $march->fresh()->amount_collected);
        $this->assertSame('16000.00', $april->fresh()->amount_collected);
        $this->assertSame('16000.00', $current->fresh()->amount_collected);
        $this->assertSame('0.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
        $this->assertSame(32000.0, $result['total_arrears_cleared']);

        $payment = MonthlyFeePayment::where('guardian_id', $guardian->id)->first();
        $this->assertSame('48000.00', $payment->amount);
        $this->assertSame('32000.00', $payment->applied_to_arrears);
        $this->assertSame('16000.00', $payment->applied_to_current_month);
        $this->assertSame('0.00', $payment->applied_to_credit);
    }

    public function test_record_payment_puts_leftover_beyond_the_current_month_into_credit_balance(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        (new MonthlyFeeLedgerService)->recordPayment($guardian->id, 48000, $admin->id);

        $this->assertSame('32000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
        $payment = MonthlyFeePayment::where('guardian_id', $guardian->id)->first();
        $this->assertSame('16000.00', $payment->applied_to_current_month);
        $this->assertSame('32000.00', $payment->applied_to_credit);
    }

    public function test_record_payment_on_a_month_already_partially_paid_only_absorbs_the_remaining_shortfall(): void
    {
        // Round-2 fix #1's exact regression: 5,000 already paid on a 16,000
        // bill must only be able to absorb 11,000 more, not another 16,000.
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);
        $current = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $current->update(['amount_collected' => 5000]);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        (new MonthlyFeeLedgerService)->recordPayment($guardian->id, 20000, $admin->id);

        $this->assertSame('16000.00', $current->fresh()->amount_collected);
        $this->assertSame('9000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
    }

    public function test_record_payment_creates_the_current_month_entry_if_it_does_not_exist_yet(): void
    {
        // Round-2 fix #2: recordPayment must not assume the caller already
        // synced the open month.
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $this->assertSame(0, MonthlyFeeEntry::count());

        (new MonthlyFeeLedgerService)->recordPayment($guardian->id, 16000, $admin->id);

        $this->assertSame(1, MonthlyFeeEntry::count());
        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $this->assertSame('16000.00', $entry->amount_collected);
    }

    public function test_record_payment_creates_the_guardians_settings_row_if_it_does_not_exist_yet(): void
    {
        // Round-3 fix #1: a guardian who's never had a fee set has no
        // MonthlyFeeSetting row — crediting them must not silently lose money.
        $school = School::factory()->create();
        $user = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $user->id, 'status' => 'active']);
        Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id, 'status' => 'active']);
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9); // expected_amount stays 0, no setting row
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $this->assertNull($guardian->monthlyFeeSetting);

        (new MonthlyFeeLedgerService)->recordPayment($guardian->id, 16000, $admin->id);

        $this->assertSame('16000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
    }

    public function test_record_payment_honors_a_custom_received_at_date(): void
    {
        // Round-2 fix #6: the cash-received date must be editable, not
        // silently forced to today.
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        (new MonthlyFeeLedgerService)->recordPayment($guardian->id, 16000, $admin->id, receivedAt: '2026-08-28');

        $payment = MonthlyFeePayment::where('guardian_id', $guardian->id)->first();
        $this->assertSame('2026-08-28', $payment->received_at->format('Y-m-d'));
    }
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: FAIL — `Call to undefined method MonthlyFeeLedgerService::recordPayment()`.

- [ ] **Step 3: Write `logCashReceived()` and `recordPayment()`**

In `app/Services/MonthlyFeeLedgerService.php`, add the imports and these two methods (place after `syncMonth()`):

```php
use App\Models\MonthlyFeePayment;
use Illuminate\Support\Facades\DB;
```

```php
    /**
     * Appends one row to the append-only cash-receipt log. Never called for
     * credit auto-consumption (syncMonth's credit step, applyCreditToArrears)
     * — only when real cash actually changes hands. The three "applied_to_*"
     * amounts must sum to $amount.
     */
    private function logCashReceived(
        int $schoolId,
        int $guardianId,
        float $amount,
        float $appliedToArrears,
        float $appliedToCurrentMonth,
        float $appliedToCredit,
        int $recordedBy,
        ?string $receivedAt = null,
        ?string $notes = null,
        ?int $correctsEntryId = null,
    ): MonthlyFeePayment {
        return MonthlyFeePayment::create([
            'school_id' => $schoolId,
            'guardian_id' => $guardianId,
            'amount' => $amount,
            'applied_to_arrears' => $appliedToArrears,
            'applied_to_current_month' => $appliedToCurrentMonth,
            'applied_to_credit' => $appliedToCredit,
            'received_at' => $receivedAt ?? now()->toDateString(),
            'recorded_by' => $recordedBy,
            'corrects_entry_id' => $correctsEntryId,
            'notes' => $notes,
        ]);
    }

    /**
     * The primary way money gets collected (spec §3). Always resolves the
     * school's currently-open month internally — never trusts a caller's
     * idea of which month is "current" — and settles, in order: (1) this
     * guardian's unpaid/partial months strictly before the open month,
     * oldest first, each capped at its own remaining shortfall; (2) the open
     * month's own entry, same remaining-shortfall logic, created first if it
     * doesn't exist yet; (3) anything left over becomes reserve credit.
     * Runs inside one locked transaction end to end (round-2 fix #3, round-3
     * fix #6) so a concurrent write to the same guardian's credit_balance or
     * a double-submit racing on the current-month entry's unique constraint
     * can't silently clobber this.
     *
     * @return array{
     *     guardian_id: int, amount_received: float,
     *     applied_to_arrears: array<int, array{entry_id:int, year:int, month:int, applied:float, fully_cleared:bool}>,
     *     applied_to_current_month: ?array{entry_id:int, year:int, month:int, applied:float, fully_cleared:bool},
     *     total_arrears_cleared: float, applied_to_credit: float, new_credit_balance: float,
     * }
     */
    public function recordPayment(
        int $guardianId,
        float $amountReceived,
        int $recordedBy,
        ?string $receivedAt = null,
        ?string $notes = null,
    ): array {
        $guardian = Guardian::findOrFail($guardianId);
        $schoolId = $guardian->school_id;

        return DB::transaction(function () use ($guardian, $guardianId, $schoolId, $amountReceived, $recordedBy, $receivedAt, $notes) {
            $setting = MonthlyFeeSetting::lockForUpdate()->where('guardian_id', $guardianId)->first()
                ?? MonthlyFeeSetting::create(['school_id' => $schoolId, 'guardian_id' => $guardianId, 'expected_fee' => 0]);

            $latest = $this->latestMonth($schoolId);
            $remaining = $amountReceived;
            $arrearsBreakdown = [];
            $arrearsTotal = 0.0;

            $arrearsEntries = MonthlyFeeEntry::where('guardian_id', $guardianId)
                ->where(fn ($query) => $this->beforeMonth($query, $latest['year'], $latest['month']))
                ->whereRaw('COALESCE(amount_collected, 0) < expected_amount')
                ->orderBy('year')->orderBy('month')
                ->lockForUpdate()
                ->get();

            foreach ($arrearsEntries as $entry) {
                if ($remaining <= 0) {
                    break;
                }

                $shortfall = (float) $entry->expected_amount - (float) ($entry->amount_collected ?? 0);
                $applied = min($remaining, $shortfall);

                $entry->update([
                    'amount_collected' => (float) ($entry->amount_collected ?? 0) + $applied,
                    'paid_date' => $receivedAt ?? now()->toDateString(),
                    'recorded_by' => $recordedBy,
                ]);

                $arrearsBreakdown[] = [
                    'entry_id' => $entry->id, 'year' => $entry->year, 'month' => $entry->month,
                    'applied' => $applied, 'fully_cleared' => $applied === $shortfall,
                ];
                $arrearsTotal += $applied;
                $remaining -= $applied;
            }

            $currentEntry = MonthlyFeeEntry::lockForUpdate()->firstOrCreate(
                ['guardian_id' => $guardianId, 'year' => $latest['year'], 'month' => $latest['month']],
                ['school_id' => $schoolId, 'expected_amount' => $setting->expected_fee]
            );

            $appliedToCurrentMonth = 0.0;
            $currentBreakdown = null;

            if ($remaining > 0) {
                $shortfall = (float) $currentEntry->expected_amount - (float) ($currentEntry->amount_collected ?? 0);
                $appliedToCurrentMonth = max(0.0, min($remaining, $shortfall));

                if ($appliedToCurrentMonth > 0) {
                    $currentEntry->update([
                        'amount_collected' => (float) ($currentEntry->amount_collected ?? 0) + $appliedToCurrentMonth,
                        'paid_date' => $receivedAt ?? now()->toDateString(),
                        'recorded_by' => $recordedBy,
                    ]);
                    $remaining -= $appliedToCurrentMonth;
                }

                $currentBreakdown = [
                    'entry_id' => $currentEntry->id, 'year' => $currentEntry->year, 'month' => $currentEntry->month,
                    'applied' => $appliedToCurrentMonth, 'fully_cleared' => $appliedToCurrentMonth === $shortfall,
                ];
            }

            $appliedToCredit = max(0.0, $remaining);
            if ($appliedToCredit > 0) {
                $setting->increment('credit_balance', $appliedToCredit);
            }

            $this->logCashReceived(
                $schoolId, $guardianId, $amountReceived,
                $arrearsTotal, $appliedToCurrentMonth, $appliedToCredit,
                $recordedBy, $receivedAt, $notes
            );

            return [
                'guardian_id' => $guardianId,
                'amount_received' => $amountReceived,
                'applied_to_arrears' => $arrearsBreakdown,
                'applied_to_current_month' => $currentBreakdown,
                'total_arrears_cleared' => $arrearsTotal,
                'applied_to_credit' => $appliedToCredit,
                'new_credit_balance' => (float) $setting->fresh()->credit_balance,
            ];
        });
    }
```

- [ ] **Step 4: Run the `recordPayment()` tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: PASS, 16 tests (the 10 existing plus the 6 just added).

- [ ] **Step 5: Commit**

```bash
git add app/Services/MonthlyFeeLedgerService.php tests/Feature/MonthlyFeeLedgerServiceTest.php
git commit -m "feat: add MonthlyFeeLedgerService::recordPayment with oldest-first allocation"
```

- [ ] **Step 6: Write the failing tests for `syncMonth()`'s credit consumption**

Append to `tests/Feature/MonthlyFeeLedgerServiceTest.php`:

```php
    public function test_sync_consumes_credit_against_the_guardians_rate_at_the_moment_the_month_opens(): void
    {
        // The spec §1 worked example, reproduced exactly: rate changes
        // between the payment and the month opening, and the entry must
        // price against the NEW rate, not the one active at payment time.
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $service->recordPayment($guardian->id, 48000, $admin->id);
        $this->assertSame('32000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);

        // Rate changes: a third child enrolls.
        $guardian->monthlyFeeSetting->update(['expected_fee' => 24000]);

        $service->syncMonth($school->id, 2026, 10);
        $october = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 10)->first();
        $this->assertSame('24000.00', $october->expected_amount);
        $this->assertSame('24000.00', $october->amount_collected);
        $this->assertSame('24000.00', $october->credit_applied);
        $this->assertSame('paid', $october->status);
        $this->assertSame('8000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);

        $service->syncMonth($school->id, 2026, 11);
        $november = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 11)->first();
        $this->assertSame('24000.00', $november->expected_amount);
        $this->assertSame('8000.00', $november->amount_collected);
        $this->assertSame('8000.00', $november->credit_applied);
        $this->assertSame('partial', $november->status);
        $this->assertSame('0.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
    }

    public function test_sync_credit_consumption_sets_recorded_by_null_and_never_logs_a_payment_row(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $service->recordPayment($guardian->id, 32000, $admin->id); // 16000 current + 16000 credit

        $this->assertSame(1, MonthlyFeePayment::count());

        $service->syncMonth($school->id, 2026, 10);

        $october = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 10)->first();
        $this->assertNull($october->recorded_by);
        $this->assertSame(1, MonthlyFeePayment::count()); // unchanged — no new cash was received
    }
```

- [ ] **Step 7: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: FAIL — the October entry's `credit_applied`/`amount_collected` won't reflect credit consumption yet.

- [ ] **Step 8: Update `syncMonth()` to consume credit on entry creation**

In `app/Services/MonthlyFeeLedgerService.php`, replace the `foreach` loop inside `syncMonth()`:

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

- [ ] **Step 9: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: PASS, 18 tests.

- [ ] **Step 10: Commit**

```bash
git add app/Services/MonthlyFeeLedgerService.php tests/Feature/MonthlyFeeLedgerServiceTest.php
git commit -m "feat: consume reserve credit against the guardian's rate when a month opens"
```

- [ ] **Step 11: Write the failing tests for `refundCredit()` and the mixed-funding regression**

Append to `tests/Feature/MonthlyFeeLedgerServiceTest.php`:

```php
    public function test_refund_credit_returns_the_entrys_credit_applied_amount_to_the_guardians_balance(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $service->recordPayment($guardian->id, 32000, $admin->id); // 16000 current + 16000 credit
        $service->syncMonth($school->id, 2026, 10); // fully credit-settled

        $october = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 10)->first();
        $this->assertSame('16000.00', $october->credit_applied);
        $this->assertSame('0.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);

        $service->refundCredit($october, $admin->id);

        $this->assertSame('16000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
    }

    public function test_the_mixed_funding_regression_from_round_3_refunds_only_the_credit_portion_on_undo(): void
    {
        // The exact scenario round 3 found: an entry partially credit-settled,
        // then topped up with real cash, must split correctly on undo instead
        // of treating the whole amount as one or the other.
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $service->recordPayment($guardian->id, 8000, $admin->id); // partial cash on current month, no credit yet

        // Simulate a prior 8,000 credit consumption on this same entry (as
        // syncMonth would have done had credit existed before recordPayment ran).
        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $entry->update(['credit_applied' => 8000]); // entry now: 16000 collected total (8000 cash + 8000 credit)
        $entry->update(['amount_collected' => 16000]);

        $service->refundCredit($entry, $admin->id);
        $this->assertSame('8000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
        // The remaining 8,000 (real cash) is NOT refunded as credit — it stays
        // as the entry's own record until a separate cash correction is logged
        // (Task 3's undoPaid() wires that half; this service method's job
        // ends at "give back whatever was credit").
    }
```

- [ ] **Step 12: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: FAIL — `Call to undefined method MonthlyFeeLedgerService::refundCredit()`.

- [ ] **Step 13: Write `refundCredit()`**

In `app/Services/MonthlyFeeLedgerService.php`, add after `recordPayment()`:

```php
    /**
     * Returns however much of $entry's amount_collected was credit-funded
     * back to the guardian's credit_balance — used by undoPaid() (Task 3),
     * which separately handles the cash portion (if any) via a negative
     * monthly_fee_payments correction. Locked the same way every other
     * credit_balance write is.
     */
    public function refundCredit(MonthlyFeeEntry $entry, int $recordedBy): void
    {
        $creditPortion = (float) $entry->credit_applied;

        if ($creditPortion <= 0) {
            return;
        }

        DB::transaction(function () use ($entry, $creditPortion) {
            $setting = MonthlyFeeSetting::lockForUpdate()->where('guardian_id', $entry->guardian_id)->first()
                ?? MonthlyFeeSetting::create(['school_id' => $entry->school_id, 'guardian_id' => $entry->guardian_id, 'expected_fee' => 0]);

            $setting->increment('credit_balance', $creditPortion);
        });
    }
```

- [ ] **Step 14: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: PASS, 20 tests.

- [ ] **Step 14a: Write the failing test for `recordManualCashChange()`**

**Ruling (found during pre-flight review, before this task was dispatched):** the spec text says the existing manual tools (`markPaid`, `updateCollected` — controller methods) call `logCashReceived()` to log cash, but `logCashReceived()` is `private` on the service — controller code cannot call it directly. This method is the fix: a public service method the controller calls instead, which computes the correct delta/classification and calls the private helper internally. This keeps the actual cash-logging logic in the one consolidated service (this task), while giving the controller (Task 3) something it can legally call. Scope ruling: this method only ever logs real cash being added or reduced through the manual tools — it deliberately does not attempt to interact with `credit_applied` (e.g. if an admin manually reduces `amount_collected` below what credit already covered on that entry, which is a pre-existing, rare edge case in the base module that predates this plan and is out of scope here); that interaction remains `undoPaid()`'s job specifically, not the manual pencil-edit path's.

Append to `tests/Feature/MonthlyFeeLedgerServiceTest.php`:

```php
    public function test_record_manual_cash_change_logs_the_delta_classified_by_whether_the_entry_is_the_open_month(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 9);
        $current = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $pastEntry = MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 8, 'expected_amount' => 16000,
        ]);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $service->recordManualCashChange($current, 16000, $admin->id);
        $service->recordManualCashChange($pastEntry, 16000, $admin->id);

        $this->assertSame(2, MonthlyFeePayment::count());
        $currentPayment = MonthlyFeePayment::orderBy('id')->first();
        $this->assertSame('16000.00', $currentPayment->applied_to_current_month);
        $this->assertSame('0.00', $currentPayment->applied_to_arrears);
        $pastPayment = MonthlyFeePayment::orderBy('id')->skip(1)->first();
        $this->assertSame('16000.00', $pastPayment->applied_to_arrears);
        $this->assertSame('0.00', $pastPayment->applied_to_current_month);
    }

    public function test_record_manual_cash_change_logs_nothing_when_the_amount_is_unchanged(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 9);
        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $service->recordManualCashChange($entry, 0.0, $admin->id);

        $this->assertSame(0, MonthlyFeePayment::count());
    }
```

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: FAIL — `Call to undefined method MonthlyFeeLedgerService::recordManualCashChange()`.

- [ ] **Step 14b: Write `recordManualCashChange()`**

In `app/Services/MonthlyFeeLedgerService.php`, add after `refundCredit()`:

```php
    /**
     * Used by the manual correction tools (markPaid/updateCollected in the
     * controller) so real cash changed through them also feeds the
     * cash-basis analytics, the same way recordPayment() does. Computes the
     * delta being applied to $entry's own amount_collected, classifies it
     * as arrears or current-month cash depending on whether $entry belongs
     * to the school's actual open month, and logs it. Deliberately never
     * touches credit_applied — these tools only ever add/adjust real cash;
     * undoPaid() alone handles the credit-refund side.
     */
    public function recordManualCashChange(MonthlyFeeEntry $entry, float $newAmountCollected, int $recordedBy): void
    {
        $delta = $newAmountCollected - (float) ($entry->amount_collected ?? 0);

        if ($delta === 0.0) {
            return;
        }

        $latest = $this->latestMonth($entry->school_id);
        $isCurrentMonth = $entry->year === $latest['year'] && $entry->month === $latest['month'];

        $this->logCashReceived(
            $entry->school_id,
            $entry->guardian_id,
            $delta,
            $isCurrentMonth ? 0.0 : $delta,
            $isCurrentMonth ? $delta : 0.0,
            0.0,
            $recordedBy,
        );
    }
```

- [ ] **Step 14c: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: PASS, 22 tests.

- [ ] **Step 15: Commit**

```bash
git add app/Services/MonthlyFeeLedgerService.php tests/Feature/MonthlyFeeLedgerServiceTest.php
git commit -m "feat: add refundCredit and recordManualCashChange to MonthlyFeeLedgerService"
```

- [ ] **Step 16: Write the failing tests for `applyCreditToArrears()`**

Append to `tests/Feature/MonthlyFeeLedgerServiceTest.php`:

```php
    public function test_apply_credit_to_arrears_settles_oldest_old_months_first_and_sets_credit_applied(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);
        $guardian->monthlyFeeSetting->update(['credit_balance' => 8000]);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 3, 'expected_amount' => 8000,
        ]);
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $result = (new MonthlyFeeLedgerService)->applyCreditToArrears($guardian->id, $admin->id);

        $march = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 3)->first();
        $this->assertSame('8000.00', $march->amount_collected);
        $this->assertSame('8000.00', $march->credit_applied);
        $this->assertSame($admin->id, $march->recorded_by); // a deliberate admin action, not fully-automatic null
        $this->assertSame('0.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
        $this->assertSame(8000.0, $result['total_applied']);
        $this->assertSame(0, MonthlyFeePayment::count()); // no new cash changed hands
    }

    public function test_undoing_an_arrears_month_settled_via_apply_credit_correctly_refunds_credit(): void
    {
        // Round-4 fix: applyCreditToArrears must do the identical
        // credit_applied bookkeeping syncMonth does, or undoing an old
        // credit-settled month wrongly corrects phantom cash instead of
        // refunding the guardian's real credit.
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);
        $guardian->monthlyFeeSetting->update(['credit_balance' => 8000]);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 3, 'expected_amount' => 8000,
        ]);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        (new MonthlyFeeLedgerService)->applyCreditToArrears($guardian->id, $admin->id);

        $march = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 3)->first();
        (new MonthlyFeeLedgerService)->refundCredit($march, $admin->id);

        $this->assertSame('8000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
    }
```

- [ ] **Step 17: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: FAIL — `Call to undefined method MonthlyFeeLedgerService::applyCreditToArrears()`.

- [ ] **Step 18: Write `applyCreditToArrears()`**

In `app/Services/MonthlyFeeLedgerService.php`, add after `refundCredit()`:

```php
    /**
     * The explicit, admin-triggered action that nets an existing credit
     * balance against reopened/still-outstanding arrears (spec round-2 fix
     * #5) — never automatic. Walks oldest-unpaid-first, the same order
     * recordPayment() uses, but the money's source is the guardian's stored
     * credit rather than new cash: every entry it touches gets its
     * credit_applied increased by exactly the amount applied — mirroring
     * syncMonth()'s credit consumption (spec round-4 fix) — and recorded_by
     * is set to the acting admin (unlike syncMonth's fully-automatic null),
     * since a human deliberately triggered this. No monthly_fee_payments row
     * is logged — no new cash changed hands.
     *
     * @return array{total_applied: float, entries: array<int, array{entry_id:int, year:int, month:int, applied:float}>}
     */
    public function applyCreditToArrears(int $guardianId, int $recordedBy): array
    {
        $guardian = Guardian::findOrFail($guardianId);

        return DB::transaction(function () use ($guardian, $guardianId, $recordedBy) {
            $setting = MonthlyFeeSetting::lockForUpdate()->where('guardian_id', $guardianId)->first()
                ?? MonthlyFeeSetting::create(['school_id' => $guardian->school_id, 'guardian_id' => $guardianId, 'expected_fee' => 0]);

            $latest = $this->latestMonth($guardian->school_id);
            $remaining = (float) $setting->credit_balance;
            $totalApplied = 0.0;
            $touched = [];

            if ($remaining <= 0) {
                return ['total_applied' => 0.0, 'entries' => []];
            }

            $arrearsEntries = MonthlyFeeEntry::where('guardian_id', $guardianId)
                ->where(fn ($query) => $this->beforeMonth($query, $latest['year'], $latest['month']))
                ->whereRaw('COALESCE(amount_collected, 0) < expected_amount')
                ->orderBy('year')->orderBy('month')
                ->lockForUpdate()
                ->get();

            foreach ($arrearsEntries as $entry) {
                if ($remaining <= 0) {
                    break;
                }

                $shortfall = (float) $entry->expected_amount - (float) ($entry->amount_collected ?? 0);
                $applied = min($remaining, $shortfall);

                $entry->update([
                    'amount_collected' => (float) ($entry->amount_collected ?? 0) + $applied,
                    'credit_applied' => (float) $entry->credit_applied + $applied,
                    'paid_date' => now()->toDateString(),
                    'recorded_by' => $recordedBy,
                ]);

                $touched[] = ['entry_id' => $entry->id, 'year' => $entry->year, 'month' => $entry->month, 'applied' => $applied];
                $totalApplied += $applied;
                $remaining -= $applied;
            }

            if ($totalApplied > 0) {
                $setting->decrement('credit_balance', $totalApplied);
            }

            return ['total_applied' => $totalApplied, 'entries' => $touched];
        });
    }
```

- [ ] **Step 19: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: PASS, 24 tests.

- [ ] **Step 20: Commit**

```bash
git add app/Services/MonthlyFeeLedgerService.php tests/Feature/MonthlyFeeLedgerServiceTest.php
git commit -m "feat: add MonthlyFeeLedgerService::applyCreditToArrears"
```

- [ ] **Step 21: Write the failing tests for the three analytics methods + `arrearsActivityForSchool()`**

Append to `tests/Feature/MonthlyFeeLedgerServiceTest.php`:

```php
    public function test_collected_this_period_sums_real_cash_bounded_by_when_the_month_opened_and_closed(): void
    {
        // Round-3 fix #4: bounded by the ledger's own open period, not
        // calendar-month boundaries.
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $service->recordPayment($guardian->id, 16000, $admin->id);

        $collected = $service->collectedThisPeriod($school->id, 2026, 9);

        $this->assertSame(16000.0, $collected);
    }

    public function test_collected_this_period_is_unaffected_by_later_credit_auto_consumption_in_a_different_month(): void
    {
        // The core regression for the cash-basis fix: a big payment made
        // while September is open must NOT inflate October's own
        // "collected this period" figure once credit auto-settles it.
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $service->recordPayment($guardian->id, 32000, $admin->id); // 16000 current + 16000 credit

        $service->openNextMonth($school->id); // October opens, consumes the 16000 credit

        $septemberCollected = $service->collectedThisPeriod($school->id, 2026, 9);
        $octoberCollected = $service->collectedThisPeriod($school->id, 2026, 10);

        $this->assertSame(32000.0, $septemberCollected); // all the real cash landed while September was open
        $this->assertSame(0.0, $octoberCollected); // nothing NEW was received in October
    }

    public function test_arrears_collected_this_period_sums_only_the_arrears_portion(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 8, 'expected_amount' => 16000,
        ]);
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        (new MonthlyFeeLedgerService)->recordPayment($guardian->id, 32000, $admin->id); // 16000 arrears + 16000 current

        $arrears = (new MonthlyFeeLedgerService)->arrearsCollectedThisPeriod($school->id, 2026, 9);

        $this->assertSame(16000.0, $arrears);
    }

    public function test_credit_recognized_this_period_counts_both_the_automatic_and_the_explicit_paths(): void
    {
        // Round-4 fix: must key off credit_applied, not recorded_by IS NULL,
        // or it would miss everything applyCreditToArrears settles.
        $school = School::factory()->create();
        $guardianA = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $guardianB = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);
        $guardianB->monthlyFeeSetting->update(['credit_balance' => 8000]);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardianB->id,
            'year' => 2026, 'month' => 8, 'expected_amount' => 8000,
        ]);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        // Guardian A: automatic credit consumption via syncMonth.
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);
        $guardianA->monthlyFeeSetting->update(['credit_balance' => 16000]);
        $entryA = MonthlyFeeEntry::where('guardian_id', $guardianA->id)->first();
        $entryA->delete();
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);

        // Guardian B: explicit applyCreditToArrears.
        (new MonthlyFeeLedgerService)->applyCreditToArrears($guardianB->id, $admin->id);

        $recognized = (new MonthlyFeeLedgerService)->creditRecognizedThisPeriod($school->id, 2026, 9);

        $this->assertSame(24000.0, $recognized); // 16000 (guardian A, automatic) + 8000 (guardian B, explicit)
    }

    public function test_arrears_activity_for_school_lists_still_owing_and_resolved_this_period(): void
    {
        $school = School::factory()->create();
        $stillOwing = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $stillOwing->id,
            'year' => 2026, 'month' => 8, 'expected_amount' => 8000,
        ]);
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);

        $activity = (new MonthlyFeeLedgerService)->arrearsActivityForSchool($school->id, 2026, 9);

        $this->assertTrue($activity->has($stillOwing->id));
        $this->assertCount(1, $activity->get($stillOwing->id));
        $this->assertSame(8, $activity->get($stillOwing->id)->first()->month);
    }
```

- [ ] **Step 22: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: FAIL — the four new methods don't exist yet.

- [ ] **Step 23: Write the four analytics methods**

In `app/Services/MonthlyFeeLedgerService.php`, add after `outstandingBalancesForSchool()`:

```php
    /**
     * The date range this abstract (year, month) was actually "open" for —
     * from the earliest entry syncMonth ever created for it, until the
     * earliest entry of whichever month opened right after it (or now, if
     * none has opened yet). Round-3 fix #4: this is what lets the analytics
     * below match what's actually on screen, regardless of how far behind
     * the real calendar a school's "Open next month" habits are.
     *
     * @return array{start: string, end: string}
     */
    private function periodBounds(int $schoolId, int $year, int $month): array
    {
        $start = MonthlyFeeEntry::where('school_id', $schoolId)
            ->where('year', $year)->where('month', $month)
            ->min('created_at');

        $next = MonthlyFeeEntry::where('school_id', $schoolId)
            ->where(function ($query) use ($year, $month) {
                $query->where('year', '>', $year)
                    ->orWhere(function ($query) use ($year, $month) {
                        $query->where('year', $year)->where('month', '>', $month);
                    });
            })
            ->orderBy('year')->orderBy('month')
            ->first(['year', 'month']);

        $end = $next
            ? MonthlyFeeEntry::where('school_id', $schoolId)->where('year', $next->year)->where('month', $next->month)->min('created_at')
            : now()->toDateTimeString();

        return ['start' => $start ?? now()->toDateTimeString(), 'end' => $end];
    }

    /** Real cash received while this abstract month was open — the true, honest "cash in the door this period" figure. */
    public function collectedThisPeriod(int $schoolId, int $year, int $month): float
    {
        $bounds = $this->periodBounds($schoolId, $year, $month);

        return (float) (MonthlyFeePayment::where('school_id', $schoolId)
            ->whereBetween('received_at', [$bounds['start'], $bounds['end']])
            ->sum('amount') ?? 0);
    }

    /** How much of this period's real cash went toward old debt. */
    public function arrearsCollectedThisPeriod(int $schoolId, int $year, int $month): float
    {
        $bounds = $this->periodBounds($schoolId, $year, $month);

        return (float) (MonthlyFeePayment::where('school_id', $schoolId)
            ->whereBetween('received_at', [$bounds['start'], $bounds['end']])
            ->sum('applied_to_arrears') ?? 0);
    }

    /**
     * Informational only: how much reserve credit got recognized as this
     * period's fees, with no new cash behind it. Deliberately keys off
     * credit_applied, not recorded_by IS NULL (round-4 fix) — that would
     * only catch syncMonth's automatic consumption and miss everything
     * applyCreditToArrears settles, since that's a deliberate admin action
     * that honestly attributes recorded_by to whoever clicked it.
     */
    public function creditRecognizedThisPeriod(int $schoolId, int $year, int $month): float
    {
        $bounds = $this->periodBounds($schoolId, $year, $month);

        return (float) (MonthlyFeeEntry::where('school_id', $schoolId)
            ->where('credit_applied', '>', 0)
            ->whereBetween('paid_date', [$bounds['start'], $bounds['end']])
            ->sum('credit_applied') ?? 0);
    }

    /**
     * Every guardian with arrears activity relevant to this period — either
     * a still-outstanding shortfall from before (year, month), or an entry
     * actually resolved during this period. Grouped by guardian for the
     * drill-down.
     *
     * @return \Illuminate\Support\Collection<int, \Illuminate\Support\Collection<int, MonthlyFeeEntry>>
     */
    public function arrearsActivityForSchool(int $schoolId, int $year, int $month): \Illuminate\Support\Collection
    {
        $bounds = $this->periodBounds($schoolId, $year, $month);

        return MonthlyFeeEntry::where('school_id', $schoolId)
            ->where('expected_amount', '>', 0)
            ->where(fn ($query) => $this->beforeMonth($query, $year, $month))
            ->where(function ($query) use ($bounds) {
                $query->whereRaw('COALESCE(amount_collected, 0) < expected_amount')
                    ->orWhereBetween('paid_date', [$bounds['start'], $bounds['end']]);
            })
            ->with('guardian')
            ->orderBy('guardian_id')->orderBy('year')->orderBy('month')
            ->get()
            ->groupBy('guardian_id');
    }
```

- [ ] **Step 24: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeLedgerServiceTest.php`
Expected: PASS, 29 tests.

- [ ] **Step 25: Commit**

```bash
git add app/Services/MonthlyFeeLedgerService.php tests/Feature/MonthlyFeeLedgerServiceTest.php
git commit -m "feat: add cash-basis analytics and arrears drill-down to MonthlyFeeLedgerService"
```

---

### Task 3: Controller + routes — `recordPayment`, `applyCredit`, and wiring the manual tools into the cash ledger

**Files:**
- Modify: `app/Http/Controllers/MonthlyFeeController.php`
- Modify: `app/Http/Middleware/HandleInertiaRequests.php` (add `payment_receipt` flash key)
- Modify: `routes/web.php`
- Test: `tests/Feature/MonthlyFeeControllerTest.php` (extend), `tests/Feature/MonthlyFeeTenantIsolationTest.php` (extend)

**Interfaces:**
- Consumes: `MonthlyFeeLedgerService::recordPayment()`/`applyCreditToArrears()`/`refundCredit()`/`collectedThisPeriod()`/`arrearsCollectedThisPeriod()`/`creditRecognizedThisPeriod()`/`arrearsActivityForSchool()` (Task 2).
- Produces: routes `monthly-fees.record-payment` (POST `/monthly-fees/guardians/{guardian}/record-payment`), `monthly-fees.apply-credit` (POST `/monthly-fees/guardians/{guardian}/apply-credit`). `index()` gains props `collectedThisPeriod`, `arrearsCollectedThisPeriod`, `creditRecognizedThisPeriod`, `arrearsActivity`, and each row gains `credit_balance`. `guardianShow()` gains `creditBalance`. Tasks 4-5 depend on exactly these prop names.

- [ ] **Step 1: Write the failing controller tests**

Append to `tests/Feature/MonthlyFeeControllerTest.php` (inside the existing class):

```php
    public function test_record_payment_settles_arrears_and_current_month_and_flashes_a_receipt(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 8, 'expected_amount' => 16000,
        ]);
        $this->actingAs($admin)->get('/monthly-fees'); // syncs the current month

        $response = $this->actingAs($admin)
            ->post("/monthly-fees/guardians/{$guardian->id}/record-payment", ['amount' => 32000]);

        $response->assertRedirect();
        $this->assertSame(1, \App\Models\MonthlyFeePayment::count());
        $payment = \App\Models\MonthlyFeePayment::first();
        $this->assertSame('16000.00', $payment->applied_to_arrears);
        $this->assertSame('16000.00', $payment->applied_to_current_month);
    }

    public function test_record_payment_honors_a_submitted_received_at_date(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $this->actingAs($admin)->get('/monthly-fees');

        $this->actingAs($admin)->post("/monthly-fees/guardians/{$guardian->id}/record-payment", [
            'amount' => 16000, 'received_at' => '2026-08-28',
        ]);

        $payment = \App\Models\MonthlyFeePayment::first();
        $this->assertSame('2026-08-28', $payment->received_at->format('Y-m-d'));
    }

    public function test_apply_credit_to_arrears_only_acts_when_explicitly_triggered(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);
        $guardian->monthlyFeeSetting->update(['credit_balance' => 8000]);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 8, 'expected_amount' => 8000,
        ]);

        $response = $this->actingAs($admin)->post("/monthly-fees/guardians/{$guardian->id}/apply-credit");

        $response->assertRedirect();
        $august = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 8)->first();
        $this->assertSame('8000.00', $august->amount_collected);
        $this->assertSame('0.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
    }

    public function test_undo_on_a_mixed_funded_entry_splits_the_refund_and_correction(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $this->actingAs($admin)->get('/monthly-fees');
        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $entry->update(['amount_collected' => 8000, 'credit_applied' => 8000]); // simulate a prior credit settlement
        $this->actingAs($admin)->put("/monthly-fees/entries/{$entry->id}", ['amount' => 16000]); // top up with real cash via the pencil

        $this->actingAs($admin)->post("/monthly-fees/entries/{$entry->id}/undo")->assertRedirect();

        $entry->refresh();
        $this->assertNull($entry->amount_collected);
        $this->assertSame('0.00', $entry->credit_applied);
        $this->assertSame('8000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance); // the credit portion refunded
        $correction = \App\Models\MonthlyFeePayment::where('corrects_entry_id', $entry->id)->first();
        $this->assertNotNull($correction);
        $this->assertSame('-8000.00', $correction->amount); // only the cash portion corrected, not the full 16000
    }

    public function test_index_exposes_the_new_analytics_and_arrears_activity(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $this->actingAs($admin)->get('/monthly-fees');
        $this->actingAs($admin)->post("/monthly-fees/guardians/{$guardian->id}/record-payment", ['amount' => 16000]);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('collectedThisPeriod', 16000)
            ->has('arrearsActivity')
            ->where('rows.0.credit_balance', 0)
        );
    }

    public function test_guardian_show_exposes_credit_balance(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $guardian->monthlyFeeSetting->update(['credit_balance' => 5000]);

        $response = $this->actingAs($guardian->user)->get('/guardian/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('creditBalance', 5000));
    }

    public function test_update_expected_fee_still_reaches_an_entry_settled_only_by_credit(): void
    {
        // Spec round-3 fix #3: an entry that's only ever been credit-settled
        // was never confirmed by any real payment, so a rate change must
        // still reach it — only real cash locks a month's price in.
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $this->actingAs($admin)->get('/monthly-fees');
        $this->actingAs($admin)->post("/monthly-fees/guardians/{$guardian->id}/record-payment", ['amount' => 32000]); // 16000 current + 16000 credit
        $this->actingAs($admin)->post('/monthly-fees/open-next-month'); // next month fully credit-settles from the 16000

        $nextEntry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->orderByDesc('month')->first();
        $this->assertSame('16000.00', $nextEntry->credit_applied);
        $this->assertSame('paid', $nextEntry->status);

        $this->actingAs($admin)
            ->put("/monthly-fees/guardians/{$guardian->id}/expected-fee", ['expected_fee' => 24000])
            ->assertRedirect();

        $this->assertSame('24000.00', $nextEntry->fresh()->expected_amount);
        $this->assertSame('partial', $nextEntry->fresh()->status); // 16000 collected against a new 24000 price
    }

    public function test_mark_paid_logs_the_full_amount_to_the_cash_ledger(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $this->actingAs($admin)->get('/monthly-fees');
        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();

        $this->actingAs($admin)->post("/monthly-fees/entries/{$entry->id}/mark-paid");

        $payment = \App\Models\MonthlyFeePayment::first();
        $this->assertNotNull($payment);
        $this->assertSame('16000.00', $payment->amount);
        $this->assertSame('16000.00', $payment->applied_to_current_month);
    }

    public function test_update_collected_logs_only_the_delta_to_the_cash_ledger(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $this->actingAs($admin)->get('/monthly-fees');
        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $this->actingAs($admin)->put("/monthly-fees/entries/{$entry->id}", ['amount' => 5000]);

        $this->actingAs($admin)->put("/monthly-fees/entries/{$entry->id}", ['amount' => 12000]); // top up by 7000 more

        $this->assertSame(2, \App\Models\MonthlyFeePayment::count());
        $second = \App\Models\MonthlyFeePayment::orderBy('id')->skip(1)->first();
        $this->assertSame('7000.00', $second->amount); // only the delta, not the full 12000
    }
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeControllerTest.php`
Expected: FAIL — routes not found.

- [ ] **Step 3: Add the flash key for the payment receipt**

In `app/Http/Middleware/HandleInertiaRequests.php`, add one line to the existing `'flash'` array (around line 74, next to `'generated_password'`):

```php
                'payment_receipt' => fn () => $request->session()->get('payment_receipt'),
```

- [ ] **Step 4: Add `recordPayment` and `applyCredit` controller actions, and update `index()`/`guardianShow()`/`undoPaid()`**

In `app/Http/Controllers/MonthlyFeeController.php`:

Add the import:

```php
use App\Models\MonthlyFeePayment;
```

Replace `index()`'s body from the `$outstandingByGuardian` line through the return statement:

```php
        $outstandingByGuardian = $this->ledger->outstandingBalancesForSchool($schoolId, $year, $month);

        $rows = $entries->map(function (MonthlyFeeEntry $entry) use ($outstandingByGuardian) {
            $guardian = $entry->guardian;

            $children = $guardian->allStudents()
                ->where('status', 'active')
                ->with('grade')
                ->get()
                ->map(fn ($student) => [
                    'name' => trim($student->first_name.' '.$student->last_name),
                    'grade' => $student->grade->name ?? null,
                ])
                ->values();

            $outstandingBalance = $outstandingByGuardian[$guardian->id] ?? 0.0;

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
                'outstanding_balance' => $outstandingBalance,
                'total_due' => (float) $entry->expected_amount + $outstandingBalance,
                'credit_balance' => (float) ($guardian->monthlyFeeSetting?->credit_balance ?? 0),
            ];
        })->sortBy('guardian_name')->values();

        $monthDate = Carbon::create($year, $month, 1);
        $prev = $monthDate->copy()->subMonthNoOverflow();
        $next = $monthDate->copy()->addMonthNoOverflow();
        $wouldBrowsePastOpenMonth = $isOpenMonth;

        $arrearsActivity = $this->ledger->arrearsActivityForSchool($schoolId, $year, $month)
            ->map(function ($entries, $guardianId) use ($outstandingByGuardian) {
                $guardian = $entries->first()->guardian;

                return [
                    'guardian_id' => $guardianId,
                    'guardian_name' => $guardian->full_name,
                    'guardian_number' => $guardian->guardian_number,
                    'still_owing' => $outstandingByGuardian[$guardianId] ?? 0.0,
                    'months' => $entries->map(fn (MonthlyFeeEntry $e) => [
                        'entry_id' => $e->id,
                        'year' => $e->year,
                        'month' => $e->month,
                        'label' => Carbon::create($e->year, $e->month, 1)->format('F Y'),
                        'expected_amount' => (float) $e->expected_amount,
                        'amount_collected' => $e->amount_collected !== null ? (float) $e->amount_collected : null,
                        'credit_applied' => (float) $e->credit_applied,
                        'paid_date' => $e->paid_date?->format('Y-m-d'),
                        'status' => $e->status,
                    ])->values(),
                ];
            })->values();

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
            'collectedThisPeriod' => $this->ledger->collectedThisPeriod($schoolId, $year, $month),
            'arrearsCollectedThisPeriod' => $this->ledger->arrearsCollectedThisPeriod($schoolId, $year, $month),
            'creditRecognizedThisPeriod' => $this->ledger->creditRecognizedThisPeriod($schoolId, $year, $month),
            'arrearsActivity' => $arrearsActivity,
        ]);
```

Replace `undoPaid()` entirely:

```php
    public function undoPaid(Request $request, MonthlyFeeEntry $entry)
    {
        $creditPortion = (float) $entry->credit_applied;
        $cashPortion = (float) ($entry->amount_collected ?? 0) - $creditPortion;

        if ($creditPortion > 0) {
            $this->ledger->refundCredit($entry, $request->user()->id);
        }

        if ($cashPortion > 0) {
            $latest = $this->ledger->latestMonth($entry->school_id);
            $isCurrentMonth = $entry->year === $latest['year'] && $entry->month === $latest['month'];

            MonthlyFeePayment::create([
                'school_id' => $entry->school_id,
                'guardian_id' => $entry->guardian_id,
                'amount' => -$cashPortion,
                'applied_to_arrears' => $isCurrentMonth ? 0 : -$cashPortion,
                'applied_to_current_month' => $isCurrentMonth ? -$cashPortion : 0,
                'received_at' => now()->toDateString(),
                'recorded_by' => $request->user()->id,
                'corrects_entry_id' => $entry->id,
            ]);
        }

        $entry->update([
            'amount_collected' => null,
            'credit_applied' => 0,
            'paid_date' => null,
            'recorded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Payment undone.');
    }
```

Update `markPaid()` and `updateCollected()` to feed the cash ledger via `recordManualCashChange()` (Task 2, step 14b) — the fix for the gap the plan's own Global Constraints flagged but never actually wired up. Both calls happen **before** `$entry->update(...)`, since the delta computation inside `recordManualCashChange()` reads the entry's current (pre-update) `amount_collected`. Replace `markPaid()`:

```php
    public function markPaid(Request $request, MonthlyFeeEntry $entry)
    {
        if ($entry->expected_amount <= 0) {
            return back()->withErrors(['error' => 'Set an expected fee for this guardian before marking a payment.']);
        }

        $this->ledger->recordManualCashChange($entry, (float) $entry->expected_amount, $request->user()->id);

        $entry->update([
            'amount_collected' => $entry->expected_amount,
            'paid_date' => now()->toDateString(),
            'recorded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Marked as paid.');
    }
```

Replace `updateCollected()`:

```php
    public function updateCollected(Request $request, MonthlyFeeEntry $entry)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $amount = (float) $validated['amount'];

        $this->ledger->recordManualCashChange($entry, $amount, $request->user()->id);

        $entry->update([
            'amount_collected' => $amount > 0 ? $amount : null,
            'paid_date' => $amount > 0 ? ($entry->paid_date?->toDateString() ?? now()->toDateString()) : null,
            'recorded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Amount updated.');
    }
```

Add two new actions after `updateCollected()`:

```php
    public function recordPayment(Request $request, Guardian $guardian)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'received_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $result = $this->ledger->recordPayment(
            $guardian->id,
            (float) $validated['amount'],
            $request->user()->id,
            $validated['received_at'] ?? null,
            $validated['notes'] ?? null,
        );

        return back()->with('success', 'Payment recorded.')->with('payment_receipt', $result);
    }

    public function applyCredit(Request $request, Guardian $guardian)
    {
        $this->ledger->applyCreditToArrears($guardian->id, $request->user()->id);

        return back()->with('success', 'Credit applied to arrears.');
    }
```

In `guardianShow()`, add `creditBalance` to the returned props (after `'outstandingBalance' => $outstandingBalance,`):

```php
            'creditBalance' => (float) ($guardian->monthlyFeeSetting?->credit_balance ?? 0),
```

In `updateExpected()`, widen the guard that decides which entry gets refreshed (spec round-3 fix #3): an entry that's only ever been credit-settled was never confirmed by any real payment, so a rate change must still reach it — only real cash locks a month's price in. Replace:

```php
        MonthlyFeeEntry::where('guardian_id', $guardian->id)
            ->where('year', $latest['year'])
            ->where('month', $latest['month'])
            ->whereNull('amount_collected')
            ->update(['expected_amount' => $setting->expected_fee]);
```

with:

```php
        MonthlyFeeEntry::where('guardian_id', $guardian->id)
            ->where('year', $latest['year'])
            ->where('month', $latest['month'])
            ->where(function ($query) {
                $query->whereNull('amount_collected')
                    ->orWhereColumn('amount_collected', 'credit_applied');
            })
            ->update(['expected_amount' => $setting->expected_fee]);
```

- [ ] **Step 5: Add the routes**

In `routes/web.php`, inside the `permission:fees.manage` group, immediately after the existing `monthly-fees.update-collected` route (line 685):

```php
        Route::post('/monthly-fees/guardians/{guardian}/record-payment', [MonthlyFeeController::class, 'recordPayment'])->name('monthly-fees.record-payment');
        Route::post('/monthly-fees/guardians/{guardian}/apply-credit', [MonthlyFeeController::class, 'applyCredit'])->name('monthly-fees.apply-credit');
```

- [ ] **Step 6: Run the controller tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeControllerTest.php`
Expected: PASS, 19 tests (10 existing plus 9 new).

- [ ] **Step 7: Write the failing tenant-isolation tests**

Append to `tests/Feature/MonthlyFeeTenantIsolationTest.php`:

```php
    public function test_admin_gets_404_recording_a_payment_for_another_schools_guardian(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $adminA = $this->makeAdmin($schoolA);

        $schoolB = School::factory()->create();
        $guardianB = $this->makeGuardianWithActiveChild($schoolB, expectedFee: 16000);

        $response = $this->actingAs($adminA)
            ->post("/monthly-fees/guardians/{$guardianB->id}/record-payment", ['amount' => 16000]);

        $response->assertNotFound();
    }

    public function test_admin_gets_404_applying_credit_for_another_schools_guardian(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $adminA = $this->makeAdmin($schoolA);

        $schoolB = School::factory()->create();
        $guardianB = $this->makeGuardianWithActiveChild($schoolB, expectedFee: 16000);

        $response = $this->actingAs($adminA)->post("/monthly-fees/guardians/{$guardianB->id}/apply-credit");

        $response->assertNotFound();
    }

    public function test_analytics_never_sum_another_schools_payments(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $adminA = $this->makeAdmin($schoolA);
        $guardianA = $this->makeGuardianWithActiveChild($schoolA, expectedFee: 16000);
        $this->actingAs($adminA)->get('/monthly-fees');
        $this->actingAs($adminA)->post("/monthly-fees/guardians/{$guardianA->id}/record-payment", ['amount' => 16000]);

        $schoolB = School::factory()->create();
        $adminB = $this->makeAdmin($schoolB);
        $guardianB = $this->makeGuardianWithActiveChild($schoolB, expectedFee: 50000);
        $this->actingAs($adminB)->get('/monthly-fees');
        $this->actingAs($adminB)->post("/monthly-fees/guardians/{$guardianB->id}/record-payment", ['amount' => 50000]);

        $response = $this->actingAs($adminA)->get('/monthly-fees');

        $response->assertInertia(fn ($page) => $page->where('collectedThisPeriod', 16000));
    }
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/MonthlyFeeTenantIsolationTest.php`
Expected: PASS, 6 tests (3 existing plus 3 new).

- [ ] **Step 9: Run the full monthly-fee test set together, then commit**

Run: `php8.4 artisan test --filter=MonthlyFee`
Expected: PASS, all tests across all five `MonthlyFee*Test.php` files.

```bash
git add app/Http/Controllers/MonthlyFeeController.php app/Http/Middleware/HandleInertiaRequests.php \
        routes/web.php tests/Feature/MonthlyFeeControllerTest.php tests/Feature/MonthlyFeeTenantIsolationTest.php
git commit -m "feat: wire recordPayment/applyCredit into the controller and expose the new analytics"
```

---

### Task 4: Frontend — analytics cards and the arrears drill-down

**Files:**
- Modify: `resources/js/Pages/Fees/MonthlyFees/Index.jsx`

**Interfaces:**
- Consumes: `collectedThisPeriod`, `arrearsCollectedThisPeriod`, `creditRecognizedThisPeriod`, `arrearsActivity`, and each row's new `credit_balance` field (Task 3).

- [ ] **Step 1: Replace the totals footer with the three analytics cards, and add the drill-down panel**

In `resources/js/Pages/Fees/MonthlyFees/Index.jsx`:

Add a new prop to the destructured function signature (replace the current one):

```jsx
export default function MonthlyFeesIndex({
    auth, year, month, monthLabel, isOpenMonth, canBrowseNext, prev, next, rows, totalCollected,
    collectedThisPeriod, arrearsCollectedThisPeriod, creditRecognizedThisPeriod, arrearsActivity,
}) {
```

Add drill-down state next to the existing `useState` calls:

```jsx
    const [showArrearsDrilldown, setShowArrearsDrilldown] = useState(false);
    const [openArrearsGuardians, setOpenArrearsGuardians] = useState({});
```

Add a toggle helper next to `toggleRow`:

```jsx
    const toggleArrearsGuardian = (guardianId) => {
        setOpenArrearsGuardians((prevState) => ({ ...prevState, [guardianId]: !prevState[guardianId] }));
    };
```

Replace the entire "Totals footer" block (the `<div className="mt-4 flex flex-col gap-2 ...">...</div>` at the end of the page body, just before the closing `</div></div></AuthenticatedLayout>`) with:

```jsx
                    {/* Analytics cards */}
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Collected this period</div>
                            <div className="mt-1 font-mono text-xl font-bold text-green-700">{fmt(collectedThisPeriod)}</div>
                        </div>

                        <button
                            onClick={() => setShowArrearsDrilldown((prevState) => !prevState)}
                            className="rounded-lg border-2 border-gray-300 bg-white p-4 text-left hover:border-indigo-300"
                        >
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Arrears</div>
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showArrearsDrilldown ? 'rotate-180' : ''}`} />
                            </div>
                            <div className="mt-1 text-sm text-amber-700">Collected: <span className="font-mono font-bold">{fmt(arrearsCollectedThisPeriod)}</span></div>
                            <div className="text-sm text-red-600">Still owed: <span className="font-mono font-bold">{fmt(arrearsActivity.reduce((sum, g) => sum + g.still_owing, 0))}</span></div>
                            <div className="mt-1 text-xs text-gray-400">{arrearsActivity.length} {arrearsActivity.length === 1 ? 'guardian' : 'guardians'}</div>
                        </button>

                        <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Credit outstanding</div>
                            <div className="mt-1 font-mono text-xl font-bold text-indigo-700">{fmt(rows.reduce((sum, row) => sum + (row.credit_balance || 0), 0))}</div>
                            {creditRecognizedThisPeriod > 0 && (
                                <div className="mt-1 text-xs text-gray-400">{fmt(creditRecognizedThisPeriod)} recognized from credit this period</div>
                            )}
                        </div>
                    </div>

                    {/* Arrears drill-down */}
                    {showArrearsDrilldown && (
                        <div className="mt-3 space-y-2">
                            {arrearsActivity.length === 0 && (
                                <div className="rounded-lg border-2 border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-400">
                                    No arrears activity for this period.
                                </div>
                            )}
                            {arrearsActivity.map((g) => (
                                <div key={g.guardian_id} className="overflow-hidden rounded-lg border-2 border-gray-300 bg-white">
                                    <button
                                        onClick={() => toggleArrearsGuardian(g.guardian_id)}
                                        className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50"
                                    >
                                        <div>
                                            <div className="font-bold text-gray-900">{g.guardian_name}</div>
                                            <div className="text-xs text-gray-400">{g.guardian_number}</div>
                                        </div>
                                        <div className="text-right text-sm">
                                            {g.still_owing > 0 && <div className="font-mono font-semibold text-red-600">{fmt(g.still_owing)} owed</div>}
                                        </div>
                                    </button>
                                    {openArrearsGuardians[g.guardian_id] && (
                                        <div className="space-y-1.5 border-t border-gray-200 bg-gray-50 p-3">
                                            {g.months.map((m) => (
                                                <div key={m.entry_id} className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-1.5 text-sm">
                                                    <span className="font-semibold text-gray-800">{m.label}</span>
                                                    <div className="flex items-center gap-2">
                                                        {m.credit_applied > 0 && (
                                                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">from credit</span>
                                                        )}
                                                        <span className="font-mono text-gray-600">
                                                            {m.paid_date ? `Settled ${m.paid_date}` : 'Still owed'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
```

- [ ] **Step 2: Rebuild frontend assets and re-run the controller test**

Run: `npm run build && php8.4 artisan test tests/Feature/MonthlyFeeControllerTest.php`
Expected: PASS, 19 tests (this task doesn't change backend behavior).

- [ ] **Step 3: Manually verify in the browser**

Log in as an admin, open Monthly Fees. Confirm: the three analytics cards render at the top (Collected this period, Arrears, Credit outstanding); clicking the Arrears card expands the drill-down panel; clicking a guardian inside it expands their per-month list, showing an "from credit" badge on any month settled that way.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Fees/MonthlyFees/Index.jsx
git commit -m "feat: add analytics cards and arrears drill-down to the admin ledger"
```

---

### Task 5: Frontend — Record Payment modal, demoted controls, and visual treatment

**Files:**
- Create: `resources/js/Components/MonthlyFees/RecordPaymentModal.jsx`
- Modify: `resources/js/Pages/Fees/MonthlyFees/Index.jsx`
- Modify: `resources/js/Pages/Fees/MonthlyFees/GuardianShow.jsx`

**Interfaces:**
- Consumes: routes `monthly-fees.record-payment`/`monthly-fees.apply-credit` (Task 3), the flashed `payment_receipt` prop (Task 3), `Modal` (`resources/js/Components/Modal.jsx`, existing).

- [ ] **Step 1: Write `RecordPaymentModal.jsx`**

`resources/js/Components/MonthlyFees/RecordPaymentModal.jsx`:

```jsx
import Modal from '@/Components/Modal';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function RecordPaymentModal({ show, onClose, guardian }) {
    const { flash } = usePage().props;
    const [amount, setAmount] = useState(guardian?.total_due || 0);
    const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const fmt = (n) => 'KES ' + Number(n || 0).toLocaleString('en-KE');

    if (!guardian) {
        return null;
    }

    const submit = () => {
        setProcessing(true);
        router.post(
            `/monthly-fees/guardians/${guardian.guardian_id}/record-payment`,
            { amount, received_at: receivedAt, notes },
            {
                preserveScroll: true,
                onSuccess: () => setProcessing(false),
                onError: () => setProcessing(false),
            }
        );
    };

    const receipt = flash?.payment_receipt;

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900">Record Payment — {guardian.guardian_name}</h2>

                <div className="mt-3 space-y-1 rounded border border-gray-200 bg-gray-50 p-3 text-sm">
                    <div className="flex justify-between text-gray-600"><span>This month</span><span className="font-mono">{fmt(guardian.expected_amount)}</span></div>
                    {guardian.outstanding_balance > 0 && (
                        <div className="flex justify-between text-red-600"><span>Owed from earlier months</span><span className="font-mono">{fmt(guardian.outstanding_balance)}</span></div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900"><span>Total due</span><span className="font-mono">{fmt(guardian.total_due)}</span></div>
                </div>

                <label className="mt-4 block text-sm font-semibold text-gray-700" htmlFor="record-payment-amount">Amount received</label>
                <input
                    id="record-payment-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono"
                />
                {Number(amount) > guardian.total_due && (
                    <p className="mt-1 text-xs text-indigo-600">
                        This covers everything owed, with {fmt(Number(amount) - guardian.total_due)} left over as credit for future months.
                    </p>
                )}

                <label className="mt-3 block text-sm font-semibold text-gray-700" htmlFor="record-payment-date">Date received</label>
                <input
                    id="record-payment-date"
                    type="date"
                    value={receivedAt}
                    onChange={(e) => setReceivedAt(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                />

                <label className="mt-3 block text-sm font-semibold text-gray-700" htmlFor="record-payment-notes">Notes (optional)</label>
                <textarea
                    id="record-payment-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />

                {receipt && (
                    <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                        Recorded {fmt(receipt.amount_received)}.
                        {receipt.total_arrears_cleared > 0 && ` Cleared ${fmt(receipt.total_arrears_cleared)} of arrears.`}
                        {receipt.applied_to_credit > 0 && ` ${fmt(receipt.applied_to_credit)} left over as credit.`}
                    </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                    <button onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        Close
                    </button>
                    <button
                        onClick={submit}
                        disabled={processing || !amount || Number(amount) <= 0}
                        className="rounded bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {processing ? 'Recording…' : 'Record Payment'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
```

- [ ] **Step 2: Wire the modal into `Index.jsx` and demote the manual controls**

In `resources/js/Pages/Fees/MonthlyFees/Index.jsx`:

Add the import:

```jsx
import RecordPaymentModal from '@/Components/MonthlyFees/RecordPaymentModal';
```

Add state next to the existing `useState` calls:

```jsx
    const [recordPaymentGuardian, setRecordPaymentGuardian] = useState(null);
```

Add an `applyCredit` handler next to `undoPaid`:

```jsx
    const applyCredit = (guardianId) => {
        router.post(`/monthly-fees/guardians/${guardianId}/apply-credit`, {}, { preserveScroll: true });
    };
```

In `CollectedControls`, add the primary Record Payment button before the existing status-specific controls (replace the opening of the returned JSX):

```jsx
    const CollectedControls = ({ row, align = 'end' }) => (
        <div className={`flex flex-wrap items-center gap-1.5 ${align === 'end' ? 'justify-end' : 'justify-start'}`} onClick={(e) => e.stopPropagation()}>
            {row.status !== 'paid' && (
                <button
                    onClick={() => setRecordPaymentGuardian(row)}
                    className="rounded bg-green-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-green-700"
                >
                    Record Payment
                </button>
            )}

            {row.status === 'needs_fee' && <StatusBadge row={row} />}

            {row.status !== 'needs_fee' && editingAmount === row.entry_id && (
                <InlineAmountEditor initial={row.amount_collected || 0} onSave={(value) => saveAmount(row.entry_id, value)} />
            )}

            {row.status !== 'needs_fee' && editingAmount !== row.entry_id && (
                <>
                    {row.status === 'paid' && (
                        <>
                            <StatusBadge row={row} />
                            <button onClick={() => setEditingAmount(row.entry_id)} className="text-gray-300 hover:text-indigo-600" title="Fix a mistake in this specific month">
                                <Pencil className="h-3 w-3" />
                            </button>
                            <button onClick={() => undoPaid(row.entry_id)} className="text-gray-300 hover:text-red-600" title="Undo — this was marked paid by mistake">
                                <Undo2 className="h-3 w-3" />
                            </button>
                        </>
                    )}
                    {row.status === 'partial' && (
                        <>
                            <span className="font-mono text-xs text-amber-700">{fmt(row.amount_collected)}</span>
                            <button onClick={() => setEditingAmount(row.entry_id)} className="text-gray-300 hover:text-indigo-600" title="Fix a mistake in this specific month">
                                <Pencil className="h-3 w-3" />
                            </button>
                        </>
                    )}
                    {row.status === 'unpaid' && (
                        <button onClick={() => setEditingAmount(row.entry_id)} className="text-gray-300 hover:text-indigo-600" title="Fix a mistake in this specific month">
                            <Pencil className="h-3 w-3" />
                        </button>
                    )}
                </>
            )}
        </div>
    );
```

Note: the old `Mark paid` button is removed from the unpaid state — `Record Payment` (already shown above, unconditionally for any non-`paid` status) is now the one and only primary action for collecting money; the pencil remains purely as the demoted correction tool.

In `ExpectedCell`, add the "Apply credit to arrears" link when a guardian shows both credit and arrears (add after the existing `outstanding_balance` block):

```jsx
            {row.outstanding_balance > 0 && row.credit_balance > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); applyCredit(row.guardian_id); }}
                    className="text-xs font-semibold text-indigo-600 underline hover:text-indigo-800"
                >
                    Apply credit to arrears
                </button>
            )}
            {row.credit_balance > 0 && (
                <span className="whitespace-nowrap text-xs font-semibold text-green-600" title="Prepaid credit available">
                    +{fmt(row.credit_balance)} prepaid
                </span>
            )}
```

Add the modal render at the very end of the returned JSX, just before the closing `</AuthenticatedLayout>`:

```jsx
            <RecordPaymentModal
                show={!!recordPaymentGuardian}
                guardian={recordPaymentGuardian}
                onClose={() => setRecordPaymentGuardian(null)}
            />
```

- [ ] **Step 3: Add the left-border status stripe**

In `resources/js/Pages/Fees/MonthlyFees/Index.jsx`, add a stripe-color helper next to `statusMeta`:

```jsx
    const stripeColor = (status) => ({
        paid: 'border-l-green-500', partial: 'border-l-amber-500', unpaid: 'border-l-gray-300', needs_fee: 'border-l-red-500',
    }[status]);
```

Add `border-l-4 ${stripeColor(row.status)}` to the desktop row's outer `className` (the `<div key={row.guardian_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>` becomes:

```jsx
                                <div key={row.guardian_id} className={`border-l-4 ${stripeColor(row.status)} ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
```

and to the mobile card's outer `className` (`<div key={row.guardian_id} className="overflow-hidden rounded-lg border-2 border-gray-300 bg-white">` becomes:

```jsx
                            <div key={row.guardian_id} className={`overflow-hidden rounded-lg border-2 border-l-4 border-gray-300 bg-white ${stripeColor(row.status)}`}>
```

- [ ] **Step 4: Show `creditBalance` on `GuardianShow.jsx`**

In `resources/js/Pages/Fees/MonthlyFees/GuardianShow.jsx`, add `creditBalance` to the destructured props and render it beneath the amount-due block (after the closing `</div>` of the `mb-5 border-y ...` block):

```jsx
export default function MonthlyFeeGuardianShow({
    auth, monthLabel, guardianName, guardianNumber, phone, amountDue, outstandingBalance, creditBalance, status,
}) {
```

```jsx
                        {creditBalance > 0 && (
                            <p className="mb-4 text-center text-xs text-green-700">
                                You've prepaid ahead — {fmt(creditBalance)} credit remaining.
                            </p>
                        )}
```

- [ ] **Step 5: Rebuild frontend assets and re-run the controller test**

Run: `npm run build && php8.4 artisan test tests/Feature/MonthlyFeeControllerTest.php`
Expected: PASS, 19 tests.

- [ ] **Step 6: Manually verify in the browser**

Reproduce the spec's exact §1 worked example end-to-end, using real data — at both desktop and mobile widths (`agent-browser`/`playwright-cli`, per the house verification convention this session already used for the base module):
1. As admin, set a guardian's rate to 16,000 with 2 children.
2. Click Record Payment, enter 48,000. Confirm the receipt shows 16,000 covering this month and 32,000 as credit; confirm the green "+32,000 prepaid" indicator appears on the row.
3. Enroll a 3rd child, update the rate to 24,000 via the pencil.
4. Click "Open next month". Confirm the new month shows fully paid (24,000, from credit) and credit dropped to 8,000.
5. Click "Open next month" again. Confirm the new month shows partial (8,000 collected, 16,000 still owed) and credit is 0.
6. Confirm "Collected this period" on each of these three month views only ever shows real cash received during that specific viewing period — never inflated by the credit auto-consumption in steps 4-5.
7. Click the Arrears card, confirm the drill-down lists the guardian with the correct still-owed amount and per-month "from credit"/"settled" detail.
8. Click Undo on the credit-settled month from step 4; confirm the guardian's credit balance goes back up by exactly the refunded amount.

- [ ] **Step 7: Commit**

```bash
git add resources/js/Components/MonthlyFees/RecordPaymentModal.jsx \
        resources/js/Pages/Fees/MonthlyFees/Index.jsx resources/js/Pages/Fees/MonthlyFees/GuardianShow.jsx
git commit -m "feat: add Record Payment modal, demote manual tools, and add credit/status visual treatment"
```

---

### Task 6: Final whole-branch review and full suite regression check

**Files:** none (verification only).

- [ ] **Step 1: Run the entire test suite**

Run: `php8.4 artisan test`
Expected: PASS — the pre-existing 275 tests plus this feature's new tests (roughly 25 across Tasks 1-3), all green, 0 failures.

- [ ] **Step 2: Run Pint on every file this plan touched**

Run: `./vendor/bin/pint app/Models/MonthlyFeePayment.php app/Models/MonthlyFeeSetting.php app/Models/MonthlyFeeEntry.php app/Models/Guardian.php app/Services/MonthlyFeeLedgerService.php app/Http/Controllers/MonthlyFeeController.php app/Http/Middleware/HandleInertiaRequests.php tests/Feature/MonthlyFeePaymentTest.php tests/Feature/MonthlyFeeLedgerServiceTest.php tests/Feature/MonthlyFeeControllerTest.php tests/Feature/MonthlyFeeTenantIsolationTest.php`
Expected: PASS, no style violations (or auto-fixed cleanly).

- [ ] **Step 3: If anything unrelated broke, stop and investigate before continuing**

Do not proceed to `finishing-a-development-branch` with a red suite.

---

## Self-Review Notes

- **Spec coverage:** oldest-first arrears allocation ✓ (Task 2 `recordPayment`), remaining-shortfall capping on the current month ✓ (Task 2, round-2 fix #1 test), leftover → credit ✓, defensive entry/settings creation ✓ (round-2 fix #2, round-3 fix #1 tests), credit consumption re-priced at the moment a month opens ✓ (Task 2, the exact §1 worked example reproduced as a test), mixed-funding undo split via `credit_applied` ✓ (round-3 fix #2 test), rate change still reaching a credit-only-settled entry ✓ (spec §4b fix #3 — Task 3's `updateExpected()` guard widened to `whereNull('amount_collected') OR amount_collected == credit_applied`, with its own dedicated test), `applyCreditToArrears` setting `credit_applied` ✓ (round-4 fix test), `creditRecognizedThisPeriod` keying off `credit_applied` not `recorded_by` ✓ (round-4 fix test), period boundaries tied to ledger open/close ✓ (Task 2 `periodBounds`/tests), concurrency locking ✓ (every method wrapped in `DB::transaction()`+`lockForUpdate()`), tenant isolation ✓ (Task 3 dedicated tests), analytics cards + drill-down UI ✓ (Task 4), Record Payment modal + demoted controls + stripe + credit indicator ✓ (Task 5).
- **Placeholder scan:** none found — every step has real, runnable code.
- **Type consistency:** `recordPayment(int $guardianId, float $amountReceived, int $recordedBy, ?string $receivedAt = null, ?string $notes = null): array` used identically in Task 2's tests, Task 3's controller call site. `applyCreditToArrears(int $guardianId, int $recordedBy): array` and `refundCredit(MonthlyFeeEntry $entry, int $recordedBy): void` likewise. Controller prop keys (`collectedThisPeriod`, `arrearsCollectedThisPeriod`, `creditRecognizedThisPeriod`, `arrearsActivity`, `rows[].credit_balance`, `creditBalance`) match exactly between Task 3's `index()`/`guardianShow()` and Tasks 4-5's React components.
- **No open gaps remaining** — every spec section, and every round-2/3/4 fix, now has both an implementation step and a dedicated test in the task that owns it.
- **Pre-flight conflict scan (post-write, pre-execution) found and fixed 4 defects, documented in the SDD ledger:** (1) six tests used `monthlyFeeSetting()->save(MonthlyFeeSetting::make()->fill())` to set `credit_balance`, which collides with `unique('guardian_id')` since `makeGuardianWithActiveChild(expectedFee: X>0)` already creates that row — fixed to `$guardian->monthlyFeeSetting->update([...])`. (2) Task 2's appended test file used bare `MonthlyFeePayment::` with no `use App\Models\MonthlyFeePayment;` import — added to Step 1. (3) `markPaid()`/`updateCollected()` were never actually wired to log cash despite the plan's own prose and self-review claiming they were — added a new public `MonthlyFeeLedgerService::recordManualCashChange()` method (Task 2, Steps 14a-14c, 2 new tests) and wired both controller actions to call it before updating the entry (Task 3, 2 new tests). (4) `undoPaid()`'s original arrears/current-month classification (`$entry->year !== null ? -$cashPortion : 0`) was always-true since `year` is non-nullable — replaced with a genuine `latestMonth()`-based current-month check, matching `recordManualCashChange()`'s pattern. All test-count cascades (Task 2: 10→16→18→20→22→24→29; Task 3: 10→19) re-verified consistent end-to-end via `grep -n "PASS, .* tests"` after the fixes.
