<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TuitionFee;
use App\Models\Grade;
use App\Models\AcademicYear;
use App\Models\School;

class TuitionFeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates tuition fees for all grades in the 2025 academic year
     */
    public function run(): void
    {
        $this->command->info('💰 Seeding Tuition Fees...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        // Tuition fee structure based on grade level
        $tuitionStructure = [
            'ECD' => [
                'full_day' => 28000.00,
                'half_day' => 18000.00,
            ],
            'LOWER PRIMARY' => [
                'full_day' => 33000.00,
                'half_day' => 22000.00,
            ],
            'UPPER PRIMARY' => [
                'full_day' => 38000.00,
                'half_day' => 26000.00,
            ],
            'JUNIOR SECONDARY' => [
                'full_day' => 45000.00,
                'half_day' => 32000.00,
            ],
        ];

        $totalCreated = 0;

        foreach ($schools as $school) {
            // Get 2025 academic year
            $academicYear = AcademicYear::where('school_id', $school->id)
                ->where('year', '2025')
                ->first();

            if (!$academicYear) {
                $this->command->warn("  ⚠️  {$school->name}: No 2025 academic year found, skipping...");
                continue;
            }

            // Get all grades for this school
            $grades = Grade::where('school_id', $school->id)->get();

            if ($grades->isEmpty()) {
                $this->command->warn("  ⚠️  {$school->name}: No grades found, skipping...");
                continue;
            }

            $feeCount = 0;

            foreach ($grades as $grade) {
                // Check if tuition fee already exists
                $exists = TuitionFee::where('school_id', $school->id)
                    ->where('grade_id', $grade->id)
                    ->where('academic_year_id', $academicYear->id)
                    ->exists();

                if (!$exists) {
                    $level = $grade->level ?? 'LOWER PRIMARY';
                    $fees = $tuitionStructure[$level] ?? $tuitionStructure['LOWER PRIMARY'];

                    TuitionFee::create([
                        'school_id' => $school->id,
                        'grade_id' => $grade->id,
                        'academic_year_id' => $academicYear->id,
                        'amount_full_day' => $fees['full_day'],
                        'amount_half_day' => $fees['half_day'],
                        'is_active' => true,
                    ]);

                    $feeCount++;
                    $totalCreated++;
                }
            }

            if ($feeCount > 0) {
                $this->command->info("  ✅ {$school->name}: {$feeCount} tuition fees created");
            } else {
                $this->command->warn("  ⚠️  {$school->name}: Tuition fees already exist");
            }
        }

        $this->command->info("✅ {$totalCreated} tuition fees seeded successfully!");
    }
}
