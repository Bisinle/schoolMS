<?php

namespace Database\Factories;

use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AcademicYear>
 */
class AcademicYearFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'year' => (string) fake()->unique()->numberBetween(2020, 2124),
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => false,
        ];
    }
}
