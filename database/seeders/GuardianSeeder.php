<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Guardian;
use App\Models\School;
use App\Services\UniqueIdentifierService;
use Illuminate\Support\Facades\Hash;

class GuardianSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates guardian/parent users for students
     */
    public function run(): void
    {
        $this->command->info('👨‍👩‍👧‍👦 Seeding Guardians...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        // Guardian names (15 guardians to cover 30 students - each can have 1-3 kids)
        $guardians = [
            ['name' => 'Ali Mohamed', 'gender' => 'male', 'relationship' => 'father', 'occupation' => 'Business Owner'],
            ['name' => 'Amina Hassan', 'gender' => 'female', 'relationship' => 'mother', 'occupation' => 'Teacher'],
            ['name' => 'Omar Abdi', 'gender' => 'male', 'relationship' => 'father', 'occupation' => 'Engineer'],
            ['name' => 'Fatima Ahmed', 'gender' => 'female', 'relationship' => 'mother', 'occupation' => 'Nurse'],
            ['name' => 'Hassan Ibrahim', 'gender' => 'male', 'relationship' => 'father', 'occupation' => 'Accountant'],
            ['name' => 'Khadija Omar', 'gender' => 'female', 'relationship' => 'mother', 'occupation' => 'Doctor'],
            ['name' => 'Abdi Yusuf', 'gender' => 'male', 'relationship' => 'father', 'occupation' => 'Lawyer'],
            ['name' => 'Halima Ali', 'gender' => 'female', 'relationship' => 'mother', 'occupation' => 'Pharmacist'],
            ['name' => 'Mohamed Farah', 'gender' => 'male', 'relationship' => 'father', 'occupation' => 'Businessman'],
            ['name' => 'Safia Hussein', 'gender' => 'female', 'relationship' => 'mother', 'occupation' => 'Lecturer'],
            ['name' => 'Ibrahim Aden', 'gender' => 'male', 'relationship' => 'father', 'occupation' => 'Civil Servant'],
            ['name' => 'Maryam Osman', 'gender' => 'female', 'relationship' => 'mother', 'occupation' => 'Banker'],
            ['name' => 'Abdullahi Nur', 'gender' => 'male', 'relationship' => 'father', 'occupation' => 'Contractor'],
            ['name' => 'Zainab Issa', 'gender' => 'female', 'relationship' => 'mother', 'occupation' => 'Entrepreneur'],
            ['name' => 'Yusuf Salah', 'gender' => 'male', 'relationship' => 'father', 'occupation' => 'IT Specialist'],
        ];

        foreach ($schools as $school) {
            $guardianCount = 0;

            foreach ($guardians as $index => $g) {
                $email = strtolower(str_replace(' ', '.', $g['name'])) . '@' . $school->slug . '.com';

                // Check if user already exists
                $exists = User::where('school_id', $school->id)
                    ->where('email', $email)
                    ->exists();

                if (!$exists) {
                    $user = User::create([
                        'school_id' => $school->id,
                        'name' => $g['name'],
                        'email' => $email,
                        'password' => Hash::make('password'),
                        'role' => 'guardian',
                        'is_active' => true,
                        'phone' => '07' . str_pad(20000000 + $index, 8, '0', STR_PAD_LEFT),
                        'email_verified_at' => now(),
                    ]);

                    Guardian::create([
                        'school_id' => $school->id,
                        'user_id' => $user->id,
                        'guardian_number' => UniqueIdentifierService::generateGuardianNumber($school->id),
                        'phone_number' => $user->phone,
                        'address' => 'Nairobi, Kenya',
                        'occupation' => $g['occupation'],
                        'relationship' => $g['relationship'],
                    ]);

                    $guardianCount++;
                }
            }

            if ($guardianCount > 0) {
                $this->command->info("  ✅ {$school->name}: {$guardianCount} guardians created");
            } else {
                $this->command->warn("  ⚠️  {$school->name}: Guardians already exist, skipped");
            }
        }

        $this->command->info('✅ Guardians seeded successfully!');
    }
}
