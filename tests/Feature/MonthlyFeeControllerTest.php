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

    public function test_browsing_a_closed_month_does_not_inject_a_newly_joined_guardian(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
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
            ->has('rows', 1)
        );
        $this->assertFalse(
            MonthlyFeeEntry::where('year', $closedYear)->where('month', $closedMonth)
                ->where('guardian_id', $newGuardian->id)->exists()
        );
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
            // json_encode() of a whole-number PHP float drops the trailing
            // ".0" (e.g. 16000.0 -> "16000"), so it round-trips through
            // Inertia's JSON payload as an int; assertInertia's where()
            // uses assertSame, so the expectation must match that int.
            ->where('expectedAmount', 16000)
        );
    }

    public function test_index_shows_outstanding_balance_and_total_due_from_a_past_unpaid_month(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
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
            ->where('rows.0.expected_amount', 8000)
            ->where('rows.0.outstanding_balance', 8000)
            ->where('rows.0.total_due', 16000)
        );
    }

    public function test_guardian_amount_due_includes_outstanding_balance_from_a_past_unpaid_month(): void
    {
        $this->withoutVite();
        $school = School::factory()->create();
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
        $school = School::factory()->create();
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
}
