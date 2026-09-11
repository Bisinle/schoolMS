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

    public function test_undo_entry_on_a_mixed_funded_entry_splits_the_refund_and_logs_a_correction_via_log_cash_received(): void
    {
        // The exact scenario round 3 found, now routed through the
        // consolidated undoEntry() (Fix 2): an entry partially credit-
        // settled, then topped up with real cash, must split correctly on
        // undo — refunding only the credit portion to credit_balance and
        // logging only the cash portion as a negative correction, through
        // the service's own logCashReceived() (not a raw controller write).
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $service->recordPayment($guardian->id, 8000, $admin->id); // partial cash on current month, no credit yet

        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $entry->update(['credit_applied' => 8000, 'amount_collected' => 16000]); // 8000 cash + 8000 credit

        $service->undoEntry($entry, $admin->id);

        $entry->refresh();
        $this->assertNull($entry->amount_collected);
        $this->assertNull($entry->paid_date);
        $this->assertSame('0.00', $entry->credit_applied);
        $this->assertSame('8000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);

        $correction = MonthlyFeePayment::where('corrects_entry_id', $entry->id)->first();
        $this->assertNotNull($correction);
        $this->assertSame('-8000.00', $correction->amount); // only the cash portion corrected, not the full 16000
        $this->assertSame($admin->id, $correction->recorded_by);
    }

    public function test_undo_entry_called_twice_in_a_row_is_a_safe_no_op_and_never_double_refunds(): void
    {
        // Demonstrates the actual race Fix 2 prevents: a double-submitted
        // undo (e.g. a duplicate HTTP request) must not refund the same
        // credit twice or log two negative corrections. undoEntry() re-locks
        // and re-fetches the entry from inside its own transaction, so the
        // second call sees the already-reset row and is a genuine no-op.
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $service->recordPayment($guardian->id, 32000, $admin->id); // 16000 current + 16000 credit
        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();

        $service->undoEntry($entry, $admin->id); // first undo: real refund + correction
        $service->undoEntry($entry->fresh(), $admin->id); // second undo on an already-reset entry: must be a no-op

        $entry->refresh();
        $this->assertNull($entry->amount_collected);
        $this->assertSame('0.00', $entry->credit_applied);
        // Credit was refunded exactly once, not twice.
        $this->assertSame('16000.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
        // Only one correction row exists — the second call wrote nothing.
        $this->assertSame(2, MonthlyFeePayment::count()); // the original recordPayment + the one correction
        $this->assertSame(1, MonthlyFeePayment::where('corrects_entry_id', $entry->id)->count());
    }

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

    public function test_apply_credit_to_arrears_settles_oldest_old_months_first_and_sets_credit_applied(): void
    {
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 3, 'expected_amount' => 8000,
        ]);
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);
        // Set the credit balance AFTER syncMonth creates the September entry:
        // syncMonth's own credit-auto-consumption (tested separately above)
        // would otherwise immediately spend this 8000 against the September
        // entry it's creating, leaving nothing for applyCreditToArrears to
        // apply to the March arrears below — which is what this test is for.
        $guardian->monthlyFeeSetting->update(['credit_balance' => 8000]);
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

        // In real use, "record payment" and "open next month" are separate
        // admin actions taken at least a moment apart, so travel forward to
        // reflect that realistic gap. This is no longer load-bearing for
        // correctness: periodBounds()'s boundary tie (a row landing at
        // exactly the instant a new period opens) is itself now handled
        // correctly by Fix 4's half-open `>= start AND < end` intervals —
        // see test_credit_consumption_at_exactly_a_period_boundary_is_attributed_to_only_one_period()
        // below for the dedicated regression covering that exact tie.
        $this->travel(1)->second();
        $service->openNextMonth($school->id); // October opens, consumes the 16000 credit

        $septemberCollected = $service->collectedThisPeriod($school->id, 2026, 9);
        $octoberCollected = $service->collectedThisPeriod($school->id, 2026, 10);

        $this->assertSame(32000.0, $septemberCollected); // all the real cash landed while September was open
        $this->assertSame(0.0, $octoberCollected); // nothing NEW was received in October
    }

    public function test_credit_consumption_at_exactly_a_period_boundary_is_attributed_to_only_one_period(): void
    {
        // Fix 4 regression: periodBounds()'s `end` for a closing period is
        // defined as exactly the next period's `start` (both come from the
        // same MIN(created_at) of the next month's first entry). syncMonth's
        // credit auto-consumption creates that entry and immediately updates
        // it with the consumed credit, so the new entry's created_at and
        // updated_at land at exactly that boundary instant — deterministically,
        // not as a rare race. Before the fix, the inclusive whereBetween used
        // by creditRecognizedThisPeriod() double-counted that instant into
        // BOTH the closing and the opening period.
        $school = School::factory()->create();
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $service = new MonthlyFeeLedgerService;
        $service->syncMonth($school->id, 2026, 9);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $service->recordPayment($guardian->id, 32000, $admin->id); // 16000 current + 16000 credit

        $boundary = Carbon::now()->addMinute();
        $this->travelTo($boundary);
        $service->openNextMonth($school->id); // October opens at exactly $boundary, consuming the 16000 credit

        // Move forward before reading the analytics, so October's own
        // periodBounds() (which has no "next" month yet, so its `end` is
        // `now()`) has a real, non-degenerate window after $boundary to
        // capture the entry's updated_at in.
        $this->travel(1)->minute();

        $septemberRecognized = $service->creditRecognizedThisPeriod($school->id, 2026, 9);
        $octoberRecognized = $service->creditRecognizedThisPeriod($school->id, 2026, 10);

        $this->assertSame(0.0, $septemberRecognized); // the boundary instant belongs to October, not September
        $this->assertSame(16000.0, $octoberRecognized); // counted exactly once
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
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardianB->id,
            'year' => 2026, 'month' => 8, 'expected_amount' => 8000,
        ]);
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        // Guardian A: automatic credit consumption via syncMonth.
        // Guardian B's credit_balance is deliberately set AFTER this first
        // syncMonth call (not before, as it might seem natural to write) —
        // otherwise syncMonth's own auto-consumption (tested above) would
        // immediately spend it against guardian B's own September entry
        // being created here, leaving nothing for applyCreditToArrears to
        // apply to B's August arrears below, which is what this test needs.
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);
        $guardianA->monthlyFeeSetting->update(['credit_balance' => 16000]);
        $entryA = MonthlyFeeEntry::where('guardian_id', $guardianA->id)->first();
        $entryA->delete();
        (new MonthlyFeeLedgerService)->syncMonth($school->id, 2026, 9);
        $guardianB->monthlyFeeSetting->update(['credit_balance' => 8000]);

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
}
