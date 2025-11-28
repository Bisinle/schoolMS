<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\Guardian;
use App\Models\Grade;
use App\Models\School;
use App\Services\UniqueIdentifierService;
use Illuminate\Support\Str;
use Faker\Factory as Faker;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        // ✅ Skip this seeder if not in local environment
        if (!app()->environment('local')) {
            $this->command->info('StudentSeeder skipped in non-local environment.');
            return;
        }
        $faker = Faker::create();

        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        $firstNamesMale = ['Sabir', 'Muad', 'Marwaan', 'Yusuf', 'Mohamed', 'Adnaan', 'Hassan', 'Abdi', 'Bilal', 'Khalid', 'Nasser', 'Jama', 'Salim'];
        $firstNamesFemale = ['Ayaan', 'Asma', 'Nimco', 'Zahra', 'Maryam', 'Rahma', 'Layla', 'Ruqayya', 'Nasteha', 'Fadumo', 'Hafsa', 'Sumaya'];
        $lastNames = ['Hassan', 'Ali', 'Abdullahi', 'Isse', 'Mohamed', 'Abubakar', 'Dheere', 'Maalim', 'Bade', 'Hersi', 'Adam', 'Ahmed', 'Warsame'];

        $totalStudentCount = 0;

        // Create students for each school
        foreach ($schools as $school) {
            $guardians = Guardian::where('school_id', $school->id)->get();
            $grades = Grade::where('school_id', $school->id)->get();

            if ($guardians->isEmpty()) {
                $this->command->warn("No guardians found for school {$school->name}. Skipping...");
                continue;
            }

            if ($grades->isEmpty()) {
                $this->command->warn("No grades found for school {$school->name}. Skipping...");
                continue;
            }

            $studentCount = 0;

            foreach ($guardians as $guardian) {
                if ($studentCount >= 30) break;

                $kidsCount = rand(1, 4);
                for ($i = 0; $i < $kidsCount && $studentCount < 30; $i++) {

                    $isMale = rand(0, 1) === 1;
                    $firstName = $isMale
                        ? $firstNamesMale[array_rand($firstNamesMale)]
                        : $firstNamesFemale[array_rand($firstNamesFemale)];
                    $lastName = $lastNames[array_rand($lastNames)];

                    $grade = $grades->random();
                    $studentCount++;
                    $totalStudentCount++;

                    // Generate unique admission number using UniqueIdentifierService
                    $admissionNumber = UniqueIdentifierService::generateAdmissionNumber($school->id);

                    Student::create([
                        'school_id' => $school->id,
                        'admission_number' => $admissionNumber,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'date_of_birth' => $faker->dateTimeBetween('2012-01-01', '2018-12-31')->format('Y-m-d'),
                        'gender' => $isMale ? 'male' : 'female',
                        'grade_id' => $grade->id,
                        'guardian_id' => $guardian->id,
                        'class_name' => $grade->name,
                        'enrollment_date' => '2024-01-08',
                        'status' => 'active',
                    ]);
                }
            }

            $this->command->info("  ✅ {$school->name}: {$studentCount} students created");
        }

        $this->command->info("✅ Successfully seeded {$totalStudentCount} students across all schools!");
    }
}
