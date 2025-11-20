<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SchoolSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a test school
        $school = School::create([
            'name' => 'Demo School',
            'slug' => 'demo-school',
            'domain' => 'demo.localhost',
            'admin_name' => 'Admin User',
            'admin_email' => 'admin@demo.school',
            'admin_phone' => '+254700000000',
            'is_active' => true,
            'status' => 'active',
            'trial_ends_at' => now()->addDays(30),
            'current_student_count' => 0,
            'address' => 'Demo Address, Nairobi, Kenya',
        ]);

        // Create admin user for the school
        User::create([
            'school_id' => $school->id,
            'name' => 'Admin User',
            'email' => 'admin@demo.school',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $this->command->info('Demo school and admin user created successfully!');
        $this->command->info('Email: admin@demo.school');
        $this->command->info('Password: password');
    }
}

