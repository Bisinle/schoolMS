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
            'name' => 'Faith Teacher',
            'email' => 'faith.teacher@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
        ]);

        User::create([
            'name' => 'Margaret Teacher',
            'email' => 'margaret.teacher2@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
        ]);

        User::create([
            'name' => 'Lydia Teacher',
            'email' => 'lydia.teacher3@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
        ]);
        User::create([
            'name' => 'Damaris Teacher',
            'email' => 'damaris.teacher3@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
        ]);
        User::create([
            'name' => 'Petty Teacher',
            'email' => 'petty.teacher3@school.com',
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
