<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\Teacher;
use App\Models\TeacherAvailability;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * timetable-availability.manage has no Policy at all (confirmed in Phase 6
 * Batch 6) — TeacherAvailabilityController inline-checks
 * `$availability->teacher_id != $user->teacher->id` on every action for
 * teachers, with admin unrestricted. Had no negative-case test until now —
 * added 2026-08-29 per the Phase 7 negative-case coverage backfill.
 */
class TeacherAvailabilityOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function makeAvailability(School $school, Teacher $teacher): TeacherAvailability
    {
        return TeacherAvailability::create([
            'school_id' => $school->id,
            'teacher_id' => $teacher->id,
            'day_of_week' => 'monday',
            'start_time' => '08:00',
            'end_time' => '15:00',
        ]);
    }

    public function test_teacher_cannot_view_another_teachers_availability(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $ownerTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $ownerTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $ownerTeacherUser->id]);
        $availability = $this->makeAvailability($school, $ownerTeacher);

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)->get("/timetables/availability/{$availability->id}");

        $response->assertForbidden();
    }

    public function test_teacher_cannot_update_another_teachers_availability(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $ownerTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $ownerTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $ownerTeacherUser->id]);
        $availability = $this->makeAvailability($school, $ownerTeacher);

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)
            ->put("/timetables/availability/{$availability->id}", [
                'day_of_week' => 'tuesday',
                'start_time' => '09:00',
                'end_time' => '16:00',
                'availability_type' => 'available',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('teacher_availability', ['id' => $availability->id, 'day_of_week' => 'monday']);
    }

    public function test_teacher_cannot_delete_another_teachers_availability(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $ownerTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $ownerTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $ownerTeacherUser->id]);
        $availability = $this->makeAvailability($school, $ownerTeacher);

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)->delete("/timetables/availability/{$availability->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('teacher_availability', ['id' => $availability->id]);
    }

    public function test_teacher_cannot_create_availability_for_another_teacher(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $ownerTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $ownerTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $ownerTeacherUser->id]);

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)
            ->post('/timetables/availability', [
                'teacher_id' => $ownerTeacher->id,
                'day_of_week' => 'monday',
                'start_time' => '08:00',
                'end_time' => '15:00',
                'availability_type' => 'available',
            ]);

        $response->assertForbidden();
    }

    public function test_teacher_can_manage_own_availability(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $availability = $this->makeAvailability($school, $teacher);

        $response = $this->actingAs($teacherUser)->get("/timetables/availability/{$availability->id}");

        $response->assertOk();
    }

    public function test_admin_can_manage_any_teachers_availability(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $availability = $this->makeAvailability($school, $teacher);

        $response = $this->actingAs($adminUser)->get("/timetables/availability/{$availability->id}");

        $response->assertOk();
    }
}
