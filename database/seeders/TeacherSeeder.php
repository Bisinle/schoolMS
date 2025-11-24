<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Teacher;
use App\Services\UniqueIdentifierService;
use Illuminate\Database\Seeder;

class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        $teacherUsers = User::where('role', 'teacher')->get();

        if ($teacherUsers->count() < 3) {
            $this->command->error('Not enough teacher users found. Run UserSeeder first.');
            return;
        }

        Teacher::create([
            'school_id' => $teacherUsers[0]->school_id,
            'user_id' => $teacherUsers[0]->id,
            'employee_number' => UniqueIdentifierService::generateEmployeeNumber($teacherUsers[0]->school_id),
            'phone_number' => '0712345678',
            'address' => 'Nairobi, Kenya',
            'qualification' => 'Bachelor of Education',
            'subject_specialization' => 'Mathematics',
            'date_of_joining' => '2020-01-15',
            'status' => 'active',
        ]);

        Teacher::create([
            'school_id' => $teacherUsers[1]->school_id,
            'user_id' => $teacherUsers[1]->id,
            'employee_number' => UniqueIdentifierService::generateEmployeeNumber($teacherUsers[1]->school_id),
            'phone_number' => '0723456789',
            'address' => 'Nairobi, Kenya',
            'qualification' => 'Master of Science',
            'subject_specialization' => 'Science & Technology',
            'date_of_joining' => '2019-08-20',
            'status' => 'active',
        ]);

        Teacher::create([
            'school_id' => $teacherUsers[2]->school_id,
            'user_id' => $teacherUsers[2]->id,
            'employee_number' => UniqueIdentifierService::generateEmployeeNumber($teacherUsers[2]->school_id),
            'phone_number' => '0734567890',
            'address' => 'Mombasa, Kenya',
            'qualification' => 'Bachelor of Islamic Studies',
            'subject_specialization' => 'Islamic Studies & Arabic',
            'date_of_joining' => '2021-03-10',
            'status' => 'active',
        ]);

        Teacher::create([
            'school_id' => $teacherUsers[3]->school_id,
            'user_id' => $teacherUsers[3]->id,
            'employee_number' => UniqueIdentifierService::generateEmployeeNumber($teacherUsers[3]->school_id),
            'phone_number' => '0734567890',
            'address' => 'Mombasa, Kenya',
            'qualification' => 'Bachelor of Islamic Studies',
            'subject_specialization' => 'Islamic Studies & Arabic',
            'date_of_joining' => '2021-03-10',
            'status' => 'active',
        ]);

        Teacher::create([
            'school_id' => $teacherUsers[4]->school_id,
            'user_id' => $teacherUsers[4]->id,
            'employee_number' => UniqueIdentifierService::generateEmployeeNumber($teacherUsers[4]->school_id),
            'phone_number' => '0734567890',
            'address' => 'Mombasa, Kenya',
            'qualification' => 'Bachelor of Islamic Studies',
            'subject_specialization' => 'Islamic Studies & Arabic',
            'date_of_joining' => '2021-03-10',
            'status' => 'active',
        ]);

        $this->command->info('✅ Teachers seeded successfully!');
    }
}