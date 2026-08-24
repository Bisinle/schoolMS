<?php

namespace Tests\Feature;

use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuranScheduleRebuildTest extends TestCase
{
    use RefreshDatabase;

    public function test_schedule_stores_verse_range_and_date_range(): void
    {
        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::create([
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'school_id' => $school->id,
            'surah_from' => 2,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 286,
            'start_date' => '2026-01-01',
            'end_date' => '2026-06-01',
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('quran_schedules', [
            'id' => $schedule->id,
            'surah_from' => 2,
            'verse_to' => 286,
        ]);
        $this->assertDatabaseMissing('quran_schedules', ['schedule_type' => 'weekly']);
    }

    public function test_target_total_pages_is_computed_not_stored(): void
    {
        \Illuminate\Support\Facades\Http::fake([
            'api.quran.com/api/v4/verses/by_key/1:1*' => \Illuminate\Support\Facades\Http::response([
                'verse' => ['page_number' => 1],
            ], 200),
            'api.quran.com/api/v4/verses/by_key/1:7*' => \Illuminate\Support\Facades\Http::response([
                'verse' => ['page_number' => 1],
            ], 200),
        ]);

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'surah_from' => 1,
            'verse_from' => 1,
            'surah_to' => 1,
            'verse_to' => 7,
        ]);

        // Al-Fatiha is entirely on page 1 — a single page.
        $this->assertSame(1, $schedule->target_total_pages);
    }
}
