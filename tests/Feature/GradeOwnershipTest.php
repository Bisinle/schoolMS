<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\School;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * GradePolicy::view() scopes teacher access to grades they're assigned to
 * (`$user->teacher->grades()->where('grades.id', $grade->id)->exists()`),
 * reached via GradeController::show()'s `$this->authorize('view', $grade)`.
 * Had no negative-case test until now — added 2026-08-29 per the Phase 7
 * negative-case coverage backfill.
 */
class GradeOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_cannot_view_another_teachers_grade(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $ownerTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $ownerTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $ownerTeacherUser->id]);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $ownerTeacher->grades()->attach($grade->id, ['is_class_teacher' => true]);

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)->get("/grades/{$grade->id}");

        $response->assertForbidden();
    }

    public function test_teacher_can_view_own_assigned_grade(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $teacher->grades()->attach($grade->id, ['is_class_teacher' => true]);

        $response = $this->actingAs($teacherUser)->get("/grades/{$grade->id}");

        $response->assertOk();
    }

    public function test_admin_can_view_any_grade(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);

        $response = $this->actingAs($adminUser)->get("/grades/{$grade->id}");

        $response->assertOk();
    }
}
