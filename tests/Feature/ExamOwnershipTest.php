<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\Grade;
use App\Models\School;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ExamPolicy::view() and ::update() both scope teacher access to
 * $exam->grade_id being one of the teacher's own grades, reached via
 * ExamController::show()/edit()/update()'s authorize() calls. Had no
 * negative-case test until now — added 2026-08-29 per the Phase 7
 * negative-case coverage backfill.
 */
class ExamOwnershipTest extends TestCase
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

    public function test_teacher_cannot_view_exam_for_another_teachers_grade(): void
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

        $response = $this->actingAs($otherTeacherUser)->get("/exams/{$exam->id}");

        $response->assertForbidden();
    }

    public function test_teacher_cannot_update_exam_they_did_not_create(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $creatorTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $creatorTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $creatorTeacherUser->id]);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $creatorTeacher->grades()->attach($grade->id, ['is_class_teacher' => true]);
        $subject = Subject::factory()->create(['school_id' => $school->id, 'name' => 'Mathematics', 'category' => 'academic']);
        $exam = $this->makeExam($school, $creatorTeacherUser, $grade, $subject);

        // Second teacher also assigned to the same grade, but didn't create the exam.
        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $otherTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);
        $otherTeacher->grades()->attach($grade->id, ['is_class_teacher' => false]);

        $response = $this->actingAs($otherTeacherUser)
            ->put("/exams/{$exam->id}", [
                'name' => 'Renamed Exam',
                'exam_type' => 'midterm',
                'term' => '1',
                'academic_year' => 2026,
                'exam_date' => now()->toDateString(),
                'grade_id' => $grade->id,
                'subject_id' => $subject->id,
            ]);

        $response->assertForbidden();
    }

    public function test_creator_teacher_can_update_own_exam(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $teacher->grades()->attach($grade->id, ['is_class_teacher' => true]);
        $subject = Subject::factory()->create(['school_id' => $school->id, 'name' => 'Mathematics', 'category' => 'academic']);
        $exam = $this->makeExam($school, $teacherUser, $grade, $subject);

        $response = $this->actingAs($teacherUser)
            ->put("/exams/{$exam->id}", [
                'name' => 'Renamed Exam',
                'exam_type' => 'midterm',
                'term' => '1',
                'academic_year' => 2026,
                'exam_date' => now()->toDateString(),
                'grade_id' => $grade->id,
                'subject_id' => $subject->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('exams', ['id' => $exam->id, 'name' => 'Renamed Exam']);
    }

    public function test_admin_can_update_any_teachers_exam(): void
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

        $response = $this->actingAs($adminUser)
            ->put("/exams/{$exam->id}", [
                'name' => 'Admin Renamed Exam',
                'exam_type' => 'midterm',
                'term' => '1',
                'academic_year' => 2026,
                'exam_date' => now()->toDateString(),
                'grade_id' => $grade->id,
                'subject_id' => $subject->id,
            ]);

        $response->assertRedirect();
    }
}
