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
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'teacher_id' => User::factory()->state(['role' => 'teacher']),
            'school_id' => School::factory(),
            'quran_schedule_id' => null,
            'assigned_date' => now(),
            'status' => 'pending',
            'reading_type' => 'new_learning',
            'surah_from' => 1,
            'surah_to' => 1,
            'verse_from' => 1,
            'verse_to' => 7,
            'quality_rating' => null,
        ];
    }
}
