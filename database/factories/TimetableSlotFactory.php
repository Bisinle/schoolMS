<?php

namespace Database\Factories;

use App\Models\School;
use App\Models\Subject;
use App\Models\TimetableTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TimetableSlot>
 */
class TimetableSlotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // school_id must stay the first key - timetable_template_id and
            // subject_id below read it from the merged attributes so the
            // related records land in the same tenant as this slot.
            'school_id' => School::factory(),
            'timetable_template_id' => fn (array $attributes) => TimetableTemplate::factory()
                ->create(['school_id' => $attributes['school_id']])->id,
            'day_of_week' => fake()->randomElement(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
            // slot_type defaults to 'lesson', which the chk_lesson_has_subject
            // check constraint requires a subject_id for.
            'subject_id' => fn (array $attributes) => Subject::factory()
                ->create(['school_id' => $attributes['school_id']])->id,
            'slot_type' => 'lesson',
        ];
    }
}
