<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Exam;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\School;
use App\Models\User;

class ExamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates exams for all 3 terms of 2025 academic year
     */
    public function run(): void
    {
        $this->command->info('📝 Seeding Exams for 2025...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        // Exam types for each term
        $examStructure = [
            1 => ['opening', 'midterm', 'end_term'], // Term 1
            2 => ['opening', 'midterm', 'end_term'], // Term 2
            3 => ['end_term'],                        // Term 3 (only end_term)
        ];

        // Exam dates for 2025
        $examDates = [
            1 => [
                'opening' => '2025-01-20',
                'midterm' => '2025-02-17',
                'end_term' => '2025-03-31',
            ],
            2 => [
                'opening' => '2025-05-19',
                'midterm' => '2025-06-16',
                'end_term' => '2025-08-04',
            ],
            3 => [
                'end_term' => '2025-11-24',
            ],
        ];

        foreach ($schools as $school) {
            $examCount = 0;

            // Get admin user for created_by
            $adminUser = User::where('school_id', $school->id)
                ->where('role', 'admin')
                ->first();

            if (!$adminUser) {
                $this->command->warn("  ⚠️  {$school->name}: No admin user found, skipping...");
                continue;
            }

            // Get all grades for this school
            $grades = Grade::where('school_id', $school->id)->get();

            if ($grades->isEmpty()) {
                $this->command->warn("  ⚠️  {$school->name}: No grades found, skipping...");
                continue;
            }

            // Get all subjects for this school
            $subjects = Subject::where('school_id', $school->id)->get();

            if ($subjects->isEmpty()) {
                $this->command->warn("  ⚠️  {$school->name}: No subjects found, skipping...");
                continue;
            }

            // Create exams for each term
            foreach ($examStructure as $term => $examTypes) {
                foreach ($grades as $grade) {
                    foreach ($subjects as $subject) {
                        foreach ($examTypes as $examType) {
                            // Check if exam already exists
                            $exists = Exam::where('school_id', $school->id)
                                ->where('grade_id', $grade->id)
                                ->where('subject_id', $subject->id)
                                ->where('term', $term)
                                ->where('exam_type', $examType)
                                ->where('academic_year', 2025)
                                ->exists();

                            if (!$exists) {
                                $examName = $this->generateExamName($grade->name, $subject->name, $examType, $term);

                                Exam::create([
                                    'school_id' => $school->id,
                                    'name' => $examName,
                                    'exam_type' => $examType,
                                    'term' => $term,
                                    'academic_year' => 2025,
                                    'exam_date' => $examDates[$term][$examType],
                                    'grade_id' => $grade->id,
                                    'subject_id' => $subject->id,
                                    'created_by' => $adminUser->id,
                                ]);

                                $examCount++;
                            }
                        }
                    }
                }
            }

            $this->command->info("  ✅ {$school->name}: {$examCount} exams created for 2025");
        }

        $this->command->info('✅ Exams seeded successfully!');
    }

    /**
     * Generate exam name
     */
    private function generateExamName($gradeName, $subjectName, $examType, $term): string
    {
        $examTypeFormatted = ucfirst(str_replace('_', ' ', $examType));
        return "{$gradeName} - {$subjectName} - Term {$term} {$examTypeFormatted}";
    }
}
