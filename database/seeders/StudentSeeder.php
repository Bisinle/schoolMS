<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\Guardian;
use App\Models\Grade;
use App\Models\School;
use App\Services\UniqueIdentifierService;
use Faker\Factory as Faker;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates 30 students per school distributed across grades
     */
    public function run(): void
    {
        $this->command->info('👶 Seeding Students...');

        $faker = Faker::create();

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        // Somali/Muslim first names
        $firstNamesMale = [
            'Ahmed', 'Mohamed', 'Hassan', 'Ali', 'Omar', 'Abdi', 'Ibrahim', 'Yusuf',
            'Abdullahi', 'Ismail', 'Hamza', 'Bilal', 'Khalid', 'Salah', 'Aden'
        ];

        $firstNamesFemale = [
            'Amina', 'Fatima', 'Khadija', 'Halima', 'Safia', 'Maryam', 'Zainab',
            'Aisha', 'Hawa', 'Ayan', 'Sumaya', 'Rahma', 'Nura', 'Habiba', 'Yasmin'
        ];

        $lastNames = [
            'Mohamed', 'Hassan', 'Ali', 'Ahmed', 'Abdi', 'Omar', 'Ibrahim', 'Yusuf',
            'Hussein', 'Farah', 'Aden', 'Osman', 'Nur', 'Issa', 'Salah'
        ];

        foreach ($schools as $school) {
            $guardians = Guardian::where('school_id', $school->id)->get();
            $grades = Grade::where('school_id', $school->id)->get();

            if ($guardians->isEmpty()) {
                $this->command->warn("  ⚠️  {$school->name}: No guardians found, skipping...");
                continue;
            }

            if ($grades->isEmpty()) {
                $this->command->warn("  ⚠️  {$school->name}: No grades found, skipping...");
                continue;
            }

            $studentCount = 0;
            $targetStudents = 30;

            // Distribute students among guardians (each guardian gets 1-3 kids)
            foreach ($guardians as $guardian) {
                if ($studentCount >= $targetStudents) break;

                // Each guardian has 1-3 children
                $kidsCount = rand(1, 3);

                for ($i = 0; $i < $kidsCount && $studentCount < $targetStudents; $i++) {
                    $isMale = rand(0, 1) === 1;
                    $firstName = $isMale
                        ? $firstNamesMale[array_rand($firstNamesMale)]
                        : $firstNamesFemale[array_rand($firstNamesFemale)];
                    $lastName = $lastNames[array_rand($lastNames)];

                    // Assign to random grade
                    $grade = $grades->random();

                    // Generate unique admission number
                    $admissionNumber = UniqueIdentifierService::generateAdmissionNumber($school->id);

                    Student::create([
                        'school_id' => $school->id,
                        'admission_number' => $admissionNumber,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'date_of_birth' => $faker->dateTimeBetween('2012-01-01', '2020-12-31')->format('Y-m-d'),
                        'gender' => $isMale ? 'male' : 'female',
                        'grade_id' => $grade->id,
                        'guardian_id' => $guardian->id,
                        'class_name' => $grade->name,
                        'enrollment_date' => now()->subMonths(rand(1, 12))->format('Y-m-d'),
                        'status' => 'active',
                    ]);

                    $studentCount++;
                }
            }

            $this->command->info("  ✅ {$school->name}: {$studentCount} students created");
        }

        $this->command->info('✅ Students seeded successfully!');
    }
}
