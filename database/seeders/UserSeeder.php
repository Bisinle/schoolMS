<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\School;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Get all schools to randomly assign users
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        // Create Teacher Users (for TeacherSeeder to use)
        User::create([
            'school_id' => $schools->random()->id,
            'name' => 'Faith Teacher',
            'email' => 'faith.teacher@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'is_active' => true,
            'phone' => '0712345671',
        ]);

        User::create([
            'school_id' => $schools->random()->id,
            'name' => 'Margaret Teacher',
            'email' => 'margaret.teacher@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'is_active' => true,
            'phone' => '0712345672',
        ]);

        User::create([
            'school_id' => $schools->random()->id,
            'name' => 'Lydia Teacher',
            'email' => 'lydia.teacher@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'is_active' => true,
            'phone' => '0712345673',
        ]);

        User::create([
            'school_id' => $schools->random()->id,
            'name' => 'Damaris Teacher',
            'email' => 'damaris.teacher@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'is_active' => true,
            'phone' => '0712345674',
        ]);

        User::create([
            'school_id' => $schools->random()->id,
            'name' => 'Petty Teacher',
            'email' => 'petty.teacher@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'is_active' => true,
            'phone' => '0712345675',
        ]);

        $this->command->info('✅ Teacher users seeded successfully!');
        $this->command->info('ℹ️  Admin users are created by SchoolSeeder');
        $this->command->info('ℹ️  Guardian users are created by GuardianSeeder');
    }
}
