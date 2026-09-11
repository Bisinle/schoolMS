<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolFeeModuleFormTest extends TestCase
{
    use RefreshDatabase;

    private function makeSuperAdmin(): User
    {
        return User::factory()->create(['school_id' => null, 'role' => 'super_admin']);
    }

    public function test_creating_a_school_persists_the_chosen_fee_module(): void
    {
        $this->withoutVite();
        $superAdmin = $this->makeSuperAdmin();

        $response = $this->actingAs($superAdmin)->post('/super-admin/schools', [
            'name' => 'Test School',
            'admin_name' => 'Admin Person',
            'admin_email' => 'admin@testschool.example',
            'status' => 'trial',
            'school_type' => 'islamic_school',
            'fee_module' => 'monthly',
            'password_option' => 'auto',
            'send_email' => false,
        ]);

        $response->assertRedirect();
        $school = School::where('admin_email', 'admin@testschool.example')->firstOrFail();
        $this->assertSame('monthly', $school->fee_module);
    }

    public function test_creating_a_school_without_fee_module_fails_validation(): void
    {
        $this->withoutVite();
        $superAdmin = $this->makeSuperAdmin();

        $response = $this->actingAs($superAdmin)->post('/super-admin/schools', [
            'name' => 'Test School',
            'admin_name' => 'Admin Person',
            'admin_email' => 'admin2@testschool.example',
            'status' => 'trial',
            'school_type' => 'islamic_school',
            'password_option' => 'auto',
            'send_email' => false,
        ]);

        $response->assertSessionHasErrors('fee_module');
    }

    public function test_editing_a_school_can_switch_its_fee_module(): void
    {
        $this->withoutVite();
        $superAdmin = $this->makeSuperAdmin();
        $school = School::factory()->create(['fee_module' => 'termly']);

        $response = $this->actingAs($superAdmin)->put("/super-admin/schools/{$school->id}", [
            'name' => $school->name,
            'admin_name' => $school->admin_name,
            'admin_email' => $school->admin_email,
            'status' => $school->status,
            'school_type' => $school->school_type,
            'fee_module' => 'monthly',
            'is_active' => 1,
        ]);

        $response->assertRedirect();
        $this->assertSame('monthly', $school->fresh()->fee_module);
    }
}
