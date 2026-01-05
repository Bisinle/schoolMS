<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\GuardianFeePreference;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\AcademicTerm;
use App\Models\TransportRoute;
use App\Models\School;
use App\Models\User;

class FeePreferenceSystemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates guardian fee preferences for all active students across all terms
     */
    public function run(): void
    {
        $this->command->info('🎯 Seeding Guardian Fee Preferences...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        $totalCreated = 0;

        foreach ($schools as $school) {
            // Get all guardians for this school
            $guardians = Guardian::where('school_id', $school->id)->get();

            if ($guardians->isEmpty()) {
                $this->command->warn("  ⚠️  {$school->name}: No guardians found, skipping...");
                continue;
            }

            // Get all academic terms for this school
            $terms = AcademicTerm::where('school_id', $school->id)->get();

            if ($terms->isEmpty()) {
                $this->command->warn("  ⚠️  {$school->name}: No academic terms found, skipping...");
                continue;
            }

            // Get all transport routes for this school
            $transportRoutes = TransportRoute::where('school_id', $school->id)
                ->where('is_active', true)
                ->get();

            // Get admin user for updated_by field
            $adminUser = User::where('school_id', $school->id)
                ->where('role', 'admin')
                ->first();

            $preferenceCount = 0;

            foreach ($guardians as $guardian) {
                // Get all active students for this guardian
                $students = Student::where('guardian_id', $guardian->id)
                    ->where('status', 'active')
                    ->get();

                if ($students->isEmpty()) {
                    continue;
                }

                foreach ($students as $student) {
                    foreach ($terms as $term) {
                        // Check if preference already exists
                        $exists = GuardianFeePreference::where('guardian_id', $guardian->id)
                            ->where('student_id', $student->id)
                            ->where('academic_term_id', $term->id)
                            ->exists();

                        if (!$exists) {
                            // Randomly assign preferences for variety
                            $tuitionType = rand(0, 100) < 70 ? 'full_day' : 'half_day'; // 70% full day
                            $hasTransport = rand(0, 100) < 60; // 60% use transport
                            $transportRoute = $hasTransport && $transportRoutes->isNotEmpty()
                                ? $transportRoutes->random()
                                : null;
                            $transportType = $hasTransport
                                ? (rand(0, 100) < 75 ? 'two_way' : 'one_way') // 75% two-way
                                : null;
                            $includeFood = rand(0, 100) < 80; // 80% include food
                            $includeSports = rand(0, 100) < 65; // 65% include sports

                            GuardianFeePreference::create([
                                'school_id' => $school->id,
                                'guardian_id' => $guardian->id,
                                'student_id' => $student->id,
                                'academic_term_id' => $term->id,
                                'tuition_type' => $tuitionType,
                                'transport_route_id' => $transportRoute?->id,
                                'transport_type' => $transportType,
                                'include_food' => $includeFood,
                                'include_sports' => $includeSports,
                                'notes' => $this->generateNotes($tuitionType, $hasTransport, $includeFood, $includeSports),
                                'updated_by' => $adminUser?->id,
                            ]);

                            $preferenceCount++;
                            $totalCreated++;
                        }
                    }
                }
            }

            if ($preferenceCount > 0) {
                $this->command->info("  ✅ {$school->name}: {$preferenceCount} fee preferences created");
            } else {
                $this->command->warn("  ⚠️  {$school->name}: Fee preferences already exist");
            }
        }

        $this->command->info("✅ {$totalCreated} guardian fee preferences seeded successfully!");
    }

    /**
     * Generate realistic notes based on preferences
     */
    private function generateNotes(string $tuitionType, bool $hasTransport, bool $includeFood, bool $includeSports): ?string
    {
        $notes = [];

        if ($tuitionType === 'half_day') {
            $halfDayReasons = [
                'Parent picks up child at lunch time',
                'Child attends afternoon activities elsewhere',
                'Family preference for half-day program',
                'Child is young and needs shorter school day',
            ];
            $notes[] = $halfDayReasons[array_rand($halfDayReasons)];
        }

        if (!$hasTransport) {
            $noTransportReasons = [
                'Parent provides own transport',
                'Lives within walking distance',
                'Carpools with neighbors',
                'Uses family driver',
            ];
            $notes[] = $noTransportReasons[array_rand($noTransportReasons)];
        }

        if (!$includeFood) {
            $notes[] = 'Child brings packed lunch from home';
        }

        if (!$includeSports) {
            $notes[] = 'Not participating in sports program this term';
        }

        return !empty($notes) ? implode('. ', $notes) . '.' : null;
    }
}
