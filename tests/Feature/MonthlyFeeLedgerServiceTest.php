<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\MonthlyFeePayment;
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

        // $guardian->monthlyFeeSetting was accessed above (and cached as null
        // by the assertNull check) before recordPayment() created the row, so
        // we must re-fetch the guardian rather than reuse the cached relation.
        $this->assertSame('16000.00', $guardian->fresh()->monthlyFeeSetting->credit_balance);
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
}
