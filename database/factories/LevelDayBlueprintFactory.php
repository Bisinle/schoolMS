<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LevelDayBlueprint>
 */
class LevelDayBlueprintFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'level' => fake()->randomElement(['ECD', 'LOWER PRIMARY', 'UPPER PRIMARY', 'JUNIOR SECONDARY']),
            'name' => fake()->unique()->words(2, true) . ' Blueprint',
            'start_time' => '08:00',
            'end_time' => '15:00',
            'is_active' => true,
        ];
    }
}
