<?php

namespace Database\Factories;

use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuranHomework>
 */
class QuranHomeworkFactory extends Factory
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
            'assigned_date' => now(),
            'due_date' => now()->addWeek(),
            'homework_type' => 'memorize',
            'surah_from' => 1,
            'verse_from' => 1,
            'surah_to' => 1,
            'verse_to' => 7,
            'page_from' => 1,
            'page_to' => 1,
            'completed' => false,
        ];
    }
}
