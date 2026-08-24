<?php

namespace Tests\Feature;

use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuranScheduleAppendsTest extends TestCase
{
    use RefreshDatabase;

    public function test_to_array_includes_computed_progress_and_status_fields(): void
    {
        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
        ]);

        $this->actingAs($teacherUser);

        $array = $schedule->fresh()->toArray();

        $this->assertArrayHasKey('target_total_pages', $array);
        $this->assertArrayHasKey('current_progress', $array);
        $this->assertArrayHasKey('progress_percentage', $array);
        $this->assertArrayHasKey('days_elapsed', $array);
        $this->assertArrayHasKey('days_remaining', $array);
        $this->assertArrayHasKey('status_badge', $array);
    }

    /**
     * Carbon::diffInDays() returns a float in this app's Carbon version, so
     * a schedule checked mid-day (start/end cast to midnight, "now" partway
     * through the day) previously rendered e.g. "0.16981053989583333 days".
     */
    public function test_days_elapsed_and_remaining_are_whole_numbers(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-10 14:00:00'));

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'start_date' => '2026-01-10',
            'end_date' => '2026-01-15',
        ]);

        $this->actingAs($teacherUser);

        $fresh = $schedule->fresh();

        $this->assertIsInt($fresh->days_elapsed);
        $this->assertSame(0, $fresh->days_elapsed);

        $this->assertIsInt($fresh->days_remaining);
        $this->assertSame(5, $fresh->days_remaining);

        Carbon::setTestNow();
    }
}
