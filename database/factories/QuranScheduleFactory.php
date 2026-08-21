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
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'teacher_id' => User::factory()->state(['role' => 'teacher']),
            'school_id' => School::factory(),
            'schedule_type' => 'weekly',
            'target_pages_per_period' => 2,
            'start_date' => now(),
            'is_active' => true,
        ];
    }
}
