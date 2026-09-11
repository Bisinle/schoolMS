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

/**
 * BelongsToSchool's SchoolScope filters MonthlyFeeEntry/Guardian queries (and
 * implicit route-model binding, which uses the same scoped query) to the
 * authenticated user's school_id — so a cross-school id simply isn't found,
 * which surfaces as a 404, not a 403. Added per the final whole-branch
 * review's Fix 4: this module had no tenant-isolation test until now.
 */
class MonthlyFeeTenantIsolationTest extends TestCase
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

    public function test_admin_gets_404_marking_another_schools_entry_as_paid(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $adminA = $this->makeAdmin($schoolA);

        $schoolB = School::factory()->create();
        $guardianB = $this->makeGuardianWithActiveChild($schoolB, expectedFee: 20000);
        $this->actingAs($this->makeAdmin($schoolB))->get('/monthly-fees');
        $entryB = MonthlyFeeEntry::where('guardian_id', $guardianB->id)->first();

        $response = $this->actingAs($adminA)->post("/monthly-fees/entries/{$entryB->id}/mark-paid");

        $response->assertNotFound();
    }

    public function test_admin_gets_404_updating_another_schools_guardians_expected_fee(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $adminA = $this->makeAdmin($schoolA);

        $schoolB = School::factory()->create();
        $guardianB = $this->makeGuardianWithActiveChild($schoolB);

        $response = $this->actingAs($adminA)
            ->put("/monthly-fees/guardians/{$guardianB->id}/expected-fee", ['expected_fee' => 15000]);

        $response->assertNotFound();
    }

    public function test_index_never_includes_another_schools_guardian_rows(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $adminA = $this->makeAdmin($schoolA);
        $guardianA = $this->makeGuardianWithActiveChild($schoolA, expectedFee: 32000);

        $schoolB = School::factory()->create();
        $guardianB = $this->makeGuardianWithActiveChild($schoolB, expectedFee: 32000);

        // Sync school B's own open month for the same (year, month) so both
        // schools genuinely have entries to potentially leak.
        $this->actingAs($this->makeAdmin($schoolB))->get('/monthly-fees');

        $response = $this->actingAs($adminA)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('rows', 1)
            ->where('rows.0.guardian_id', $guardianA->id)
        );

        $guardianIds = MonthlyFeeEntry::where('school_id', $schoolA->id)->pluck('guardian_id');
        $this->assertNotContains($guardianB->id, $guardianIds);
    }

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

    public function test_credit_outstanding_never_sums_another_schools_credit_balances(): void
    {
        // Fix 3's new creditOutstanding query sums MonthlyFeeSetting.credit_balance
        // school-wide, outside the row set SchoolScope would otherwise filter
        // implicitly — it must explicitly filter by school_id itself.
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $adminA = $this->makeAdmin($schoolA);
        $guardianA = $this->makeGuardianWithActiveChild($schoolA, expectedFee: 16000);
        $this->actingAs($adminA)->get('/monthly-fees');
        $guardianA->monthlyFeeSetting->update(['credit_balance' => 3000]);

        $schoolB = School::factory()->create();
        $adminB = $this->makeAdmin($schoolB);
        $guardianB = $this->makeGuardianWithActiveChild($schoolB, expectedFee: 50000);
        $this->actingAs($adminB)->get('/monthly-fees');
        $guardianB->monthlyFeeSetting->update(['credit_balance' => 9000]);

        $response = $this->actingAs($adminA)->get('/monthly-fees');

        $response->assertInertia(fn ($page) => $page->where('creditOutstanding', 3000));
    }
}
