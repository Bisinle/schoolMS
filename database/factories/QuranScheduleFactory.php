<?php

namespace Database\Factories;

use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuranSchedule>
 */
class QuranScheduleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'teacher_id' => User::factory()->state(['role' => 'teacher']),
            'school_id' => School::factory(),
            'surah_from' => 1,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 5,
            'start_date' => now(),
            'is_active' => true,
        ];
    }
}
