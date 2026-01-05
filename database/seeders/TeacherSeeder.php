<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Teacher;
use App\Models\User;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\School;
use App\Services\UniqueIdentifierService;

class TeacherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates teacher records and assigns them to grades
     */
    public function run(): void
    {
        $this->command->info('👨‍🏫 Seeding Teachers...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        // Teacher specializations
        $specializations = [
            'Mathematics',
            'English Language',
            'Kiswahili',
            'Science',
            'Social Studies',
            'Religious Education',
            'Creative Arts',
            'Physical Education',
            'Agriculture',
            'Home Science',
            'Music',
            'Computer Studies',
        ];

        foreach ($schools as $school) {
            // Get teacher users for this school
            $teacherUsers = User::where('school_id', $school->id)
                ->where('role', 'teacher')
                ->get();

            if ($teacherUsers->isEmpty()) {
                $this->command->warn("  ⚠️  {$school->name}: No teacher users found, skipping...");
                continue;
            }

            $teacherCount = 0;
            $grades = Grade::where('school_id', $school->id)->get();
            $subjects = Subject::where('school_id', $school->id)->get();

            foreach ($teacherUsers as $index => $user) {
                // Check if teacher record already exists
                $exists = Teacher::where('user_id', $user->id)->exists();

                if (!$exists) {
                    $specialization = $specializations[$index % count($specializations)];

                    // Find subject that matches specialization
                    $subject = $subjects->first(function($s) use ($specialization) {
                        return stripos($s->name, $specialization) !== false ||
                               stripos($specialization, $s->name) !== false;
                    });

                    $teacher = Teacher::create([
                        'school_id' => $school->id,
                        'user_id' => $user->id,
                        'employee_number' => UniqueIdentifierService::generateEmployeeNumber($school->id),
                        'phone_number' => $user->phone ?? '0700000000',
                        'address' => 'Nairobi, Kenya',
                        'qualification' => 'Bachelor of Education',
                        'subject_id' => $subject?->id,
                        'date_of_joining' => now()->subMonths(rand(6, 36))->format('Y-m-d'),
                        'status' => 'active',
                    ]);

                    // Assign teacher to 2-3 random grades
                    if ($grades->isNotEmpty()) {
                        $assignedGrades = $grades->random(min(3, $grades->count()));
                        foreach ($assignedGrades as $gradeIndex => $grade) {
                            $teacher->grades()->attach($grade->id, [
                                'is_class_teacher' => $gradeIndex === 0, // First grade is class teacher
                            ]);
                        }
                    }

                    $teacherCount++;
                }
            }

            if ($teacherCount > 0) {
                $this->command->info("  ✅ {$school->name}: {$teacherCount} teachers created");
            } else {
                $this->command->warn("  ⚠️  {$school->name}: Teachers already exist, skipped");
            }
        }

        $this->command->info('✅ Teachers seeded successfully!');
    }
}
