<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Grade;
use App\Models\School;

class GradeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates grades from PP1 to Grade 9 (ECD to Junior Secondary)
     */
    public function run(): void
    {
        $this->command->info('📚 Seeding Grades...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        // Define grades structure: PP1-PP2 (ECD), Grade 1-6 (Primary), Grade 7-9 (Junior Secondary)
        $gradesData = [
            // ECD Level (Pre-Primary)
            ['name' => 'PP1', 'code' => 'PP1', 'level' => 'ECD', 'capacity' => 30],
            ['name' => 'PP2', 'code' => 'PP2', 'level' => 'ECD', 'capacity' => 30],

            // Lower Primary (Grade 1-3)
            ['name' => 'Grade 1', 'code' => 'G1', 'level' => 'LOWER PRIMARY', 'capacity' => 40],
            ['name' => 'Grade 2', 'code' => 'G2', 'level' => 'LOWER PRIMARY', 'capacity' => 40],
            ['name' => 'Grade 3', 'code' => 'G3', 'level' => 'LOWER PRIMARY', 'capacity' => 40],

            // Upper Primary (Grade 4-6)
            ['name' => 'Grade 4', 'code' => 'G4', 'level' => 'UPPER PRIMARY', 'capacity' => 40],
            ['name' => 'Grade 5', 'code' => 'G5', 'level' => 'UPPER PRIMARY', 'capacity' => 40],
            ['name' => 'Grade 6', 'code' => 'G6', 'level' => 'UPPER PRIMARY', 'capacity' => 40],

            // Junior Secondary (Grade 7-9)
            ['name' => 'Grade 7', 'code' => 'G7', 'level' => 'JUNIOR SECONDARY', 'capacity' => 35],
            ['name' => 'Grade 8', 'code' => 'G8', 'level' => 'JUNIOR SECONDARY', 'capacity' => 35],
            ['name' => 'Grade 9', 'code' => 'G9', 'level' => 'JUNIOR SECONDARY', 'capacity' => 35],
        ];

        // Create grades for each school
        foreach ($schools as $school) {
            $gradeCount = 0;

            foreach ($gradesData as $gradeData) {
                // Check if grade already exists for this school
                $exists = Grade::where('school_id', $school->id)
                    ->where('code', $gradeData['code'])
                    ->exists();

                if (!$exists) {
                    Grade::create([
                        'school_id' => $school->id,
                        'name' => $gradeData['name'],
                        'code' => $gradeData['code'],
                        'level' => $gradeData['level'],
                        'capacity' => $gradeData['capacity'],
                        'description' => "Class for {$gradeData['name']} students",
                        'status' => 'active',
                    ]);
                    $gradeCount++;
                }
            }

            if ($gradeCount > 0) {
                $this->command->info("  ✅ {$school->name}: {$gradeCount} grades created");
            } else {
                $this->command->warn("  ⚠️  {$school->name}: Grades already exist, skipped");
            }
        }

        $this->command->info('✅ Grades seeded successfully!');
    }
}
