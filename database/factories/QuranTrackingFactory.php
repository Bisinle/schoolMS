<?php

namespace Database\Factories;

use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuranTracking>
 */
class QuranTrackingFactory extends Factory
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
            'date' => now(),
            'reading_type' => 'new_learning',
            'surah_from' => 1,
            'surah_to' => 1,
            'verse_from' => 1,
            'verse_to' => 7,
            'difficulty' => 'middle',
        ];
    }
}
