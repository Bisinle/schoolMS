<?php

namespace Database\Factories;

use App\Models\School;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TeacherAvailability>
 */
class TeacherAvailabilityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // school_id must stay the first key - teacher_id below reads it
            // from the merged attributes so the teacher lands in the same
            // tenant as this availability record.
            'school_id' => School::factory(),
            'teacher_id' => fn (array $attributes) => Teacher::factory()
                ->create(['school_id' => $attributes['school_id']])->id,
            'day_of_week' => fake()->randomElement(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'availability_type' => 'available',
        ];
    }
}
