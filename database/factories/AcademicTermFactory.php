<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AcademicTerm>
 */
class AcademicTermFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // school_id must resolve before academic_year_id below, since the
            // closure reads it from the already-merged attributes - it needs
            // to stay the first key so array_merge() with caller overrides
            // doesn't push it after academic_year_id in resolution order.
            'school_id' => School::factory(),
            'academic_year_id' => fn (array $attributes) => AcademicYear::factory()
                ->create(['school_id' => $attributes['school_id']])->id,
            'term_number' => 1,
            'name' => 'Term 1',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->startOfYear()->addMonths(3),
            'is_active' => false,
        ];
    }
}
