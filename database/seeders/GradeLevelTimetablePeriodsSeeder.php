<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TimetablePeriod;
use App\Models\School;
use Carbon\Carbon;

class GradeLevelTimetablePeriodsSeeder extends Seeder
{
    /**
     * Grade level configurations with staggered break offsets
     */
    private $gradeLevels = [
        'ECD' => [
            'name' => 'ECD (PP1-PP2)',
            'breakfast_offset' => 0,  // 10:00 - 10:30
            'play_offset' => 0,       // 10:30 - 10:50
            'lunch_offset' => 0,      // 12:50 - 14:00
        ],
        'LOWER PRIMARY' => [
            'name' => 'Lower Primary (G1-G3)',
            'breakfast_offset' => 15, // 10:15 - 10:45
            'play_offset' => 15,      // 10:45 - 11:05
            'lunch_offset' => 15,     // 13:05 - 14:15
        ],
        'UPPER PRIMARY' => [
            'name' => 'Upper Primary (G4-G6)',
            'breakfast_offset' => 30, // 10:30 - 11:00
            'play_offset' => 30,      // 11:00 - 11:20
            'lunch_offset' => 30,     // 13:20 - 14:30
        ],
        'JUNIOR SECONDARY' => [
            'name' => 'Junior Secondary (G7-G9)',
            'breakfast_offset' => 45, // 10:45 - 11:15
            'play_offset' => 45,      // 11:15 - 11:35
            'lunch_offset' => 45,     // 13:35 - 14:45
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all schools
        $schools = School::all();

        foreach ($schools as $school) {
            foreach ($this->gradeLevels as $gradeLevel => $config) {
                $this->createPeriodsForGradeLevel($school->id, $gradeLevel, $config);
            }
        }

        $this->command->info('✅ Grade-level timetable periods created successfully!');
    }

    /**
     * Create periods for a specific grade level
     */
    private function createPeriodsForGradeLevel($schoolId, $gradeLevel, $config)
    {
        $order = 1;
        $lessonNumber = 1;
        $periods = [];

        // 1. Morning Activity (07:30 - 07:50)
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, null, 'Morning Activity', '07:30', '07:50', 20, 'activity');

        // 2. First 3 Lessons (07:50 - 10:00) with 10-min breaks between
        // Lesson 1: 07:50 - 08:30
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, $lessonNumber++, 'Lesson 1', '07:50', '08:30', 40, 'lesson');
        
        // Mini Break 1: 08:30 - 08:40
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, null, 'Mini Break', '08:30', '08:40', 10, 'break');
        
        // Lesson 2: 08:40 - 09:20
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, $lessonNumber++, 'Lesson 2', '08:40', '09:20', 40, 'lesson');
        
        // Mini Break 2: 09:20 - 09:30
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, null, 'Mini Break', '09:20', '09:30', 10, 'break');
        
        // Lesson 3: 09:30 - 10:10
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, $lessonNumber++, 'Lesson 3', '09:30', '10:10', 40, 'lesson');

        // 3. Breakfast Break (30 min) - STAGGERED
        $breakfastStart = $this->addMinutes('10:10', $config['breakfast_offset']);
        $breakfastEnd = $this->addMinutes($breakfastStart, 30);
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, null, 'Breakfast', $breakfastStart, $breakfastEnd, 30, 'break');

        // 4. Play Time (20 min) - STAGGERED
        $playStart = $breakfastEnd;
        $playEnd = $this->addMinutes($playStart, 20);
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, null, 'Play Time', $playStart, $playEnd, 20, 'break');

        // 5. Next 3 Lessons (ending at original 12:50 + offset)
        $lesson4Start = $playEnd;
        $lesson4End = $this->addMinutes($lesson4Start, 40);
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, $lessonNumber++, 'Lesson 4', $lesson4Start, $lesson4End, 40, 'lesson');
        
        $lesson5Start = $lesson4End;
        $lesson5End = $this->addMinutes($lesson5Start, 40);
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, $lessonNumber++, 'Lesson 5', $lesson5Start, $lesson5End, 40, 'lesson');
        
        $lesson6Start = $lesson5End;
        $lesson6End = $this->addMinutes($lesson6Start, 40);
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, $lessonNumber++, 'Lesson 6', $lesson6Start, $lesson6End, 40, 'lesson');

        // 6. Lunch and Prayer (70 min) - STAGGERED
        $lunchStart = $lesson6End;
        $lunchEnd = $this->addMinutes($lunchStart, 70);
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, null, 'Lunch & Prayer', $lunchStart, $lunchEnd, 70, 'lunch');

        // 7. Non-Academic Activity (40 min)
        $activityStart = $lunchEnd;
        $activityEnd = $this->addMinutes($activityStart, 40);
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, null, 'Activity Period', $activityStart, $activityEnd, 40, 'activity');

        // 8. Two 30-minute lessons
        $lesson7Start = $activityEnd;
        $lesson7End = $this->addMinutes($lesson7Start, 30);
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, $lessonNumber++, 'Lesson 7', $lesson7Start, $lesson7End, 30, 'lesson');
        
        $lesson8Start = $lesson7End;
        $lesson8End = $this->addMinutes($lesson8Start, 30);
        $periods[] = $this->createPeriod($schoolId, $gradeLevel, $order++, $lessonNumber++, 'Lesson 8', $lesson8Start, $lesson8End, 30, 'lesson');

        // Insert all periods
        TimetablePeriod::insert($periods);
    }

    /**
     * Create a period array
     */
    private function createPeriod($schoolId, $gradeLevel, $order, $lessonNumber, $name, $startTime, $endTime, $duration, $type)
    {
        return [
            'school_id' => $schoolId,
            'grade_level' => $gradeLevel,
            'name' => $name,
            'order' => $order,
            'lesson_number' => $lessonNumber,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'duration_minutes' => $duration,
            'period_type' => $type,
            'is_break' => in_array($type, ['break', 'lunch']),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Add minutes to a time string
     */
    private function addMinutes($time, $minutes)
    {
        return Carbon::createFromFormat('H:i', $time)->addMinutes($minutes)->format('H:i');
    }
}

