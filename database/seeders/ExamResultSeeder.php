<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Student;
use App\Models\School;
use Illuminate\Support\Facades\DB;

class ExamResultSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates exam results for all students in all exams for 2025
     */
    public function run(): void
    {
        $this->command->info('📊 Seeding Exam Results for 2025...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        foreach ($schools as $school) {
            $resultCount = 0;

            // Get all exams for 2025
            $exams = Exam::where('school_id', $school->id)
                ->where('academic_year', 2025)
                ->with('grade')
                ->get();

            if ($exams->isEmpty()) {
                $this->command->warn("  ⚠️  {$school->name}: No exams found for 2025, skipping...");
                continue;
            }

            $this->command->info("  📝 Processing {$exams->count()} exams for {$school->name}...");

            // Process exams in batches
            foreach ($exams as $exam) {
                // Get all active students in this grade
                $students = Student::where('school_id', $school->id)
                    ->where('grade_id', $exam->grade_id)
                    ->where('status', 'active')
                    ->get();

                if ($students->isEmpty()) {
                    continue;
                }

                $resultsToInsert = [];

                foreach ($students as $student) {
                    // Check if result already exists
                    $exists = ExamResult::where('exam_id', $exam->id)
                        ->where('student_id', $student->id)
                        ->exists();

                    if (!$exists) {
                        // Generate realistic marks based on student performance
                        $marks = $this->generateRealisticMarks($exam->exam_type);

                        $resultsToInsert[] = [
                            'school_id' => $school->id,
                            'exam_id' => $exam->id,
                            'student_id' => $student->id,
                            'marks' => $marks,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];

                        $resultCount++;
                    }
                }

                // Batch insert results for this exam
                if (!empty($resultsToInsert)) {
                    DB::table('exam_results')->insert($resultsToInsert);
                }
            }

            $this->command->info("  ✅ {$school->name}: {$resultCount} exam results created");
        }

        $this->command->info('✅ Exam Results seeded successfully!');
    }

    /**
     * Generate realistic marks based on exam type
     * Opening exams: Generally lower (50-85)
     * Midterm exams: Moderate (55-90)
     * End term exams: Higher (60-95)
     */
    private function generateRealisticMarks(string $examType): float
    {
        switch ($examType) {
            case 'opening':
                // Opening exams: 50-85 range
                return round(rand(5000, 8500) / 100, 2);

            case 'midterm':
                // Midterm exams: 55-90 range
                return round(rand(5500, 9000) / 100, 2);

            case 'end_term':
                // End term exams: 60-95 range
                return round(rand(6000, 9500) / 100, 2);

            default:
                // Default: 50-90 range
                return round(rand(5000, 9000) / 100, 2);
        }
    }
}
