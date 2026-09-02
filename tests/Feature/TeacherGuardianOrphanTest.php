<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\School;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression coverage for the orphaned-profile bug: deleting a teacher or
 * guardian from the Users page (UserController -> UserManagementService)
 * only soft-deleted the `users` row and never touched the linked
 * `teachers`/`guardians` row, leaving a record with no resolvable user (a
 * blank "no name" row on the Teachers/Guardians index). Also covers
 * GuardianController::destroy(), which crashed outright
 * ("Call to a member function delete() on null") if that same orphan state
 * already existed.
 */
class TeacherGuardianOrphanTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleting_teacher_from_users_page_also_removes_teacher_profile(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        $response = $this->actingAs($admin)->delete("/users/{$teacherUser->id}");

        $response->assertRedirect(route('users.index'));

        $this->assertSoftDeleted('users', ['id' => $teacherUser->id]);
        // This is the bug: previously the teacher row survived untouched,
        // pointing at a now-invisible user.
        $this->assertSoftDeleted('teachers', ['id' => $teacher->id]);
    }

    public function test_deleting_guardian_from_users_page_also_removes_guardian_profile(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);

        $response = $this->actingAs($admin)->delete("/users/{$guardianUser->id}");

        $response->assertRedirect(route('users.index'));

        $this->assertSoftDeleted('users', ['id' => $guardianUser->id]);
        $this->assertSoftDeleted('guardians', ['id' => $guardian->id]);
    }

    public function test_deleting_guardian_from_guardians_page_soft_deletes_both_rows(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);

        $response = $this->actingAs($admin)->delete("/guardians/{$guardian->id}");

        $response->assertRedirect(route('guardians.index'));

        $this->assertSoftDeleted('guardians', ['id' => $guardian->id]);
        $this->assertSoftDeleted('users', ['id' => $guardianUser->id]);
    }

    public function test_deleting_guardian_whose_user_is_already_gone_does_not_crash(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);

        // Reproduce the pre-existing orphan state directly: the user is
        // gone, the guardian profile is still here pointing at it.
        $guardianUser->delete();

        $response = $this->actingAs($admin)->delete("/guardians/{$guardian->id}");

        // Previously this hit "Call to a member function delete() on null"
        // (GuardianController.php:169) - now it should complete cleanly.
        $response->assertRedirect(route('guardians.index'));
        $this->assertSoftDeleted('guardians', ['id' => $guardian->id]);
    }
}
