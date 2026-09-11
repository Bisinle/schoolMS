<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\MonthlyFeeSetting;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonthlyFeeControllerTest extends TestCase
{
    use RefreshDatabase;

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
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 32000);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('rows.data', 1)
            ->where('rows.data.0.guardian_id', $guardian->id)
            ->where('rows.data.0.status', 'unpaid')
        );
    }

    public function test_update_expected_fee_also_fixes_the_currently_open_unpaid_entry(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
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

    public function test_update_expected_fee_never_touches_a_holiday_months_entry(): void
    {
        $this->withoutVite();
        $currentMonth = now()->month;
        $school = School::factory()->create(['fee_module' => 'monthly', 'holiday_months' => [$currentMonth]]);
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);

        $this->actingAs($admin)->get('/monthly-fees'); // syncs the open (holiday) month
        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $this->assertTrue($entry->is_holiday);
        $this->assertSame('0.00', $entry->expected_amount);

        $this->actingAs($admin)
            ->put("/monthly-fees/guardians/{$guardian->id}/expected-fee", ['expected_fee' => 24000])
            ->assertRedirect();

        // A rate change must never overwrite a holiday month's permanent
        // zero-expected-amount, even though its amount_collected is null
        // and would otherwise match the "untouched by real cash" guard.
        $this->assertSame('0.00', $entry->fresh()->expected_amount);
        $this->assertTrue($entry->fresh()->is_holiday);
    }

    public function test_mark_paid_sets_collected_to_expected_amount(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
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
        $school = School::factory()->create(['fee_module' => 'monthly']);
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
        $school = School::factory()->create(['fee_module' => 'monthly']);
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
        $school = School::factory()->create(['fee_module' => 'monthly']);
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
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $this->makeGuardianWithActiveChild($school, expectedFee: 32000);
        $this->actingAs($admin)->get('/monthly-fees');

        $response = $this->actingAs($admin)->post('/monthly-fees/open-next-month');

        $response->assertRedirect();
        $this->assertSame(2, MonthlyFeeEntry::count());
    }

    public function test_browsing_a_closed_month_does_not_inject_a_newly_joined_guardian(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $this->makeGuardianWithActiveChild($school, expectedFee: 32000);

        // Sync and close out the current month by opening the next one.
        $this->actingAs($admin)->get('/monthly-fees');
        $closedEntry = MonthlyFeeEntry::first();
        $closedYear = $closedEntry->year;
        $closedMonth = $closedEntry->month;
        $this->actingAs($admin)->post('/monthly-fees/open-next-month');

        // A new guardian joins after the month was closed.
        $newGuardian = $this->makeGuardianWithActiveChild($school, expectedFee: 20000);

        $response = $this->actingAs($admin)->get("/monthly-fees?year={$closedYear}&month={$closedMonth}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('isOpenMonth', false)
            ->has('rows.data', 1)
        );
        $this->assertFalse(
            MonthlyFeeEntry::where('year', $closedYear)->where('month', $closedMonth)
                ->where('guardian_id', $newGuardian->id)->exists()
        );
    }

    public function test_guardian_can_view_their_own_current_month(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);

        $response = $this->actingAs($guardian->user)->get('/guardian/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('guardianName', $guardian->full_name)
            // json_encode() of a whole-number PHP float drops the trailing
            // ".0" (e.g. 16000.0 -> "16000"), so it round-trips through
            // Inertia's JSON payload as an int; assertInertia's where()
            // uses assertSame, so the expectation must match that int.
            ->where('expectedAmount', 16000)
        );
    }

    public function test_guardian_show_creates_its_own_holiday_aware_entry_when_none_exists_yet(): void
    {
        $this->withoutVite();
        // Deliberately no admin ledger page load and no syncMonth() call
        // first — this guardian's own portal is the very first thing to
        // ever create their entry for the currently-open (holiday) month.
        // This is the same gap as recordPayment()'s: guardianShow() has its
        // own independent firstOrCreate that must be just as holiday-aware
        // as syncMonth()'s.
        $currentMonth = now()->month;
        $school = School::factory()->create(['fee_module' => 'monthly', 'holiday_months' => [$currentMonth]]);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);

        $response = $this->actingAs($guardian->user)->get('/guardian/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('expectedAmount', 0)
            ->where('amountDue', 0)
            ->where('status', 'holiday')
        );

        $entry = MonthlyFeeEntry::where('guardian_id', $guardian->id)->first();
        $this->assertTrue($entry->is_holiday);
        $this->assertSame('0.00', $entry->expected_amount);
    }

    public function test_index_shows_outstanding_balance_and_total_due_from_a_past_unpaid_month(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);

        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2027, 'month' => 1, 'expected_amount' => 8000, 'amount_collected' => null,
        ]);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2027, 'month' => 2, 'expected_amount' => 8000, 'amount_collected' => null,
        ]);

        $response = $this->actingAs($admin)->get('/monthly-fees?year=2027&month=2');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('rows.data.0.expected_amount', 8000)
            ->where('rows.data.0.outstanding_balance', 8000)
            ->where('rows.data.0.total_due', 16000)
        );
    }

    public function test_guardian_amount_due_includes_outstanding_balance_from_a_past_unpaid_month(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);

        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2027, 'month' => 1, 'expected_amount' => 8000, 'amount_collected' => null,
        ]);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2027, 'month' => 2, 'expected_amount' => 8000, 'amount_collected' => null,
        ]);

        $response = $this->actingAs($guardian->user)->get('/guardian/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('expectedAmount', 8000)
            ->where('outstandingBalance', 8000)
            ->where('amountDue', 16000)
        );
    }

    public function test_record_payment_settles_arrears_and_current_month_and_flashes_a_receipt(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 8, 'expected_amount' => 16000,
        ]);
        // Advance the ledger past August so it becomes genuine arrears,
        // distinct from the newly-opened "current" month (September) that
        // the rest of the payment should apply to. A bare get('/monthly-fees')
        // would NOT do this: latestMonth() treats the just-created August
        // entry itself as the open month (it's already the latest entry in
        // the table), so August would be synced as "current" rather than
        // treated as arrears before it.
        $this->actingAs($admin)->post('/monthly-fees/open-next-month');

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
        $school = School::factory()->create(['fee_module' => 'monthly']);
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
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 8, 'expected_amount' => 8000,
        ]);
        // Advance past August (making it genuine arrears, distinct from the
        // new "current" month) *before* granting the credit balance — doing
        // it after would let September's own sync auto-consume the credit
        // via syncMonth()'s own credit-consumption step, defeating the point
        // of this test (crediting must only ever happen when explicitly
        // triggered via apply-credit).
        $this->actingAs($admin)->post('/monthly-fees/open-next-month');
        $guardian->monthlyFeeSetting->update(['credit_balance' => 8000]);

        $response = $this->actingAs($admin)->post("/monthly-fees/guardians/{$guardian->id}/apply-credit");

        $response->assertRedirect();
        $august = MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 8)->first();
        $this->assertSame('8000.00', $august->amount_collected);
        $this->assertSame('0.00', $guardian->monthlyFeeSetting->fresh()->credit_balance);
    }

    public function test_undo_on_a_mixed_funded_entry_splits_the_refund_and_correction(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
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
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $this->actingAs($admin)->get('/monthly-fees');
        $this->actingAs($admin)->post("/monthly-fees/guardians/{$guardian->id}/record-payment", ['amount' => 16000]);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('collectedThisPeriod', 16000)
            ->has('arrearsActivity')
            ->where('rows.data.0.credit_balance', 0)
        );
    }

    public function test_credit_outstanding_is_school_wide_and_includes_a_guardian_with_no_row_in_the_viewed_month(): void
    {
        // Spec round-3 fix #8: creditOutstanding must sum credit_balance
        // across every guardian at the school, including one with no entry
        // at all in the currently-viewed month (e.g. their last child
        // withdrew after the credit was earned) — a client-side sum over
        // `rows` would silently drop that guardian's stranded credit.
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $visibleGuardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $this->actingAs($admin)->get('/monthly-fees');
        $visibleGuardian->monthlyFeeSetting->update(['credit_balance' => 3000]);

        // A guardian with stranded credit but no active student (so
        // syncMonth never creates a row for them this month, and they never
        // appear in `rows`).
        $strandedUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $strandedGuardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $strandedUser->id, 'status' => 'active']);
        MonthlyFeeSetting::create(['school_id' => $school->id, 'guardian_id' => $strandedGuardian->id, 'expected_fee' => 0, 'credit_balance' => 5000]);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('rows.data', 1) // the stranded guardian never appears here
            ->where('creditOutstanding', 8000) // but their credit is still counted
        );
    }

    public function test_guardian_show_exposes_credit_balance(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
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
        $school = School::factory()->create(['fee_module' => 'monthly']);
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
        $school = School::factory()->create(['fee_module' => 'monthly']);
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

    public function test_index_survives_a_soft_deleted_guardian_with_unresolved_arrears(): void
    {
        // A guardian can be soft-deleted (e.g. all their children withdrew)
        // while still owing an old month's fees. That debt is still real,
        // but there's no guardian record left to act on from the arrears
        // drill-down, so it must be excluded from that display rather than
        // crashing the whole page for the school.
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 8000);
        MonthlyFeeEntry::create([
            'school_id' => $school->id, 'guardian_id' => $guardian->id,
            'year' => 2026, 'month' => 8, 'expected_amount' => 8000, 'amount_collected' => null,
        ]);
        $this->actingAs($admin)->post('/monthly-fees/open-next-month'); // opens September, past August's arrears

        $guardian->delete(); // soft-delete

        // Browse October — a month that was never opened for this guardian
        // (they were deleted before it could be), so this exercises the
        // arrears drill-down finding their old unresolved August entry
        // without also touching the unrelated "current month row" path.
        $response = $this->actingAs($admin)->get('/monthly-fees?year=2026&month=10');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('arrearsActivity', [])
        );
        $this->assertTrue(
            MonthlyFeeEntry::where('guardian_id', $guardian->id)->where('year', 2026)->where('month', 8)->exists()
        );
    }

    public function test_update_collected_logs_only_the_delta_to_the_cash_ledger(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
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

    public function test_index_stops_offering_a_new_month_to_a_guardian_whose_user_account_is_deactivated(): void
    {
        // Deactivating a login (users.is_active) is a distinct action from
        // guardian.status, which this fix must not touch or duplicate.
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $guardian->user->update(['is_active' => false]);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('rows.data', 0));
        $this->assertSame(0, MonthlyFeeEntry::where('guardian_id', $guardian->id)->count());
    }

    public function test_index_hides_an_already_existing_entry_once_the_guardians_user_account_is_deactivated(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $this->actingAs($admin)->get('/monthly-fees'); // creates the open-month entry while still active

        $guardian->user->update(['is_active' => false]);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('rows.data', 0));
        // The entry itself is untouched — only hidden from this view.
        $this->assertSame(1, MonthlyFeeEntry::where('guardian_id', $guardian->id)->count());
    }

    public function test_index_hides_a_guardian_once_all_their_children_become_inactive_even_with_an_existing_entry(): void
    {
        // syncMonth() never retroactively touches an existing entry, so a
        // guardian whose children were active when the month opened keeps
        // that entry even after they all later become inactive. Nothing
        // left to bill them for, so stop showing them on this page too.
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $this->actingAs($admin)->get('/monthly-fees'); // creates the entry while the child is still active

        Student::where('guardian_id', $guardian->id)->update(['status' => 'inactive']);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('rows.data', 0));
        $this->assertSame(1, MonthlyFeeEntry::where('guardian_id', $guardian->id)->count());
    }

    public function test_index_still_shows_a_guardian_whose_own_status_is_active_but_unrelated_to_user_activation(): void
    {
        // Regression guard: this fix must key off users.is_active only,
        // never interact with guardians.status, which is a separate,
        // pre-existing system this change must not touch.
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        $guardian = $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        $this->assertSame('active', $guardian->status);
        $this->assertTrue($guardian->user->is_active);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('rows.data', 1));
    }

    public function test_index_paginates_rows_ten_per_page_matching_the_rest_of_the_app(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        for ($i = 0; $i < 15; $i++) {
            $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        }

        $firstPage = $this->actingAs($admin)->get('/monthly-fees');

        $firstPage->assertOk();
        $firstPage->assertInertia(fn ($page) => $page
            ->has('rows.data', 10)
            ->where('rows.total', 15)
            ->where('rows.current_page', 1)
            ->where('rows.last_page', 2)
        );

        $secondPage = $this->actingAs($admin)->get('/monthly-fees?page=2');

        $secondPage->assertOk();
        $secondPage->assertInertia(fn ($page) => $page
            ->has('rows.data', 5)
            ->where('rows.current_page', 2)
        );
    }

    public function test_index_analytics_reflect_the_full_month_not_just_the_current_page(): void
    {
        // The regression this test protects: analytics must be computed
        // from every row in the month, not just whichever page happens to
        // be showing — otherwise paginating would silently make these
        // numbers wrong.
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);
        for ($i = 0; $i < 12; $i++) {
            $this->makeGuardianWithActiveChild($school, expectedFee: 16000);
        }

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('rows.data', 10) // only page 1 renders...
            ->where('unpaidGuardianCount', 12) // ...but the count covers all 12
            ->where('totalExpectedThisPeriod', 192000) // 12 * 16000
        );
    }
}
