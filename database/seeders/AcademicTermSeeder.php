<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AcademicYear;
use App\Models\AcademicTerm;
use App\Models\School;

class AcademicTermSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates 3 terms for 2025 academic year and sets Term 1 as active
     */
    public function run(): void
    {
        $this->command->info('📆 Seeding Academic Terms...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        // Term dates for 2025
        $termsData = [
            [
                'term_number' => 1,
                'name' => 'Term 1',
                'start_date' => '2025-01-06',
                'end_date' => '2025-04-04',
                'is_active' => true, // Set Term 1 as active
            ],
            [
                'term_number' => 2,
                'name' => 'Term 2',
                'start_date' => '2025-05-05',
                'end_date' => '2025-08-08',
                'is_active' => false,
            ],
            [
                'term_number' => 3,
                'name' => 'Term 3',
                'start_date' => '2025-09-01',
                'end_date' => '2025-11-28',
                'is_active' => false,
            ],
        ];

        foreach ($schools as $school) {
            // Get 2025 academic year
            $academicYear = AcademicYear::where('school_id', $school->id)
                ->where('year', '2025')
                ->first();

            if (!$academicYear) {
                $this->command->warn("  ⚠️  {$school->name}: No 2025 academic year found, skipping...");
                continue;
            }

            $termCount = 0;

            foreach ($termsData as $termData) {
                // Check if term already exists
                $exists = AcademicTerm::where('academic_year_id', $academicYear->id)
                    ->where('term_number', $termData['term_number'])
                    ->exists();

                if (!$exists) {
                    AcademicTerm::create(array_merge($termData, [
                        'school_id' => $school->id,
                        'academic_year_id' => $academicYear->id,
                    ]));
                    $termCount++;
                } else {
                    // Update existing term to set Term 1 as active
                    AcademicTerm::where('academic_year_id', $academicYear->id)
                        ->where('term_number', $termData['term_number'])
                        ->update(['is_active' => $termData['is_active']]);
                }
            }

            if ($termCount > 0) {
                $this->command->info("  ✅ {$school->name}: {$termCount} terms created (Term 1 set as active)");
            } else {
                $this->command->warn("  ⚠️  {$school->name}: Terms already exist, Term 1 set as active");
            }
        }

        $this->command->info('✅ Academic Terms seeded successfully!');
    }
}
