<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\Teacher;
use App\Models\TeacherAvailability;
use Illuminate\Database\Seeder;

class TeacherAvailabilitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('👨‍🏫 Seeding Teacher Availability...');

        $schools = School::all();
        $totalCreated = 0;

        $daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

        foreach ($schools as $school) {
            // Get all teachers for this school
            $teachers = Teacher::whereHas('user', function ($query) use ($school) {
                $query->where('school_id', $school->id);
            })->get();

            foreach ($teachers as $teacher) {
                // Most teachers are available all the time
                // But let's add some unavailability for realism

                // 80% of teachers are fully available (Monday-Friday, 8am-3pm)
                if (rand(1, 100) <= 80) {
                    foreach ($daysOfWeek as $day) {
                        TeacherAvailability::create([
                            'school_id' => $school->id,
                            'teacher_id' => $teacher->id,
                            'day_of_week' => $day,
                            'start_time' => '08:00',
                            'end_time' => '15:00',
                            'availability_type' => 'available',
                            'is_recurring' => true,
                        ]);
                        $totalCreated++;
                    }
                } else {
                    // 20% have some unavailability
                    foreach ($daysOfWeek as $day) {
                        // Randomly make some days unavailable
                        $availabilityType = rand(1, 100) > 20 ? 'available' : 'unavailable';

                        TeacherAvailability::create([
                            'school_id' => $school->id,
                            'teacher_id' => $teacher->id,
                            'day_of_week' => $day,
                            'start_time' => '08:00',
                            'end_time' => '15:00',
                            'availability_type' => $availabilityType,
                            'reason' => $availabilityType === 'unavailable' ? 'personal' : null,
                            'is_recurring' => true,
                        ]);
                        $totalCreated++;
                    }
                }
            }
        }

        $this->command->info("✅ {$totalCreated} teacher availability records seeded successfully!");
    }
}

