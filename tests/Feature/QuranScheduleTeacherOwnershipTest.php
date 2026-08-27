<?php

namespace Tests\Feature;

use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * QuranSchedulePolicy::update() scopes teacher access to teacher_id ===
 * $user->id (same shape as QuranHomeworkPolicy, see
 * QuranHomeworkTeacherOwnershipTest) but never had its own same-school,
 * different-teacher regression test — only cross-school coverage existed
 * (QuranScheduleTenantIsolationTest). Added 2026-08-27 per the Phase 5
 * negative-case coverage audit.
 */
class QuranScheduleTeacherOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_owning_teacher_cannot_update_another_teachers_schedule(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $owningTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $owningTeacherUser->id]);
        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $owningTeacherUser->id,
        ]);

        $response = $this->actingAs($otherTeacherUser)
            ->put(route('quran-schedule.update', $schedule->id), [
                'surah_from' => 1,
                'verse_from' => 1,
                'surah_to' => 3,
                'verse_to' => 10,
                'start_date' => now()->toDateString(),
            ]);

        $response->assertForbidden();
    }

    public function test_admin_can_still_update_any_teachers_schedule(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
        ]);

        $response = $this->actingAs($adminUser)
            ->put(route('quran-schedule.update', $schedule->id), [
                'student_id' => $student->id,
                'surah_from' => 1,
                'verse_from' => 1,
                'surah_to' => 3,
                'verse_to' => 10,
                'start_date' => now()->toDateString(),
            ]);

        $response->assertRedirect();
    }
}
