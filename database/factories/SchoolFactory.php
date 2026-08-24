<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\School>
 */
class SchoolFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'slug' => fake()->unique()->slug(),
            'admin_name' => fake()->name(),
            'admin_email' => fake()->unique()->safeEmail(),
            'is_active' => true,
            'status' => 'active',
            'school_type' => 'madrasah',
        ];
    }
}
