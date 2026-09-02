<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\School;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression coverage for the cross-school duplicate-email 500
 * (SQLSTATE[23000] ... users.users_email_unique). users.email is a global
 * unique column (login resolves by email alone, with no school selector -
 * see LoginRequest::authenticate()), but TeacherController/GuardianController
 * /UserController validation used to scope the uniqueness check to the
 * current school only, so a second school could pass validation and then
 * hit the raw database constraint. Validation is now global, and a
 * best-effort safety net turns any duplicate that still reaches the
 * database into a normal field error instead of a 500.
 */
class DuplicateEmailAcrossSchoolsTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_teacher_with_email_used_in_another_school_fails_validation_not_500(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $existingUser = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'teacher', 'email' => 'shared@example.com']);
        Teacher::factory()->create(['school_id' => $schoolA->id, 'user_id' => $existingUser->id]);

        $schoolB = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'admin']);
        $subject = Subject::factory()->create(['school_id' => $schoolB->id]);

        $response = $this->actingAs($admin)->post('/teachers', [
            'name' => 'New Teacher',
            'email' => 'shared@example.com',
            'password' => 'password123',
            'phone_number' => '0700000000',
            'subject_id' => $subject->id,
            'subject_ids' => [$subject->id],
            'status' => 'active',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertDatabaseMissing('users', ['email' => 'shared@example.com', 'school_id' => $schoolB->id]);
    }

    public function test_creating_guardian_with_email_used_in_another_school_fails_validation_not_500(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $existingUser = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'guardian', 'email' => 'shared.guardian@example.com']);
        Guardian::factory()->create(['school_id' => $schoolA->id, 'user_id' => $existingUser->id]);

        $schoolB = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'admin']);

        $response = $this->actingAs($admin)->post('/guardians', [
            'name' => 'New Guardian',
            'email' => 'shared.guardian@example.com',
            'password' => 'password123',
            'phone_number' => '0700000001',
            'relationship' => 'parent',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertDatabaseMissing('users', ['email' => 'shared.guardian@example.com', 'school_id' => $schoolB->id]);
    }

    public function test_creating_user_with_email_used_in_another_school_fails_validation_not_500(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        User::factory()->create(['school_id' => $schoolA->id, 'role' => 'guardian', 'email' => 'shared.user@example.com']);

        $schoolB = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'admin']);

        $response = $this->actingAs($admin)->post('/users', [
            'name' => 'New User',
            'email' => 'shared.user@example.com',
            'role' => 'guardian',
            'password_setup_method' => 'generate',
            'must_change_password' => true,
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertDatabaseMissing('users', ['email' => 'shared.user@example.com', 'school_id' => $schoolB->id]);
    }

    public function test_updating_teacher_email_to_one_used_in_another_school_fails_validation_not_500(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $otherUser = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'teacher', 'email' => 'taken@example.com']);
        Teacher::factory()->create(['school_id' => $schoolA->id, 'user_id' => $otherUser->id]);

        $schoolB = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'teacher', 'email' => 'original@example.com']);
        $teacher = Teacher::factory()->create(['school_id' => $schoolB->id, 'user_id' => $teacherUser->id]);
        $subject = Subject::factory()->create(['school_id' => $schoolB->id]);

        $response = $this->actingAs($admin)->put("/teachers/{$teacher->id}", [
            'name' => $teacherUser->name,
            'email' => 'taken@example.com',
            'phone_number' => '0700000002',
            'subject_id' => $subject->id,
            'subject_ids' => [$subject->id],
            'status' => 'active',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertDatabaseHas('users', ['id' => $teacherUser->id, 'email' => 'original@example.com']);
    }
}
