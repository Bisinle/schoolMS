<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\Guardian;
use App\Models\Grade;
use Illuminate\Support\Str;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $guardians = Guardian::all();
        $grades = Grade::all();

        if ($guardians->isEmpty()) {
            $this->command->error('No guardians found. Run GuardianSeeder first.');
            return;
        }

        if ($grades->isEmpty()) {
            $this->command->error('No grades found. Run GradeSeeder first.');
            return;
        }

        $firstNamesMale = ['Ahmed', 'Ali', 'Yusuf', 'Omar', 'Mohamed', 'Ismail', 'Hassan', 'Abdi', 'Bilal', 'Khalid', 'Nasser', 'Jama', 'Salim'];
        $firstNamesFemale = ['Amina', 'Fatima', 'Hodan', 'Habiba', 'Asma', 'Nimco', 'Zahra', 'Maryam', 'Rahma', 'Layla', 'Ruqayya', 'Nasteha'];
        $lastNames = ['Hassan', 'Ali', 'Abdullahi', 'Isse', 'Mohamed', 'Abubakar', 'Dheere', 'Maalim', 'Bade', 'Hersi', 'Adam', 'Ahmed', 'Warsame'];

        $studentCount = 0;
        $admissionPrefix = 'S2024';

        foreach ($guardians as $guardian) {
            if ($studentCount >= 30) break;

            // Give each guardian between 1–4 students, but stop at 30 total
            $kidsCount = rand(1, 4);
            for ($i = 0; $i < $kidsCount && $studentCount < 30; $i++) {

                $isMale = rand(0, 1) === 1;
                $firstName = $isMale
                    ? $firstNamesMale[array_rand($firstNamesMale)]
                    : $firstNamesFemale[array_rand($firstNamesFemale)];
                $lastName = $lastNames[array_rand($lastNames)];

                $grade = $grades->random();
                $studentCount++;
                $admissionNumber = $admissionPrefix . str_pad($studentCount, 3, '0', STR_PAD_LEFT);

                Student::create([
                    'admission_number' => $admissionNumber,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'date_of_birth' => fake()->dateTimeBetween('2012-01-01', '2018-12-31')->format('Y-m-d'),
                    'gender' => $isMale ? 'male' : 'female',
                    'grade_id' => $grade->id,
                    'guardian_id' => $guardian->id,
                    'class_name' => $grade->name,
                    'enrollment_date' => '2024-01-08',
                    'status' => 'active',
                ]);
            }
        }

        $this->command->info("✅ Successfully seeded $studentCount students for {$guardians->count()} guardians!");
    }
}
