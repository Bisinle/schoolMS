<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\School;
use App\Models\Teacher;
use App\Models\TimetableTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression coverage for a production 500: the dashboard crashed with
 * "Attempt to read property 'name' on null" at
 * TimetableComplianceService.php:121 whenever a grade with a published
 * timetable had a teacher whose linked user was soft-deleted (an orphaned
 * teacher - the same root cause as TeacherGuardianOrphanTest, just hit via
 * a different, previously-unaudited read path: dashboard curriculum
 * compliance / teacher workload reporting). The orphan itself can only come
 * from a soft-deleted user - teachers.user_id has a DB-level cascade delete,
 * so a hard-deleted user takes its teacher row with it.
 */
class TimetableOrphanedTeacherTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_does_not_crash_when_a_grade_has_an_orphaned_teacher(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $template = TimetableTemplate::factory()->create([
            'school_id' => $school->id,
            'grade_id' => $grade->id,
            'is_active' => true,
            'status' => 'published',
        ]);

        $orphanUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $orphanTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $orphanUser->id]);
        $grade->teachers()->attach($orphanTeacher->id, ['is_class_teacher' => false]);

        // Reproduce the orphan: soft-delete the user, leave the teacher row
        // and its grade_teacher pivot entry in place.
        $orphanUser->delete();

        $response = $this->actingAs($admin)->get('/dashboard');

        $response->assertOk();
    }

    public function test_orphaned_teacher_is_excluded_from_the_workload_summary(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $grade = Grade::factory()->create(['school_id' => $school->id]);
        $template = TimetableTemplate::factory()->create([
            'school_id' => $school->id,
            'grade_id' => $grade->id,
        ]);

        $validUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $validTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $validUser->id]);
        $grade->teachers()->attach($validTeacher->id, ['is_class_teacher' => false]);

        $orphanUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $orphanTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $orphanUser->id]);
        $grade->teachers()->attach($orphanTeacher->id, ['is_class_teacher' => false]);
        $orphanUser->delete();

        $report = app(\App\Services\TimetableComplianceService::class)->getTeacherWorkloadSummary($template);

        $this->assertCount(1, $report);
        $this->assertSame($validTeacher->id, $report->first()['teacher_id']);
    }
}
