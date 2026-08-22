<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class QuranScheduleProgressTest extends TestCase
{
    use RefreshDatabase;

    public function test_progress_only_counts_graded_homework_for_this_schedule(): void
    {
        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'surah_from' => 1, 'verse_from' => 1, 'surah_to' => 1, 'verse_to' => 7,
        ]);

        $graded = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'quran_schedule_id' => $schedule->id,
            'status' => 'graded',
        ]);
        DB::table('quran_homework')->where('id', $graded->id)->update(['pages_memorized' => 3]);

        // Pending — must not count.
        $pending = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'quran_schedule_id' => $schedule->id,
            'status' => 'pending',
        ]);
        DB::table('quran_homework')->where('id', $pending->id)->update(['pages_memorized' => 5]);

        $this->actingAs($teacherUser);
        $this->assertSame(3, $schedule->fresh()->current_progress);
    }

    public function test_show_page_lists_this_schedules_homework_not_all_tracking(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
        ]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'quran_schedule_id' => $schedule->id,
        ]);

        $response = $this->actingAs($teacherUser)->get(route('quran-schedule.show', $schedule->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('homeworkRecords', 1)
            ->where('homeworkRecords.0.id', $homework->id)
        );
    }
}
