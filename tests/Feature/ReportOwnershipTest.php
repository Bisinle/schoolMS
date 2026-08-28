<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\Guardian;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ReportController::index() scopes teachers to their own grade's students
 * and guardians to their own children via query filtering — safe by
 * construction, no per-record lookup. ReportController::generate() (the
 * actual per-student report-card entry point) checks guardian ownership
 * (`abort(403)` if the student isn't the guardian's own child) but never
 * checks teacher ownership at all — any teacher holding `reports.view`
 * (all of them) could generate any student's full report card by passing
 * an arbitrary `student_id`, regardless of grade. Same shape as the
 * attendance.view (Batch A) and exam-results.create (Batch B) gaps. Added
 * 2026-08-29 per the Phase 7 negative-case coverage backfill — this test
 * failed red against the pre-fix code, confirming the gap, then the
 * controller was fixed alongside it.
 */
class ReportOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_cannot_generate_report_for_student_outside_their_grade(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id]);
        $student = Student::factory()->create(['school_id' => $school->id, 'grade_id' => $grade->id, 'guardian_id' => $guardian->id]);

        $response = $this->actingAs($otherTeacherUser)
            ->get('/reports/generate?' . http_build_query([
                'student_id' => $student->id,
                'term' => '1',
                'academic_year' => 2026,
            ]));

        $response->assertForbidden();
    }

    public function test_teacher_can_generate_report_for_own_grades_student(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $teacher->grades()->attach($grade->id, ['is_class_teacher' => true]);
        $guardian = Guardian::factory()->create(['school_id' => $school->id]);
        $student = Student::factory()->create(['school_id' => $school->id, 'grade_id' => $grade->id, 'guardian_id' => $guardian->id]);

        $response = $this->actingAs($teacherUser)
            ->get('/reports/generate?' . http_build_query([
                'student_id' => $student->id,
                'term' => '1',
                'academic_year' => 2026,
            ]));

        $response->assertOk();
    }

    public function test_guardian_cannot_generate_report_for_another_guardians_child(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);

        $otherGuardian = Guardian::factory()->create(['school_id' => $school->id]);
        $child = Student::factory()->create(['school_id' => $school->id, 'grade_id' => $grade->id, 'guardian_id' => $otherGuardian->id]);

        $requestingGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $requestingGuardianUser->id]);

        $response = $this->actingAs($requestingGuardianUser)
            ->get('/reports/generate?' . http_build_query([
                'student_id' => $child->id,
                'term' => '1',
                'academic_year' => 2026,
            ]));

        $response->assertForbidden();
    }

    public function test_admin_can_generate_report_for_any_student(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id]);
        $student = Student::factory()->create(['school_id' => $school->id, 'grade_id' => $grade->id, 'guardian_id' => $guardian->id]);

        $response = $this->actingAs($adminUser)
            ->get('/reports/generate?' . http_build_query([
                'student_id' => $student->id,
                'term' => '1',
                'academic_year' => 2026,
            ]));

        $response->assertOk();
    }
}
