<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UniversalFee;
use App\Models\AcademicYear;
use App\Models\School;

class UniversalFeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all schools
        $schools = School::all();

        // Universal fees structure
        $universalFees = [
            [
                'fee_type' => UniversalFee::TYPE_FOOD,
                'amount' => 8000.00,
                'description' => 'Lunch and snacks for the term',
            ],
            [
                'fee_type' => UniversalFee::TYPE_SPORTS,
                'amount' => 5000.00,
                'description' => 'Sports activities, equipment, and inter-school competitions',
            ],
            [
                'fee_type' => UniversalFee::TYPE_LIBRARY,
                'amount' => 3000.00,
                'description' => 'Library access and book lending services',
            ],
            [
                'fee_type' => UniversalFee::TYPE_TECHNOLOGY,
                'amount' => 4000.00,
                'description' => 'Computer lab access and technology resources',
            ],
        ];

        foreach ($schools as $school) {
            // Get active academic year for this school
            $academicYear = AcademicYear::where('school_id', $school->id)
                ->where('is_active', true)
                ->first();

            if (!$academicYear) {
                $this->command->warn("No active academic year found for school: {$school->name}");
                continue;
            }

            foreach ($universalFees as $fee) {
                UniversalFee::create([
                    'school_id' => $school->id,
                    'academic_year_id' => $academicYear->id,
                    ...$fee,
                    'is_active' => true,
                ]);
            }

            $this->command->info("Universal fees seeded for school: {$school->name}");
        }

        $this->command->info('Universal fees seeded successfully!');
    }
}

