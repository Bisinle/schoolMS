<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * AttendancePolicy::view() is never actually reached by any authorize() call
 * (see its own docblock) — the real scoping for `attendance.view` happens
 * ad-hoc inside AttendanceController, and only for the *grade dropdown*
 * (`$grades = $user->teacher->grades`), not for the `grade_id` a teacher
 * actually submits. `index()`/`reports()` pass that submitted `grade_id`
 * straight to `getAttendanceData()`/`getAttendanceReport()` with no ownership
 * check at all, so a teacher who edits the `grade_id` query param can read
 * another teacher's grade's attendance data. Added 2026-08-29 per the Phase 7
 * negative-case coverage backfill — this test failed red against the
 * pre-fix code, confirming the gap, then the controller was fixed alongside
 * it (see AttendanceController::index()/reports()).
 */
class AttendanceOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function makeTeacherWithGrade(School $school, string $gradeName): array
    {
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $grade = Grade::factory()->create([
            'school_id' => $school->id,
            'name' => $gradeName,
            'level' => 'LOWER PRIMARY',
        ]);
        $teacher->grades()->attach($grade->id, ['is_class_teacher' => true]);

        return [$teacherUser, $teacher, $grade];
    }

    public function test_teacher_cannot_view_another_teachers_grade_attendance_via_index(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        [$ownerTeacherUser, , $ownerGrade] = $this->makeTeacherWithGrade($school, 'Grade A');
        [$otherTeacherUser] = $this->makeTeacherWithGrade($school, 'Grade B');

        $response = $this->actingAs($otherTeacherUser)
            ->get('/attendance?' . http_build_query(['grade_id' => $ownerGrade->id]));

        $response->assertForbidden();
    }

    public function test_teacher_cannot_view_another_teachers_grade_attendance_report(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        [$ownerTeacherUser, , $ownerGrade] = $this->makeTeacherWithGrade($school, 'Grade A');
        [$otherTeacherUser] = $this->makeTeacherWithGrade($school, 'Grade B');

        $response = $this->actingAs($otherTeacherUser)
            ->get('/attendance/reports?' . http_build_query(['grade_id' => $ownerGrade->id]));

        $response->assertForbidden();
    }

    public function test_teacher_can_view_own_grade_attendance(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        [$teacherUser, , $grade] = $this->makeTeacherWithGrade($school, 'Grade A');

        $response = $this->actingAs($teacherUser)
            ->get('/attendance?' . http_build_query(['grade_id' => $grade->id]));

        $response->assertOk();
    }

    public function test_admin_can_view_any_grades_attendance(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        [, , $grade] = $this->makeTeacherWithGrade($school, 'Grade A');

        $response = $this->actingAs($adminUser)
            ->get('/attendance?' . http_build_query(['grade_id' => $grade->id]));

        $response->assertOk();
    }

    public function test_teacher_cannot_mark_attendance_for_another_teachers_grade(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        [, , $ownerGrade] = $this->makeTeacherWithGrade($school, 'Grade A');
        [$otherTeacherUser] = $this->makeTeacherWithGrade($school, 'Grade B');
        $student = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => \App\Models\Guardian::factory()->create(['school_id' => $school->id])]);

        $response = $this->actingAs($otherTeacherUser)
            ->post('/attendance/mark', [
                'grade_id' => $ownerGrade->id,
                'attendance_date' => now()->toDateString(),
                'attendances' => [
                    ['student_id' => $student->id, 'status' => 'present'],
                ],
            ]);

        $response->assertSessionHasErrors('error');
        $this->assertDatabaseMissing('attendances', ['student_id' => $student->id]);
    }

    public function test_guardian_cannot_view_another_guardians_child_attendance_history(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);

        $otherGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $otherGuardian = \App\Models\Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $otherGuardianUser->id]);
        $child = Student::factory()->create(['school_id' => $school->id, 'grade_id' => $grade->id, 'guardian_id' => $otherGuardian->id]);

        $requestingGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        \App\Models\Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $requestingGuardianUser->id]);

        $response = $this->actingAs($requestingGuardianUser)
            ->get("/attendance/student/{$child->id}");

        $response->assertForbidden();
    }

    public function test_guardian_can_view_own_childs_attendance_history(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);

        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = \App\Models\Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);
        $child = Student::factory()->create(['school_id' => $school->id, 'grade_id' => $grade->id, 'guardian_id' => $guardian->id]);

        $response = $this->actingAs($guardianUser)
            ->get("/attendance/student/{$child->id}");

        $response->assertOk();
    }
}
