<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TimetablePeriod>
 */
class TimetablePeriodFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'grade_level' => fake()->randomElement(['ECD', 'LOWER PRIMARY', 'UPPER PRIMARY', 'JUNIOR SECONDARY']),
            'order' => fake()->unique()->numberBetween(1, 999),
            'name' => 'Period ' . fake()->numberBetween(1, 20),
            'period_number' => fake()->numberBetween(1, 10),
            'start_time' => '08:00',
            'end_time' => '08:40',
            'duration_minutes' => 40,
            'period_type' => 'lesson',
            'is_break' => false,
            'is_active' => true,
        ];
    }
}
