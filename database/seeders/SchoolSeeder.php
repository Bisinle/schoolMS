<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SchoolSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates Demo School with all available fields based on migrations:
     * - 2025_11_20_000001_create_schools_table.php (base fields)
     * - 2025_11_22_100000_add_school_type_to_schools_table.php (school_type)
     * - 2025_12_02_092916_add_profile_fields_to_schools_table.php (tagline, motto, vision, mission, phones, physical_address)
     */
    public function run(): void
    {
        $this->command->info('🏫 Seeding Demo School...');

        // Check if Demo School already exists
        $existingSchool = School::where('slug', 'demo-school')->first();

        if ($existingSchool) {
            $this->command->warn('⚠️  Demo School already exists!');
            $this->command->info("   Name: {$existingSchool->name}");
            $this->command->info("   Slug: {$existingSchool->slug}");
            return;
        }

        // Prepare school data with base fields (always exist)
        $schoolData = [
            'name' => 'Demo School',
            'slug' => 'demo-school',
            'domain' => 'demo.localhost',
            'admin_name' => 'Demo Admin',
            'admin_email' => 'admin@demoschool.com',
            'admin_phone' => '+254712345678',
            'is_active' => true,
            'status' => 'active',
            'trial_ends_at' => now()->addDays(90), // 90-day trial
            'current_student_count' => 0,
            'address' => 'P.O. Box 12345-00100, Nairobi, Kenya',
            'logo_path' => null,
        ];

        // Add school_type if column exists (from 2025_11_22_100000 migration)
        if (Schema::hasColumn('schools', 'school_type')) {
            $schoolData['school_type'] = 'islamic_school';
        }

        // Add profile fields if they exist (from 2025_12_02_092916 migration)
        if (Schema::hasColumn('schools', 'tagline')) {
            $schoolData['tagline'] = 'Excellence in Education';
        }
        if (Schema::hasColumn('schools', 'motto')) {
            $schoolData['motto'] = 'Knowledge, Character, Service';
        }
        if (Schema::hasColumn('schools', 'vision')) {
            $schoolData['vision'] = 'To be a leading institution in providing quality education and nurturing future leaders.';
        }
        if (Schema::hasColumn('schools', 'mission')) {
            $schoolData['mission'] = 'To provide comprehensive education that develops students academically, morally, and socially.';
        }
        if (Schema::hasColumn('schools', 'phone_primary')) {
            $schoolData['phone_primary'] = '+254712345678';
        }
        if (Schema::hasColumn('schools', 'phone_secondary')) {
            $schoolData['phone_secondary'] = '+254787654321';
        }
        if (Schema::hasColumn('schools', 'physical_address')) {
            $schoolData['physical_address'] = '123 Education Avenue, Nairobi, Kenya';
        }

        // Create Demo School
        $school = School::create($schoolData);

        $this->command->info('✅ Demo School created successfully!');
        $this->command->newLine();

        // Create Admin User for Demo School
        $this->command->info('👤 Creating Admin User for Demo School...');

        // Prepare user data
        $userData = [
            'school_id' => $school->id,
            'name' => 'Demo Admin',
            'email' => 'admin@demoschool.com',
            'password' => Hash::make('DemoSchool2026!'),
            'role' => 'admin',
            'is_active' => true,
            'email_verified_at' => now(),
        ];

        // Add optional fields if columns exist
        if (Schema::hasColumn('users', 'employee_number')) {
            $userData['employee_number'] = 'ADMIN001';
        }
        if (Schema::hasColumn('users', 'phone')) {
            $userData['phone'] = '+254712345678';
        }
        if (Schema::hasColumn('users', 'must_change_password')) {
            $userData['must_change_password'] = false;
        }
        if (Schema::hasColumn('users', 'created_by')) {
            $userData['created_by'] = null;
        }
        if (Schema::hasColumn('users', 'last_login_at')) {
            $userData['last_login_at'] = null;
        }

        User::create($userData);

        $this->command->info('✅ Admin User created successfully!');
        $this->command->newLine();

        $this->command->info('📋 Demo School Details:');
        $this->command->info("   School ID: {$school->id}");
        $this->command->info("   School Name: {$school->name}");
        $this->command->info("   School Slug: {$school->slug}");
        $this->command->info("   School Type: " . ($school->school_type ?? 'N/A'));
        $this->command->info("   Status: {$school->status}");
        $this->command->info("   Trial Ends: " . $school->trial_ends_at->format('Y-m-d'));
        $this->command->newLine();

        $this->command->info('🔑 Admin Login Credentials:');
        $this->command->info('   Email: admin@demoschool.com');
        $this->command->info('   Password: DemoSchool2026!');
        $this->command->newLine();

        $this->command->warn('⚠️  IMPORTANT: Save these credentials!');
    }
}
