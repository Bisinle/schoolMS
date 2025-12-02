<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FeeCategory;
use App\Models\FeeAmount;
use App\Models\AcademicYear;
use App\Models\School;

class FeeCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Only run in local environment
        if (!app()->environment('local')) {
            $this->command->info('FeeCategorySeeder skipped in non-local environment.');
            return;
        }

        // Get the first school
        $school = School::first();
        if (!$school) {
            $this->command->warn('No school found. Please create a school first.');
            return;
        }

        // Get the active academic year
        $academicYear = AcademicYear::where('school_id', $school->id)
            ->where('is_active', true)
            ->first();

        if (!$academicYear) {
            $this->command->warn('No active academic year found. Please create an academic year first.');
            return;
        }

        $this->command->info('Seeding fee categories and amounts...');

        // Create Universal Fee Categories
        $universalFees = [
            [
                'name' => 'Sports',
                'description' => 'Sports and physical education fees',
                'amount' => 5000,
            ],
            [
                'name' => 'Food',
                'description' => 'Lunch and snacks',
                'amount' => 8000,
            ],
            [
                'name' => 'Transport',
                'description' => 'School bus transportation',
                'amount' => 12000,
            ],
            [
                'name' => 'Library',
                'description' => 'Library and reading materials',
                'amount' => 3000,
            ],
        ];

        foreach ($universalFees as $feeData) {
            // Check if category already exists
            $category = FeeCategory::where('school_id', $school->id)
                ->where('name', $feeData['name'])
                ->first();

            if (!$category) {
                $category = FeeCategory::create([
                    'school_id' => $school->id,
                    'name' => $feeData['name'],
                    'description' => $feeData['description'],
                    'is_universal' => true,
                    'is_active' => true,
                ]);

                // Create a single fee amount for this universal category
                FeeAmount::create([
                    'school_id' => $school->id,
                    'fee_category_id' => $category->id,
                    'academic_year_id' => $academicYear->id,
                    'grade_range' => null, // Universal fees have no grade range
                    'amount' => $feeData['amount'],
                    'is_active' => true,
                ]);

                $this->command->info("Created universal fee: {$feeData['name']} - KSh {$feeData['amount']}");
            } else {
                $this->command->info("Skipped (already exists): {$feeData['name']}");
            }
        }

        // Create Grade-Specific Fee Category (Tuition)
        $tuitionCategory = FeeCategory::where('school_id', $school->id)
            ->where('name', 'Tuition')
            ->first();

        if (!$tuitionCategory) {
            $tuitionCategory = FeeCategory::create([
                'school_id' => $school->id,
                'name' => 'Tuition',
                'description' => 'Tuition fees vary by grade level',
                'is_universal' => false,
                'is_active' => true,
            ]);

            // Create fee amounts for different grade ranges
            $gradeRanges = [
                ['range' => 'PP1-PP2', 'amount' => 28000],
                ['range' => '1-3', 'amount' => 33000],
                ['range' => '4-5', 'amount' => 38000],
                ['range' => '6-8', 'amount' => 42000],
            ];

            foreach ($gradeRanges as $rangeData) {
                FeeAmount::create([
                    'school_id' => $school->id,
                    'fee_category_id' => $tuitionCategory->id,
                    'academic_year_id' => $academicYear->id,
                    'grade_range' => $rangeData['range'],
                    'amount' => $rangeData['amount'],
                    'is_active' => true,
                ]);

                $this->command->info("Created tuition fee for {$rangeData['range']}: KSh {$rangeData['amount']}");
            }
        } else {
            $this->command->info("Skipped (already exists): Tuition");
        }

        $this->command->info('Fee categories and amounts seeded successfully!');
    }
}

