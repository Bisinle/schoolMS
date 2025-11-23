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
        // School 1: Elmi Academy (Islamic School - shows all subjects)
        $school1 = School::create([
            'name' => 'Elmi Academy',
            'slug' => 'elmi-academy',
            'domain' => 'elmi.localhost',
            'admin_name' => 'bisinle',
            'admin_email' => 'admin@elmi.school',
            'admin_phone' => '+254700000000',
            'is_active' => true,
            'status' => 'active',
            'school_type' => 'islamic_school',
            'trial_ends_at' => now()->addDays(30),
            'current_student_count' => 0,
            'address' => 'Nairobi, Kenya',
        ]);

        User::create([
            'school_id' => $school1->id,
            'name' => 'Bisinle Maki',
            'email' => 'admin@elmi.school',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // School 2: Sunrise International School (Islamic School - shows all subjects)
        $school2 = School::create([
            'name' => 'Sunrise International School',
            'slug' => 'sunrise-international',
            'domain' => 'sunrise.localhost',
            'admin_name' => 'Sarah Johnson',
            'admin_email' => 'admin@sunrise.school',
            'admin_phone' => '+254711111111',
            'is_active' => true,
            'status' => 'active',
            'school_type' => 'islamic_school',
            'trial_ends_at' => now()->addDays(30),
            'current_student_count' => 0,
            'address' => 'Mombasa, Kenya',
        ]);

        User::create([
            'school_id' => $school2->id,
            'name' => 'Sarah Johnson',
            'email' => 'admin@sunrise.school',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // School 3: Al-Noor Academy (Madrasah - hides academic subjects)
        $school3 = School::create([
            'name' => 'مريم بنت عمران',
            'slug' => 'maryam-bint-omran',
            'domain' => 'maryam.localhost',
            'admin_name' => 'فردوسه حرسي ',
            'admin_email' => 'admin@madrasah.school',
            'admin_phone' => '+254722222222',
            'is_active' => true,
            'status' => 'active',
            'school_type' => 'madrasah',
            'trial_ends_at' => now()->addDays(30),
            'current_student_count' => 0,
            'address' => 'Kisumu, Kenya',
        ]);

        User::create([
            'school_id' => $school3->id,
            'name' => 'Ahmed Hassan',
            'email' => 'admin@madrasah.school',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $this->command->info('✅ 3 schools created successfully!');
        $this->command->info('');
        $this->command->info('School 1: Elmi Academy (Islamic School - shows all subjects)');
        $this->command->info('  Email: admin@elmi.school | Password: password');
        $this->command->info('');
        $this->command->info('School 2: Sunrise International School (Islamic School - shows all subjects)');
        $this->command->info('  Email: admin@sunrise.school | Password: password');
        $this->command->info('');
        $this->command->info('School 3: Al-Noor Academy (Madrasah - hides academic subjects)');
        $this->command->info('  Email: admin@alnoor.school | Password: password');
    }
}

