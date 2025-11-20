<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create super admin user
        User::create([
            'school_id' => null, // Super admins don't belong to any school
            'name' => 'Super Administrator',
            'email' => 'superadmin@schoolms.com',
            'password' => Hash::make('password'), // Change this in production!
            'role' => 'super_admin',
            'is_active' => true,
            'email_verified_at' => now(),
            'must_change_password' => false,
        ]);

        $this->command->info('Super Admin created successfully!');
        $this->command->info('Email: superadmin@schoolms.com');
        $this->command->info('Password: password');
    }
}

