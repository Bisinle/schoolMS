<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;
use App\Models\Grade;
use App\Models\FeeCategory;
use App\Models\OneTimeFee;
use App\Models\AcademicYear;
use App\Models\AcademicTerm;

class FeeManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all schools
        $schools = School::all();

        foreach ($schools as $school) {
            // Create Academic Year for 2025 (calendar year format)
            $academicYear = AcademicYear::create([
                'school_id' => $school->id,
                'year' => '2025',
                'start_date' => '2025-01-01',
                'end_date' => '2025-12-31',
                'is_active' => true,
            ]);

            // Create 3 terms (calendar year)
            $terms = [
                ['term_number' => 1, 'name' => 'Term 1', 'start_date' => '2025-01-01', 'end_date' => '2025-04-30', 'is_active' => true],
                ['term_number' => 2, 'name' => 'Term 2', 'start_date' => '2025-05-01', 'end_date' => '2025-08-31', 'is_active' => false],
                ['term_number' => 3, 'name' => 'Term 3', 'start_date' => '2025-09-01', 'end_date' => '2025-12-31', 'is_active' => false],
            ];

            foreach ($terms as $termData) {
                AcademicTerm::create([
                    'school_id' => $school->id,
                    'academic_year_id' => $academicYear->id,
                    ...$termData,
                ]);
            }

            // Create One-Time Fees
            $oneTimeFees = [
                ['fee_name' => 'Admission Fee', 'default_amount' => 5000, 'can_be_waived' => true, 'description' => 'One-time admission fee for new students'],
                ['fee_name' => 'Interview Fee', 'default_amount' => 2000, 'can_be_waived' => true, 'description' => 'Interview fee for prospective students'],
            ];

            foreach ($oneTimeFees as $feeData) {
                OneTimeFee::create([
                    'school_id' => $school->id,
                    ...$feeData,
                ]);
            }

            // Get all grades for this school
            $grades = Grade::where('school_id', $school->id)->get();

            // Define fee structure by grade level
            $feeStructure = [
                'PP1' => ['Tuition' => 28000, 'Transport' => 9000, 'Sports' => 5000, 'Food' => 8000],
                'PP2' => ['Tuition' => 30000, 'Transport' => 10000, 'Sports' => 5000, 'Food' => 8000],
                'Grade 1' => ['Tuition' => 33000, 'Transport' => 12000, 'Sports' => 6000, 'Food' => 9000],
                'Grade 2' => ['Tuition' => 33000, 'Transport' => 12000, 'Sports' => 6000, 'Food' => 9000],
                'Grade 3' => ['Tuition' => 35000, 'Transport' => 12000, 'Sports' => 6000, 'Food' => 9000],
                'Grade 4' => ['Tuition' => 35000, 'Transport' => 12000, 'Sports' => 6000, 'Food' => 9000],
                'Grade 5' => ['Tuition' => 38000, 'Transport' => 13000, 'Sports' => 7000, 'Food' => 10000],
                'Grade 6' => ['Tuition' => 38000, 'Transport' => 13000, 'Sports' => 7000, 'Food' => 10000],
                'Grade 7' => ['Tuition' => 40000, 'Transport' => 13000, 'Sports' => 7000, 'Food' => 10000],
                'Grade 8' => ['Tuition' => 40000, 'Transport' => 13000, 'Sports' => 7000, 'Food' => 10000],
            ];

            foreach ($grades as $grade) {
                // Get fee structure for this grade (use default if not found)
                $fees = $feeStructure[$grade->name] ?? ['Tuition' => 30000, 'Transport' => 10000, 'Sports' => 5000, 'Food' => 8000];

                foreach ($fees as $categoryName => $amount) {
                    FeeCategory::create([
                        'school_id' => $school->id,
                        'grade_id' => $grade->id,
                        'category_name' => $categoryName,
                        'default_amount' => $amount,
                        'is_per_child' => true, // All fees are per child
                        'description' => "{$categoryName} fee for {$grade->name}",
                        'is_active' => true,
                    ]);
                }
            }
        }
    }
}

