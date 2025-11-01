<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@school.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // Create Teacher Users
        User::create([
            'name' => 'John Teacher',
            'email' => 'teacher@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
        ]);

        User::create([
            'name' => 'Sarah Teacher',
            'email' => 'teacher2@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
        ]);

        User::create([
            'name' => 'Ahmed Teacher',
            'email' => 'teacher3@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
        ]);

        // Create Guardian User
        User::create([
            'name' => 'Jane Doe',
            'email' => 'guardian@school.com',
            'password' => Hash::make('password'),
            'role' => 'guardian',
        ]);

        $this->command->info('✅ Users seeded successfully!');
    }
}