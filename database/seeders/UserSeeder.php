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
            'name' => 'Abdi Elmi',
            'email' => 'admin@school.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
            'phone' => '0758500708',
        ]);
        User::create([
            'name' => 'Michelle Mwangi',
            'email' => 'mich.admin@school.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
            'phone' => '0700562291',
        ]);
        User::create([
            'name' => 'Bisinle Maki',
            'email' => 'bisinle77@gmail.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
            'phone' => '0700562291',
        ]);
   
        // Create Teacher Users
        User::create([
            'name' => 'Faith Teacher',
            'email' => 'faith.teacher@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'is_active' => true,
            'phone' => '0712345671',
        ]);

        User::create([
            'name' => 'Margaret Teacher',
            'email' => 'margaret.teacher@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'is_active' => true,
            'phone' => '0712345672',
        ]);

        User::create([
            'name' => 'Lydia Teacher',
            'email' => 'lydia.teacher@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'is_active' => true,
            'phone' => '0712345673',
        ]);

        User::create([
            'name' => 'Damaris Teacher',
            'email' => 'damaris.teacher@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'is_active' => true,
            'phone' => '0712345674',
        ]);

        User::create([
            'name' => 'Petty Teacher',
            'email' => 'petty.teacher@school.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'is_active' => true,
            'phone' => '0712345675',
        ]);

        // Create Guardian User
        User::create([
            'name' => 'Jane Doe',
            'email' => 'guardian@school.com',
            'password' => Hash::make('password'),
            'role' => 'guardian',
            'is_active' => true,
            'phone' => '0712345680',
        ]);

        $this->command->info('✅ Users seeded successfully!');
    }
}