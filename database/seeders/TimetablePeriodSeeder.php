<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\TimetablePeriod;
use Illuminate\Database\Seeder;

class TimetablePeriodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $schools = School::all();

        foreach ($schools as $school) {
            // Standard school day periods with atomic time blocks
            // Order defines chronological sequence, lesson_number is for lesson periods only
            $periods = [
                [
                    'name' => 'Period 1',
                    'period_type' => 'lesson',
                    'order' => 1,
                    'lesson_number' => 1,
                    'start_time' => '08:00',
                    'end_time' => '08:40',
                    'duration_minutes' => 40,
                    'is_break' => false,
                ],
                [
                    'name' => 'Period 2',
                    'period_type' => 'lesson',
                    'order' => 2,
                    'lesson_number' => 2,
                    'start_time' => '08:40',
                    'end_time' => '09:20',
                    'duration_minutes' => 40,
                    'is_break' => false,
                ],
                [
                    'name' => 'Morning Break',
                    'period_type' => 'break',
                    'order' => 3,
                    'lesson_number' => null,
                    'start_time' => '09:20',
                    'end_time' => '09:40',
                    'duration_minutes' => 20,
                    'is_break' => true,
                ],
                [
                    'name' => 'Period 3',
                    'period_type' => 'lesson',
                    'order' => 4,
                    'lesson_number' => 3,
                    'start_time' => '09:40',
                    'end_time' => '10:20',
                    'duration_minutes' => 40,
                    'is_break' => false,
                ],
                [
                    'name' => 'Period 4',
                    'period_type' => 'lesson',
                    'order' => 5,
                    'lesson_number' => 4,
                    'start_time' => '10:20',
                    'end_time' => '11:00',
                    'duration_minutes' => 40,
                    'is_break' => false,
                ],
                [
                    'name' => 'Period 5',
                    'period_type' => 'lesson',
                    'order' => 6,
                    'lesson_number' => 5,
                    'start_time' => '11:00',
                    'end_time' => '11:40',
                    'duration_minutes' => 40,
                    'is_break' => false,
                ],
                [
                    'name' => 'Lunch Break',
                    'period_type' => 'lunch',
                    'order' => 7,
                    'lesson_number' => null,
                    'start_time' => '11:40',
                    'end_time' => '12:20',
                    'duration_minutes' => 40,
                    'is_break' => true,
                ],
                [
                    'name' => 'Period 6',
                    'period_type' => 'lesson',
                    'order' => 8,
                    'lesson_number' => 6,
                    'start_time' => '12:20',
                    'end_time' => '13:00',
                    'duration_minutes' => 40,
                    'is_break' => false,
                ],
                [
                    'name' => 'Period 7',
                    'period_type' => 'lesson',
                    'order' => 9,
                    'lesson_number' => 7,
                    'start_time' => '13:00',
                    'end_time' => '13:40',
                    'duration_minutes' => 40,
                    'is_break' => false,
                ],
                [
                    'name' => 'Period 8',
                    'period_type' => 'lesson',
                    'order' => 10,
                    'lesson_number' => 8,
                    'start_time' => '13:40',
                    'end_time' => '14:20',
                    'duration_minutes' => 40,
                    'is_break' => false,
                ],
            ];

            foreach ($periods as $period) {
                TimetablePeriod::create(array_merge($period, [
                    'school_id' => $school->id,
                    'is_active' => true,
                ]));
            }
        }
    }
}
