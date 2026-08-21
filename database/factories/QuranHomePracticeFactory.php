<?php

namespace Database\Factories;

use App\Models\Guardian;
use App\Models\School;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuranHomePractice>
 */
class QuranHomePracticeFactory extends Factory
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
            'guardian_id' => Guardian::factory(),
            'school_id' => School::factory(),
            'practice_date' => now(),
            'duration_minutes' => 20,
            'practice_type' => 'revise',
        ];
    }
}
