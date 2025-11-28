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
        // ✅ Skip this seeder if not in local environment
        // if (!app()->environment('local')) {
        //     $this->command->info('SuperAdminSeeder skipped in non-local environment.');
        //     return;
        // }

        // ✅ Use updateOrCreate to avoid duplicate entries
        User::updateOrCreate(
            ['email' => 'superadmin@schoolms.com'], // Search criteria
            [
                'school_id' => null, // Super admins don't belong to any school
                'name' => 'Super Administrator',
                'password' => Hash::make('adminMS@SCHOOL'), // Change this in production!
                'role' => 'super_admin',
                'is_active' => true,
                'email_verified_at' => now(),
                'must_change_password' => false,
            ]
        );

        $this->command->info('Super Admin seeded successfully!');
        $this->command->info('Email: superadmin@schoolms.com');
        $this->command->info('Password: password');
    }
}
