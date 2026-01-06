<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates the super admin user with full system access.
     * Super admin is not tied to any specific school (school_id = null).
     */
    public function run(): void
    {
        $this->command->info('🔐 Creating Super Admin user...');

        // Check if super admin already exists
        $existingSuperAdmin = User::where('email', 'superadmin@schoolms.com')->first();

        if ($existingSuperAdmin) {
            $this->command->warn('⚠️  Super Admin already exists!');
            $this->command->info("   Email: {$existingSuperAdmin->email}");
            $this->command->info("   Name: {$existingSuperAdmin->name}");
            return;
        }

        // Prepare super admin data with base fields
        $userData = [
            'school_id' => null, // Super admin is not tied to any school
            'name' => 'Super Administrator',
            'email' => 'superadmin@schoolms.com',
            'password' => Hash::make('Luna141312schoolms'),
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ];

        // Add optional fields if columns exist
        if (Schema::hasColumn('users', 'employee_number')) {
            $userData['employee_number'] = null; // Super admin doesn't need employee number
        }
        if (Schema::hasColumn('users', 'phone')) {
            $userData['phone'] = null;
        }
        if (Schema::hasColumn('users', 'is_active')) {
            $userData['is_active'] = true;
        }
        if (Schema::hasColumn('users', 'must_change_password')) {
            $userData['must_change_password'] = false;
        }
        if (Schema::hasColumn('users', 'created_by')) {
            $userData['created_by'] = null; // Self-created
        }
        if (Schema::hasColumn('users', 'last_login_at')) {
            $userData['last_login_at'] = null;
        }

        // Create super admin user
        $superAdmin = User::create($userData);

        $this->command->info('✅ Super Admin created successfully!');
        $this->command->newLine();
        $this->command->info('📋 Super Admin Details:');
        $this->command->info("   ID: {$superAdmin->id}");
        $this->command->info("   Name: {$superAdmin->name}");
        $this->command->info("   Email: {$superAdmin->email}");
        $this->command->info("   Role: {$superAdmin->role}");
        $this->command->info("   Password: Luna141312schoolms");
        $this->command->newLine();
        $this->command->info('🔑 Login Credentials:');
        $this->command->info('   Email: superadmin@schoolms.com');
        $this->command->info('   Password: Luna141312schoolms');
        $this->command->newLine();
        $this->command->warn('⚠️  IMPORTANT: Change the password after first login!');
    }
}
