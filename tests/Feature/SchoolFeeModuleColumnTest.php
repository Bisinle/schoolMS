<?php

namespace Tests\Feature;

use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolFeeModuleColumnTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_school_created_with_no_explicit_fee_module_defaults_to_termly(): void
    {
        $school = School::factory()->create();

        // Eloquent does not reflect a DB-level column default on the
        // in-memory model immediately after create() — read it back fresh.
        $this->assertSame('termly', $school->fresh()->fee_module);
    }

    public function test_fee_module_is_mass_assignable(): void
    {
        $school = School::factory()->create(['fee_module' => 'monthly']);

        $this->assertSame('monthly', $school->fresh()->fee_module);
    }
}
