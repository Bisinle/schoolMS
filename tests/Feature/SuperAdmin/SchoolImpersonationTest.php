<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * SuperAdmin\SchoolController::impersonate() previously always picked
 * $school->users()->where('role','admin')->first() — no explicit ordering,
 * no way to choose a specific admin when a school has more than one.
 * 2026-08-26 decision: super_admin now picks from a list of the school's
 * admins (backed by the new admins() endpoint) and impersonates the one
 * actually selected.
 */
class SchoolImpersonationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admins_endpoint_returns_only_admin_role_users_for_the_school(): void
    {
        $superAdmin = User::factory()->create(['school_id' => null, 'role' => 'super_admin']);
        $school = School::factory()->create();

        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin', 'name' => 'Zoe Admin']);
        User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);

        $otherSchool = School::factory()->create();
        User::factory()->create(['school_id' => $otherSchool->id, 'role' => 'admin']);

        $response = $this->actingAs($superAdmin)
            ->getJson(route('super-admin.schools.admins', $school->id));

        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['id' => $admin->id, 'name' => 'Zoe Admin']);
    }

    public function test_super_admin_can_impersonate_a_specifically_selected_admin(): void
    {
        $superAdmin = User::factory()->create(['school_id' => null, 'role' => 'super_admin']);
        $school = School::factory()->create();

        // Two admins — before the fix, only the first found was ever reachable.
        User::factory()->create(['school_id' => $school->id, 'role' => 'admin', 'name' => 'First Admin']);
        $secondAdmin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin', 'name' => 'Second Admin']);

        $response = $this->actingAs($superAdmin)
            ->post(route('super-admin.schools.impersonate', $school->id), [
                'user_id' => $secondAdmin->id,
            ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($secondAdmin);
    }

    public function test_impersonate_rejects_a_user_id_from_another_school(): void
    {
        $superAdmin = User::factory()->create(['school_id' => null, 'role' => 'super_admin']);
        $school = School::factory()->create();
        $otherSchool = School::factory()->create();

        $otherSchoolAdmin = User::factory()->create(['school_id' => $otherSchool->id, 'role' => 'admin']);

        $response = $this->actingAs($superAdmin)
            ->post(route('super-admin.schools.impersonate', $school->id), [
                'user_id' => $otherSchoolAdmin->id,
            ]);

        $response->assertSessionHasErrors('error');
        $this->assertAuthenticatedAs($superAdmin);
    }

    public function test_impersonate_rejects_a_non_admin_user_id(): void
    {
        $superAdmin = User::factory()->create(['school_id' => null, 'role' => 'super_admin']);
        $school = School::factory()->create();

        $teacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);

        $response = $this->actingAs($superAdmin)
            ->post(route('super-admin.schools.impersonate', $school->id), [
                'user_id' => $teacher->id,
            ]);

        $response->assertSessionHasErrors('error');
        $this->assertAuthenticatedAs($superAdmin);
    }

    public function test_impersonate_requires_a_user_id(): void
    {
        $superAdmin = User::factory()->create(['school_id' => null, 'role' => 'super_admin']);
        $school = School::factory()->create();
        User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $response = $this->actingAs($superAdmin)
            ->post(route('super-admin.schools.impersonate', $school->id), []);

        $response->assertSessionHasErrors('user_id');
    }
}
