<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Grade;
use App\Models\School;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates subjects for each school and assigns them to grades
     */
    public function run(): void
    {
        $this->command->info('📖 Seeding Subjects...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        // Define subjects (Academic + Islamic)
        $subjectsData = [
            // Academic Subjects
            ['name' => 'Agriculture', 'code' => 'AGR', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Arabic', 'code' => 'ARB', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Creative Arts', 'code' => 'ART', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'English', 'code' => 'ENG', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Environmental Activities', 'code' => 'ENV', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Kiswahili', 'code' => 'KIS', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Mathematics', 'code' => 'MAT', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Physical Education', 'code' => 'PHE', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Science', 'code' => 'SCI', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Social Studies', 'code' => 'SST', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Home Science', 'code' => 'HMS', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Computer Studies', 'code' => 'COM', 'category' => 'academic', 'status' => 'active'],

            // Islamic Subjects
            ['name' => 'القرآن', 'code' => 'QUR', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'أحكام التجويد', 'code' => 'TAJWID', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'التفسير', 'code' => 'TAFSIR', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'الحديث', 'code' => 'HADITH', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'الفقه', 'code' => 'FIQH', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'السيرة النبوية', 'code' => 'SIRAH', 'category' => 'islamic', 'status' => 'active'],
        ];

        // Create subjects for each school
        foreach ($schools as $school) {
            $subjectCount = 0;
            $createdSubjects = [];

            foreach ($subjectsData as $subjectData) {
                // Check if subject already exists
                $exists = Subject::where('school_id', $school->id)
                    ->where('code', $subjectData['code'])
                    ->exists();

                if (!$exists) {
                    $subject = Subject::create(array_merge($subjectData, ['school_id' => $school->id]));
                    $createdSubjects[] = $subject;
                    $subjectCount++;
                } else {
                    // Get existing subject for grade assignment
                    $subject = Subject::where('school_id', $school->id)
                        ->where('code', $subjectData['code'])
                        ->first();
                    if ($subject) {
                        $createdSubjects[] = $subject;
                    }
                }
            }

            // Assign all subjects to all grades for this school
            $schoolGrades = Grade::where('school_id', $school->id)->get();
            foreach ($schoolGrades as $grade) {
                $subjectIds = collect($createdSubjects)->pluck('id')->toArray();

                // Only attach subjects that aren't already attached
                $existingSubjectIds = $grade->subjects()->pluck('subjects.id')->toArray();
                $newSubjectIds = array_diff($subjectIds, $existingSubjectIds);

                if (!empty($newSubjectIds)) {
                    $grade->subjects()->attach($newSubjectIds);
                }
            }

            if ($subjectCount > 0) {
                $this->command->info("  ✅ {$school->name}: {$subjectCount} subjects created and assigned to grades");
            } else {
                $this->command->warn("  ⚠️  {$school->name}: Subjects already exist, skipped");
            }
        }

        $this->command->info('✅ Subjects seeded successfully!');
    }
}
