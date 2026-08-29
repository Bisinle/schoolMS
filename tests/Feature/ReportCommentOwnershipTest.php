<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\Guardian;
use App\Models\ReportComment;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * report-comments.create / .lock are both gated inline in
 * ReportController::saveComment()/lockComment() (route-level permission is
 * deliberately coarse, see routes/web.php's comment on the group — "Phase 2
 * disagreement #10"). Both actions correctly check `is_class_teacher` on the
 * teacher's grade-pivot for the target student's grade before allowing a
 * 'teacher'-type comment, regardless of whether the acting teacher is even
 * assigned to that grade at all. Had no negative-case test until now —
 * added 2026-08-29 per the Phase 7 negative-case coverage backfill.
 */
class ReportCommentOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function makeStudentWithClassTeacher(School $school): array
    {
        $classTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $classTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $classTeacherUser->id]);
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $classTeacher->grades()->attach($grade->id, ['is_class_teacher' => true]);
        $guardian = Guardian::factory()->create(['school_id' => $school->id]);
        $student = Student::factory()->create(['school_id' => $school->id, 'grade_id' => $grade->id, 'guardian_id' => $guardian->id]);

        return [$classTeacherUser, $grade, $student];
    }

    public function test_non_class_teacher_cannot_save_teacher_comment(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        [, , $student] = $this->makeStudentWithClassTeacher($school);

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)
            ->post("/reports/students/{$student->id}/comments", [
                'term' => '1',
                'academic_year' => 2026,
                'comment_type' => 'teacher',
                'comment' => 'Not this teacher\'s student.',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('report_comments', ['student_id' => $student->id]);
    }

    public function test_class_teacher_can_save_teacher_comment(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        [$classTeacherUser, , $student] = $this->makeStudentWithClassTeacher($school);

        $response = $this->actingAs($classTeacherUser)
            ->post("/reports/students/{$student->id}/comments", [
                'term' => '1',
                'academic_year' => 2026,
                'comment_type' => 'teacher',
                'comment' => 'Doing well this term.',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('report_comments', ['student_id' => $student->id, 'teacher_comment' => 'Doing well this term.']);
    }

    public function test_non_admin_teacher_cannot_save_headteacher_comment(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        [$classTeacherUser, , $student] = $this->makeStudentWithClassTeacher($school);

        $response = $this->actingAs($classTeacherUser)
            ->post("/reports/students/{$student->id}/comments", [
                'term' => '1',
                'academic_year' => 2026,
                'comment_type' => 'headteacher',
                'comment' => 'Even the class teacher cannot write this.',
            ]);

        $response->assertForbidden();
    }

    public function test_non_class_teacher_cannot_lock_teacher_comment(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        [, , $student] = $this->makeStudentWithClassTeacher($school);
        $comment = ReportComment::create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'term' => '1',
            'academic_year' => 2026,
            'teacher_comment' => 'Existing comment.',
        ]);

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)
            ->post("/reports/students/{$student->id}/comments/lock", [
                'term' => '1',
                'academic_year' => 2026,
                'comment_type' => 'teacher',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('report_comments', ['id' => $comment->id, 'teacher_comment_locked_at' => null]);
    }

    public function test_class_teacher_can_lock_own_teacher_comment(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        [$classTeacherUser, , $student] = $this->makeStudentWithClassTeacher($school);
        ReportComment::create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'term' => '1',
            'academic_year' => 2026,
            'teacher_comment' => 'Existing comment.',
        ]);

        $response = $this->actingAs($classTeacherUser)
            ->post("/reports/students/{$student->id}/comments/lock", [
                'term' => '1',
                'academic_year' => 2026,
                'comment_type' => 'teacher',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseMissing('report_comments', ['student_id' => $student->id, 'teacher_comment_locked_at' => null]);
    }

    public function test_admin_can_save_headteacher_comment(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        [, , $student] = $this->makeStudentWithClassTeacher($school);
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $response = $this->actingAs($adminUser)
            ->post("/reports/students/{$student->id}/comments", [
                'term' => '1',
                'academic_year' => 2026,
                'comment_type' => 'headteacher',
                'comment' => 'Great progress overall.',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('report_comments', ['student_id' => $student->id, 'headteacher_comment' => 'Great progress overall.']);
    }
}
