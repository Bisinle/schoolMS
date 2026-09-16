<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonthlyFeeEntryStatusTest extends TestCase
{
    use RefreshDatabase;

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
