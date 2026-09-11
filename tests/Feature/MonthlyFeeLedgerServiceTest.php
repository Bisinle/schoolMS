<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\MonthlyFeeSetting;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Services\MonthlyFeeLedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class MonthlyFeeLedgerServiceTest extends TestCase
{
    use RefreshDatabase;

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

        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);

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

        $service = new MonthlyFeeLedgerService;
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

        $service = new MonthlyFeeLedgerService;
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

        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);

        $this->assertSame(0, MonthlyFeeEntry::where('year', 2026)->where('month', 9)->count());
    }

    public function test_latest_month_defaults_to_current_calendar_month_when_ledger_never_opened(): void
    {
        $school = School::factory()->create();
        $now = Carbon::now();

        $latest = (new MonthlyFeeLedgerService)->latestMonth($school->id);

        $this->assertSame($now->year, $latest['year']);
        $this->assertSame($now->month, $latest['month']);
    }

    public function test_open_next_month_advances_and_syncs_the_new_month(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 32000);

        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 9);

        $next = $service->openNextMonth($school->id);

        $this->assertSame(2026, $next['year']);
        $this->assertSame(10, $next['month']);
        $this->assertNotNull(
            MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 10)->first()
        );
    }

    public function test_outstanding_balance_sums_unpaid_and_partial_months_before_the_given_month(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);

        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2027, 'month' => 1, 'expected_amount' => 8000, 'amount_collected' => null,
        ]);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2027, 'month' => 2, 'expected_amount' => 8000, 'amount_collected' => 3000,
        ]);

        $balance = (new MonthlyFeeLedgerService)->outstandingBalanceFor($guardian->id, 2027, 3);

        $this->assertSame(13000.0, $balance);
    }

    public function test_outstanding_balance_excludes_the_month_being_viewed_and_fully_paid_months(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);

        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2027, 'month' => 1, 'expected_amount' => 8000, 'amount_collected' => 8000,
        ]);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2027, 'month' => 2, 'expected_amount' => 8000, 'amount_collected' => null,
        ]);

        // Viewing February itself: January (fully paid) contributes nothing,
        // and February's own shortfall must not count against itself.
        $balance = (new MonthlyFeeLedgerService)->outstandingBalanceFor($guardian->id, 2027, 2);

        $this->assertSame(0.0, $balance);
    }

    public function test_outstanding_balance_never_goes_negative_from_a_past_overpayment(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);

        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2027, 'month' => 1, 'expected_amount' => 8000, 'amount_collected' => 12000,
        ]);

        $balance = (new MonthlyFeeLedgerService)->outstandingBalanceFor($guardian->id, 2027, 2);

        $this->assertSame(0.0, $balance);
    }

    public function test_outstanding_balances_for_school_computes_every_guardian_in_one_pass(): void
    {
        $school = School::factory()->create();
        $behind = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);
        $current = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);

        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $behind->id,
            'year' => 2027, 'month' => 1, 'expected_amount' => 8000, 'amount_collected' => null,
        ]);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $current->id,
            'year' => 2027, 'month' => 1, 'expected_amount' => 8000, 'amount_collected' => 8000,
        ]);

        $balances = (new MonthlyFeeLedgerService)->outstandingBalancesForSchool($school->id, 2027, 2);

        $this->assertSame(8000.0, $balances[$behind->id]);
        $this->assertSame(0.0, $balances[$current->id]);
    }
}
