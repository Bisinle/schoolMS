<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Teacher>
 */
class TeacherFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => 'teacher']),
            'employee_number' => fake()->unique()->numerify('EMP-####'),
            'phone_number' => fake()->phoneNumber(),
            'date_of_joining' => now()->subYear(),
            'status' => 'active',
        ];
    }
}
