<?php

namespace Tests\Feature;

use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
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
}
