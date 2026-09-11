<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeeModuleGatingTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(string $feeModule): User
    {
        $school = School::factory()->create(['fee_module' => $feeModule]);

        return User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
    }

    private function makeGuardian(string $feeModule): User
    {
        $school = School::factory()->create(['fee_module' => $feeModule]);

        return User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
    }

    // --- A monthly-module school gets 404 on every termly route ---

    public function test_monthly_school_admin_gets_404_on_fees_dashboard(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/fees')->assertNotFound();
    }

    public function test_monthly_school_admin_gets_404_on_fees_bulk_generate(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/fees/bulk-generate')->assertNotFound();
    }

    public function test_monthly_school_admin_gets_404_on_invoices(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/invoices')->assertNotFound();
    }

    public function test_monthly_school_admin_gets_404_on_tuition_fees(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/tuition-fees')->assertNotFound();
    }

    public function test_monthly_school_admin_gets_404_on_universal_fees(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/universal-fees')->assertNotFound();
    }

    public function test_monthly_school_admin_gets_404_on_fee_preferences(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/fee-preferences')->assertNotFound();
    }

    public function test_monthly_school_guardian_gets_404_on_guardian_invoices(): void
    {
        $guardian = $this->makeGuardian('monthly');

        $this->actingAs($guardian)->get('/guardian/invoices')->assertNotFound();
    }

    // --- A termly-module school gets 404 on every monthly route ---

    public function test_termly_school_admin_gets_404_on_monthly_fees(): void
    {
        $admin = $this->makeAdmin('termly');

        $this->actingAs($admin)->get('/monthly-fees')->assertNotFound();
    }

    public function test_termly_school_guardian_gets_404_on_guardian_monthly_fees(): void
    {
        $guardian = $this->makeGuardian('termly');

        $this->actingAs($guardian)->get('/guardian/monthly-fees')->assertNotFound();
    }

    // --- Each module's own routes stay reachable on its own school ---

    public function test_termly_school_admin_can_reach_fees_dashboard(): void
    {
        $admin = $this->makeAdmin('termly');

        $this->actingAs($admin)->get('/fees')->assertOk();
    }

    public function test_monthly_school_admin_can_reach_monthly_fees(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/monthly-fees')->assertOk();
    }

    // --- Transport Routes is shared, ungated, reachable regardless ---

    public function test_termly_school_admin_can_reach_transport_routes(): void
    {
        $admin = $this->makeAdmin('termly');

        $this->actingAs($admin)->get('/transport-routes')->assertOk();
    }

    public function test_monthly_school_admin_can_reach_transport_routes(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/transport-routes')->assertOk();
    }
}
