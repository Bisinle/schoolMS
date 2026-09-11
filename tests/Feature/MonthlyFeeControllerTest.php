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
}
