<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AcademicYear;
use App\Models\School;

class AcademicYearSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates academic year 2025 and sets it as active
     */
    public function run(): void
    {
        $this->command->info('📅 Seeding Academic Years...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        foreach ($schools as $school) {
            // Check if 2025 academic year already exists
            $exists = AcademicYear::where('school_id', $school->id)
                ->where('year', '2025')
                ->exists();

            if (!$exists) {
                // Deactivate all other academic years for this school
                AcademicYear::where('school_id', $school->id)
                    ->update(['is_active' => false]);

                // Create 2025 academic year as active
                AcademicYear::create([
                    'school_id' => $school->id,
                    'year' => '2025',
                    'start_date' => '2025-01-06', // First Monday of January 2025
                    'end_date' => '2025-11-28',   // Last Friday of November 2025
                    'is_active' => true,
                ]);

                $this->command->info("  ✅ {$school->name}: Academic Year 2025 created and set as active");
            } else {
                // Update existing 2025 to be active
                AcademicYear::where('school_id', $school->id)
                    ->where('year', '2025')
                    ->update(['is_active' => true]);

                // Deactivate others
                AcademicYear::where('school_id', $school->id)
                    ->where('year', '!=', '2025')
                    ->update(['is_active' => false]);

                $this->command->warn("  ⚠️  {$school->name}: Academic Year 2025 already exists, set as active");
            }
        }

        $this->command->info('✅ Academic Years seeded successfully!');
    }
}
