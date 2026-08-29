<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 6 Batch 0 (Foundation): HandleInertiaRequests now shares
 * auth.user.permissions (from Spatie's $user->getAllPermissions()) alongside
 * the existing auth.user.role, for the new usePermissions() JS hook. This
 * confirms the prop is actually populated correctly per role, not just that
 * the build succeeds — there's no frontend test suite to catch this
 * otherwise.
 */
class SharedPermissionsPropTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_receives_88_permissions_and_no_super_admin_permissions(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $response = $this->actingAs($admin)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('auth.user.role', 'admin')
            ->has('auth.user.permissions', 88)
            ->where('auth.user.permissions', fn ($permissions) => collect($permissions)
                ->every(fn ($p) => ! str_starts_with($p, 'super-admin.')))
        );
    }

    public function test_guardian_receives_only_guardian_scoped_permissions(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $guardian = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);

        $response = $this->actingAs($guardian)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('auth.user.role', 'guardian')
            ->has('auth.user.permissions', 14)
            ->where('auth.user.permissions', fn ($permissions) => collect($permissions)->contains('fees.view-own-invoices')
                && ! collect($permissions)->contains('students.delete'))
        );
    }

    public function test_role_prop_still_present_alongside_permissions(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);

        $response = $this->actingAs($teacher)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('auth.user.role', 'teacher')
            ->has('auth.user.permissions', 40)
        );
    }
}
