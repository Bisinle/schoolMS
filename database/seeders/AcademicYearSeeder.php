<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\School;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class AcademicYearSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

// ✅ Skip this seeder if not in local environment
             if (!app()->environment('local')) {
                $this->command->info('AcademicYearSeeder skipped in non-local environment.');
                return;}

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->warn('⚠️  No schools found. Please run SchoolSeeder first.');
            return;
        }

        foreach ($schools as $school) {
            $this->command->info("📅 Creating academic years for {$school->name}...");

            // Create academic years for 2023, 2024, 2025, and 2026
            $years = [
                [
                    'year' => '2023',
                    'start_date' => Carbon::create(2023, 1, 1),
                    'end_date' => Carbon::create(2023, 12, 31),
                    'is_active' => false,
                ],
                [
                    'year' => '2024',
                    'start_date' => Carbon::create(2024, 1, 1),
                    'end_date' => Carbon::create(2024, 12, 31),
                    'is_active' => false,
                ],
                [
                    'year' => '2025',
                    'start_date' => Carbon::create(2025, 1, 1),
                    'end_date' => Carbon::create(2025, 12, 31),
                    'is_active' => true, // Current year is active
                ],
                [
                    'year' => '2026',
                    'start_date' => Carbon::create(2026, 1, 1),
                    'end_date' => Carbon::create(2026, 12, 31),
                    'is_active' => false,
                ],
            ];

            foreach ($years as $yearData) {
                // Check if academic year already exists
                $existingYear = AcademicYear::where('school_id', $school->id)
                    ->where('year', $yearData['year'])
                    ->first();

                if ($existingYear) {
                    $this->command->warn("   ⚠️  Academic Year {$yearData['year']} already exists. Skipping...");
                    continue;
                }

                AcademicYear::create([
                    'school_id' => $school->id,
                    'year' => $yearData['year'],
                    'start_date' => $yearData['start_date'],
                    'end_date' => $yearData['end_date'],
                    'is_active' => $yearData['is_active'],
                ]);

                $status = $yearData['is_active'] ? '✅ ACTIVE' : '  ';
                $this->command->info("   {$status} Academic Year {$yearData['year']}");
            }
        }

        $this->command->info('✅ Academic years seeded successfully!');
    }
}

