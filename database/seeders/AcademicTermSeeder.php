<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\AcademicTerm;
use App\Models\School;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class AcademicTermSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ✅ Skip this seeder if not in local environment
             if (!app()->environment('local')) {
                $this->command->info('AcademicTermSeeder skipped in non-local environment.');
                return;}
        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->warn('⚠️  No schools found. Please run SchoolSeeder first.');
            return;
        }

        foreach ($schools as $school) {
            $this->command->info("📚 Creating academic terms for {$school->name}...");

            // Get all academic years for this school
            $academicYears = AcademicYear::where('school_id', $school->id)->get();

            if ($academicYears->isEmpty()) {
                $this->command->warn("   ⚠️  No academic years found for {$school->name}. Skipping...");
                continue;
            }

            foreach ($academicYears as $academicYear) {
                $this->command->info("   Creating terms for Academic Year {$academicYear->year}...");

                // Define terms for each academic year
                // Kenyan school calendar typically runs Jan-Dec with 3 terms
                $year = (int) $academicYear->year;
                
                $terms = [
                    [
                        'term_number' => 1,
                        'name' => 'Term 1',
                        'start_date' => Carbon::create($year, 1, 15),  // Mid-January
                        'end_date' => Carbon::create($year, 4, 15),    // Mid-April
                        'is_active' => $academicYear->is_active && Carbon::now()->between(
                            Carbon::create($year, 1, 15),
                            Carbon::create($year, 4, 15)
                        ),
                    ],
                    [
                        'term_number' => 2,
                        'name' => 'Term 2',
                        'start_date' => Carbon::create($year, 5, 1),   // Early May
                        'end_date' => Carbon::create($year, 8, 15),    // Mid-August
                        'is_active' => $academicYear->is_active && Carbon::now()->between(
                            Carbon::create($year, 5, 1),
                            Carbon::create($year, 8, 15)
                        ),
                    ],
                    [
                        'term_number' => 3,
                        'name' => 'Term 3',
                        'start_date' => Carbon::create($year, 9, 1),   // Early September
                        'end_date' => Carbon::create($year, 11, 30),   // End of November
                        'is_active' => $academicYear->is_active && Carbon::now()->between(
                            Carbon::create($year, 9, 1),
                            Carbon::create($year, 11, 30)
                        ),
                    ],
                ];

                foreach ($terms as $termData) {
                    // Check if term already exists
                    $existingTerm = AcademicTerm::where('academic_year_id', $academicYear->id)
                        ->where('term_number', $termData['term_number'])
                        ->first();

                    if ($existingTerm) {
                        $this->command->warn("      ⚠️  {$termData['name']} already exists. Skipping...");
                        continue;
                    }

                    AcademicTerm::create([
                        'school_id' => $school->id,
                        'academic_year_id' => $academicYear->id,
                        'term_number' => $termData['term_number'],
                        'name' => $termData['name'],
                        'start_date' => $termData['start_date'],
                        'end_date' => $termData['end_date'],
                        'is_active' => $termData['is_active'],
                    ]);

                    $status = $termData['is_active'] ? '✅ ACTIVE' : '  ';
                    $this->command->info(
                        "      {$status} {$termData['name']}: " .
                        $termData['start_date']->format('M d') . ' - ' .
                        $termData['end_date']->format('M d, Y')
                    );
                }
            }
        }

        $this->command->info('✅ Academic terms seeded successfully!');
    }
}

