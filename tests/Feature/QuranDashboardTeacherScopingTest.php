<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * QuranController::index() previously showed every role the same
 * school-wide numbers. A Teacher's dashboard must now be scoped to their
 * own Quran teaching load only — via teacher_id on QuranSchedule/
 * QuranHomework (the same ownership column QuranSchedulePolicy already
 * uses), not another teacher's records at the same school.
 */
class QuranDashboardTeacherScopingTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_dashboard_only_counts_their_own_schedules_and_homework(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $teacherAUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherAUser->id]);
        $studentA = Student::factory()->create(['school_id' => $school->id]);

        $teacherBUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherBUser->id]);
        $studentB = Student::factory()->create(['school_id' => $school->id]);

        // Teacher A: one active schedule, one pending homework.
        QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $studentA->id,
            'teacher_id' => $teacherAUser->id,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDays(10),
        ]);
        QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $studentA->id,
            'teacher_id' => $teacherAUser->id,
            'status' => 'pending',
        ]);

        // Teacher B: two active schedules, two pending homework for a
        // different student — must not leak into Teacher A's numbers.
        QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $studentB->id,
            'teacher_id' => $teacherBUser->id,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDays(10),
        ]);
        QuranHomework::factory()->count(2)->create([
            'school_id' => $school->id,
            'student_id' => $studentB->id,
            'teacher_id' => $teacherBUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($teacherAUser)->get(route('quran.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('stats.role', 'teacher')
            ->where('stats.activeSchedules', 1)
            ->where('stats.studentsTracked', 1)
            ->where('stats.pendingHomework', 1)
            ->where('recentActivity.0.student_name', $studentA->full_name)
            ->has('recentActivity', 1)
        );
    }
}
