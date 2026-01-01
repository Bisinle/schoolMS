<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\TimetableTemplate;
use App\Models\TimetablePeriod;
use App\Models\TimetableSlot;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Room;
use Illuminate\Database\Seeder;

class TimetableSlotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('📚 Seeding Timetable Slots...');

        $schools = School::all();
        $totalCreated = 0;

        $daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

        foreach ($schools as $school) {
            // Get all templates for this school
            $templates = TimetableTemplate::where('school_id', $school->id)->get();
            
            // Get all lesson periods (exclude breaks and lunch)
            $lessonPeriods = TimetablePeriod::where('school_id', $school->id)
                ->where('is_break', false)
                ->orderBy('period_number')
                ->get();

            // Get subjects, teachers, and rooms for this school
            $subjects = Subject::where('school_id', $school->id)
                ->where('status', 'active')
                ->get();
            
            $teachers = Teacher::whereHas('user', function ($query) use ($school) {
                $query->where('school_id', $school->id);
            })->get();

            $rooms = Room::where('school_id', $school->id)
                ->where('is_active', true)
                ->where('room_type', 'classroom')
                ->get();

            if ($subjects->isEmpty() || $teachers->isEmpty() || $rooms->isEmpty()) {
                $this->command->warn("Insufficient data for school: {$school->name}");
                continue;
            }

            foreach ($templates as $template) {
                $slots = [];

                // Create slots for each day of the week
                foreach ($daysOfWeek as $day) {
                    foreach ($lessonPeriods as $period) {
                        // Randomly assign subject, teacher, and room
                        $subject = $subjects->random();
                        $teacher = $teachers->random();
                        $room = $rooms->random();

                        $slots[] = [
                            'school_id' => $school->id,
                            'timetable_template_id' => $template->id,
                            'timetable_period_id' => $period->id,
                            'day_of_week' => $day,
                            'subject_id' => $subject->id,
                            'teacher_id' => $teacher->id,
                            'room_id' => $room->id,
                            'slot_type' => 'lesson',
                            'is_substitution' => false,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                        $totalCreated++;
                    }
                }

                // Batch insert all slots for this template
                TimetableSlot::insert($slots);
            }
        }

        $this->command->info("✅ {$totalCreated} timetable slots seeded successfully!");
    }
}

