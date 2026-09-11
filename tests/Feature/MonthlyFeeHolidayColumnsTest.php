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
