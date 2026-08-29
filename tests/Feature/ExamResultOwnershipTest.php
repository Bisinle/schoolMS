<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * exam-results.view is gated via ExamResultController::index()'s
 * `authorize('view', $exam)` (ExamPolicy's grade-scoping, not
 * ExamResultPolicy's — same shape, different Policy). exam-results.update
 * is gated via ExamResultPolicy::update()'s own grade-scoping on
 * $examResult->exam->grade_id. Both correctly wired.
 *
 * exam-results.create is not: ExamResultController::store() authorizes
 * against ExamResult::class (ExamResultPolicy::create(), which is just
 * `$user->can('exam-results.create')` with no scoping at all) rather than
 * against the route-bound $exam — so any teacher holding exam-results.create
 * (all of them) could POST results for an exam belonging to a grade they
 * don't teach. Added 2026-08-29 per the Phase 7 negative-case coverage
 * backfill — this test failed red against the pre-fix code, confirming the
 * gap, then the controller was fixed alongside it.
 */
class ExamResultOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function makeExam(School $school, User $createdBy, Grade $grade, Subject $subject): Exam
    {
        return Exam::create([
            'school_id' => $school->id,
            'name' => 'Term Exam',
            'exam_type' => 'midterm',
            'term' => '1',
            'academic_year' => 2026,
            'exam_date' => now()->toDateString(),
            'grade_id' => $grade->id,
            'subject_id' => $subject->id,
            'created_by' => $createdBy->id,
        ]);
    }

    public function test_teacher_cannot_view_results_for_another_teachers_exam(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $ownerTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $ownerTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $ownerTeacherUser->id]);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $ownerTeacher->grades()->attach($grade->id, ['is_class_teacher' => true]);
        $subject = Subject::factory()->create(['school_id' => $school->id, 'name' => 'Mathematics', 'category' => 'academic']);
        $exam = $this->makeExam($school, $ownerTeacherUser, $grade, $subject);

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)->get("/exams/{$exam->id}/results");

        $response->assertForbidden();
    }

    public function test_teacher_cannot_create_results_for_another_teachers_exam(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $ownerTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $ownerTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $ownerTeacherUser->id]);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $ownerTeacher->grades()->attach($grade->id, ['is_class_teacher' => true]);
        $subject = Subject::factory()->create(['school_id' => $school->id, 'name' => 'Mathematics', 'category' => 'academic']);
        $exam = $this->makeExam($school, $ownerTeacherUser, $grade, $subject);
        $student = Student::factory()->create([
            'school_id' => $school->id,
            'grade_id' => $grade->id,
            'guardian_id' => \App\Models\Guardian::factory()->create(['school_id' => $school->id]),
        ]);

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)
            ->post("/exams/{$exam->id}/results", [
                'results' => [
                    ['student_id' => $student->id, 'marks' => 99],
                ],
            ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('exam_results', ['exam_id' => $exam->id, 'student_id' => $student->id]);
    }

    public function test_teacher_can_create_results_for_own_exam(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $teacher->grades()->attach($grade->id, ['is_class_teacher' => true]);
        $subject = Subject::factory()->create(['school_id' => $school->id, 'name' => 'Mathematics', 'category' => 'academic']);
        $exam = $this->makeExam($school, $teacherUser, $grade, $subject);
        $student = Student::factory()->create([
            'school_id' => $school->id,
            'grade_id' => $grade->id,
            'guardian_id' => \App\Models\Guardian::factory()->create(['school_id' => $school->id]),
        ]);

        $response = $this->actingAs($teacherUser)
            ->post("/exams/{$exam->id}/results", [
                'results' => [
                    ['student_id' => $student->id, 'marks' => 88],
                ],
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('exam_results', ['exam_id' => $exam->id, 'student_id' => $student->id, 'marks' => 88]);
    }

    public function test_admin_can_create_results_for_any_exam(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $teacher->grades()->attach($grade->id, ['is_class_teacher' => true]);
        $subject = Subject::factory()->create(['school_id' => $school->id, 'name' => 'Mathematics', 'category' => 'academic']);
        $exam = $this->makeExam($school, $teacherUser, $grade, $subject);
        $student = Student::factory()->create([
            'school_id' => $school->id,
            'grade_id' => $grade->id,
            'guardian_id' => \App\Models\Guardian::factory()->create(['school_id' => $school->id]),
        ]);

        $response = $this->actingAs($adminUser)
            ->post("/exams/{$exam->id}/results", [
                'results' => [
                    ['student_id' => $student->id, 'marks' => 77],
                ],
            ]);

        $response->assertRedirect();
    }

    public function test_teacher_cannot_update_result_for_another_teachers_exam(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $ownerTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $ownerTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $ownerTeacherUser->id]);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $ownerTeacher->grades()->attach($grade->id, ['is_class_teacher' => true]);
        $subject = Subject::factory()->create(['school_id' => $school->id, 'name' => 'Mathematics', 'category' => 'academic']);
        $exam = $this->makeExam($school, $ownerTeacherUser, $grade, $subject);
        $student = Student::factory()->create([
            'school_id' => $school->id,
            'grade_id' => $grade->id,
            'guardian_id' => \App\Models\Guardian::factory()->create(['school_id' => $school->id]),
        ]);
        $result = ExamResult::create(['school_id' => $school->id, 'exam_id' => $exam->id, 'student_id' => $student->id, 'marks' => 50]);

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)
            ->put("/exam-results/{$result->id}", ['marks' => 100]);

        $response->assertForbidden();
        $this->assertDatabaseHas('exam_results', ['id' => $result->id, 'marks' => 50]);
    }
}
