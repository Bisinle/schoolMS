<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\School;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates teacher users for each school
     */
    public function run(): void
    {
        $this->command->info('👥 Seeding Teacher Users...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        // Teacher names (12 teachers)
        $teacherNames = [
            'Ahmed Hassan',
            'Fatima Mohamed',
            'Omar Ali',
            'Amina Abdi',
            'Hassan Ibrahim',
            'Khadija Ahmed',
            'Abdi Rahman',
            'Halima Yusuf',
            'Mohamed Farah',
            'Safia Omar',
            'Ibrahim Aden',
            'Maryam Hassan',
        ];

        // Create teacher users for each school
        foreach ($schools as $school) {
            $userCount = 0;

            foreach ($teacherNames as $index => $name) {
                $email = strtolower(str_replace(' ', '.', $name)) . '@' . $school->slug . '.com';

                // Check if user already exists
                $exists = User::where('school_id', $school->id)
                    ->where('email', $email)
                    ->exists();

                if (!$exists) {
                    User::create([
                        'school_id' => $school->id,
                        'name' => $name,
                        'email' => $email,
                        'password' => Hash::make('password'),
                        'role' => 'teacher',
                        'is_active' => true,
                        'phone' => '07' . str_pad(10000000 + $index, 8, '0', STR_PAD_LEFT),
                        'email_verified_at' => now(),
                    ]);
                    $userCount++;
                }
            }

            if ($userCount > 0) {
                $this->command->info("  ✅ {$school->name}: {$userCount} teacher users created");
            } else {
                $this->command->warn("  ⚠️  {$school->name}: Teacher users already exist, skipped");
            }
        }

        $this->command->info('✅ Teacher users seeded successfully!');
    }
}
