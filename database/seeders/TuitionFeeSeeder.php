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
     */
    public function run(): void
    {
        // Get all schools
        $schools = School::all();

        foreach ($schools as $school) {
            // Get active academic year for this school
            $academicYear = AcademicYear::where('school_id', $school->id)
                ->where('is_active', true)
                ->first();

            if (!$academicYear) {
                $this->command->warn("No active academic year found for school: {$school->name}");
                continue;
            }

            // Get all grades for this school
            $grades = Grade::where('school_id', $school->id)
                ->where('status', 'active')
                ->get();

            if ($grades->isEmpty()) {
                $this->command->warn("No active grades found for school: {$school->name}");
                continue;
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

            foreach ($grades as $grade) {
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
            }

            $this->command->info("Tuition fees seeded for school: {$school->name} ({$grades->count()} grades)");
        }

        $this->command->info('Tuition fees seeded successfully!');
    }
}

