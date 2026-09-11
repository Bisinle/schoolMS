<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonthlyFeeHolidayMonthsControllerTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(School $school): User
    {
        return User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
    }

    public function test_admin_can_set_the_schools_holiday_months(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);

        $response = $this->actingAs($admin)
            ->put('/monthly-fees/holiday-months', ['holiday_months' => [7, 8]]);

        $response->assertRedirect();
        $this->assertSame([7, 8], $school->fresh()->holiday_months);
    }

    public function test_holiday_months_accepts_a_non_contiguous_set(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);

        $this->actingAs($admin)->put('/monthly-fees/holiday-months', ['holiday_months' => [4, 8, 11, 12]]);

        $this->assertSame([4, 8, 11, 12], $school->fresh()->holiday_months);
    }

    public function test_holiday_months_rejects_an_out_of_range_month(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']);
        $admin = $this->makeAdmin($school);

        $response = $this->actingAs($admin)
            ->put('/monthly-fees/holiday-months', ['holiday_months' => [0, 13]]);

        $response->assertSessionHasErrors();
        $this->assertNull($school->fresh()->holiday_months);
    }

    public function test_holiday_months_can_be_cleared_back_to_an_empty_set(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly', 'holiday_months' => [7, 8]]);
        $admin = $this->makeAdmin($school);

        $this->actingAs($admin)->put('/monthly-fees/holiday-months', ['holiday_months' => []]);

        $this->assertSame([], $school->fresh()->holiday_months);
    }

    public function test_index_exposes_the_schools_current_holiday_months(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly', 'holiday_months' => [7, 8]]);
        $admin = $this->makeAdmin($school);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('holidayMonths', [7, 8]));
    }

    public function test_index_exposes_an_empty_array_when_no_holiday_months_are_configured(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'monthly']); // holiday_months left null
        $admin = $this->makeAdmin($school);

        $response = $this->actingAs($admin)->get('/monthly-fees');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('holidayMonths', []));
    }

    public function test_termly_school_gets_404_on_the_holiday_months_route(): void
    {
        $this->withoutVite();
        $school = School::factory()->create(['fee_module' => 'termly']);
        $admin = $this->makeAdmin($school);

        $response = $this->actingAs($admin)
            ->put('/monthly-fees/holiday-months', ['holiday_months' => [7, 8]]);

        $response->assertNotFound();
    }
}
