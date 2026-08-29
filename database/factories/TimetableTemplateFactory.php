<?php

namespace Database\Factories;

use App\Models\AcademicTerm;
use App\Models\Grade;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TimetableTemplate>
 */
class TimetableTemplateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // school_id must stay the first key - grade_id/academic_term_id
            // below read it from the merged attributes so the related grade
            // and term land in the same tenant as this template.
            'school_id' => School::factory(),
            'grade_id' => fn (array $attributes) => Grade::factory()
                ->create(['school_id' => $attributes['school_id']])->id,
            'academic_term_id' => fn (array $attributes) => AcademicTerm::factory()
                ->create(['school_id' => $attributes['school_id']])->id,
            'name' => fake()->unique()->words(3, true),
            'is_active' => false,
            'status' => 'draft',
            'active_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            'school_start_time' => '08:00',
            'school_end_time' => '15:00',
        ];
    }
}
