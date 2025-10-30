<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Grade;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create Grades with new structure
        // ECD (Early Childhood Development)
        $prePrimary1 = Grade::create([
            'name' => 'Pre-Primary 1',
            'level' => 'ECD',
            'capacity' => 30,
            'description' => 'First year of early childhood education',
            'status' => 'active',
        ]);

        $prePrimary2 = Grade::create([
            'name' => 'Pre-Primary 2',
            'level' => 'ECD',
            'capacity' => 30,
            'description' => 'Second year of early childhood education',
            'status' => 'active',
        ]);

        // Lower Primary (Grade 1-3)
        $grade1 = Grade::create([
            'name' => 'Grade 1',
            'level' => 'Lower Primary',
            'capacity' => 40,
            'description' => 'First year of lower primary education',
            'status' => 'active',
        ]);

        $grade2 = Grade::create([
            'name' => 'Grade 2',
            'level' => 'Lower Primary',
            'capacity' => 40,
            'description' => 'Second year of lower primary education',
            'status' => 'active',
        ]);

        $grade3 = Grade::create([
            'name' => 'Grade 3',
            'level' => 'Lower Primary',
            'capacity' => 40,
            'description' => 'Third year of lower primary education',
            'status' => 'active',
        ]);

        // Upper Primary (Grade 4-6)
        $grade4 = Grade::create([
            'name' => 'Grade 4',
            'level' => 'Upper Primary',
            'capacity' => 35,
            'description' => 'First year of upper primary education',
            'status' => 'active',
        ]);

        $grade5 = Grade::create([
            'name' => 'Grade 5',
            'level' => 'Upper Primary',
            'capacity' => 35,
            'description' => 'Second year of upper primary education',
            'status' => 'active',
        ]);

        $grade6 = Grade::create([
            'name' => 'Grade 6',
            'level' => 'Upper Primary',
            'capacity' => 35,
            'description' => 'Third year of upper primary education',
            'status' => 'active',
        ]);

        // Junior Secondary (Grade 7-9)
        $grade7 = Grade::create([
            'name' => 'Grade 7',
            'level' => 'Junior Secondary',
            'capacity' => 40,
            'description' => 'First year of junior secondary education',
            'status' => 'active',
        ]);

        $grade8 = Grade::create([
            'name' => 'Grade 8',
            'level' => 'Junior Secondary',
            'capacity' => 40,
            'description' => 'Second year of junior secondary education',
            'status' => 'active',
        ]);

        $grade9 = Grade::create([
            'name' => 'Grade 9',
            'level' => 'Junior Secondary',
            'capacity' => 40,
            'description' => 'Third year of junior secondary education',
            'status' => 'active',
        ]);

        // Create Admin User
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@sms.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Create Teacher Users
        $teacher1User = User::create([
            'name' => 'John Teacher',
            'email' => 'teacher@sms.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'email_verified_at' => now(),
        ]);

        $teacher1 = Teacher::create([
            'user_id' => $teacher1User->id,
            'employee_number' => 'TCH001',
            'phone_number' => '+1122334455',
            'address' => '789 Teacher Lane, City',
            'qualification' => 'Masters in Education',
            'subject_specialization' => 'Mathematics',
            'date_of_joining' => '2020-01-15',
            'status' => 'active',
        ]);

        // Assign teacher to grades
        $teacher1->grades()->attach($grade3->id, ['is_class_teacher' => true]);
        $teacher1->grades()->attach($grade4->id, ['is_class_teacher' => false]);

        $teacher2User = User::create([
            'name' => 'Sarah Anderson',
            'email' => 'sarah.teacher@sms.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'email_verified_at' => now(),
        ]);

        $teacher2 = Teacher::create([
            'user_id' => $teacher2User->id,
            'employee_number' => 'TCH002',
            'phone_number' => '+9988776655',
            'address' => '321 Science Street, Town',
            'qualification' => 'PhD in Physics',
            'subject_specialization' => 'Science',
            'date_of_joining' => '2019-09-01',
            'status' => 'active',
        ]);

        // Assign teacher to grades
        $teacher2->grades()->attach($grade5->id, ['is_class_teacher' => true]);
        $teacher2->grades()->attach($prePrimary2->id, ['is_class_teacher' => false]);

        // Create Teacher 3 for ECD
        $teacher3User = User::create([
            'name' => 'Mary Johnson',
            'email' => 'mary.teacher@sms.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
            'email_verified_at' => now(),
        ]);

        $teacher3 = Teacher::create([
            'user_id' => $teacher3User->id,
            'employee_number' => 'TCH003',
            'phone_number' => '+5544332211',
            'address' => '456 ECD Avenue, City',
            'qualification' => 'Bachelor in Early Childhood Education',
            'subject_specialization' => 'Early Childhood Development',
            'date_of_joining' => '2021-03-10',
            'status' => 'active',
        ]);

        // Assign teacher to ECD grades
        $teacher3->grades()->attach($prePrimary1->id, ['is_class_teacher' => true]);

        // Create Guardian 1
        $guardian1User = User::create([
            'name' => 'Abshir Isse',
            'email' => 'abshir@sms.com',
            'password' => Hash::make('password'),
            'role' => 'guardian',
            'email_verified_at' => now(),
        ]);

        $guardian1 = Guardian::create([
            'user_id' => $guardian1User->id,
            'phone_number' => '+1234567890',
            'address' => '123 Main Street, City',
            'occupation' => 'Engineer',
            'relationship' => 'Father',
        ]);

        // Create Guardian 2
        $guardian2User = User::create([
            'name' => 'Abdullahi Dheere',
            'email' => 'dheere@sms.com',
            'password' => Hash::make('password'),
            'role' => 'guardian',
            'email_verified_at' => now(),
        ]);

        $guardian2 = Guardian::create([
            'user_id' => $guardian2User->id,
            'phone_number' => '+0987654321',
            'address' => '456 Oak Avenue, Town',
            'occupation' => 'Doctor',
            'relationship' => 'Father',
        ]);
         // Create Guardian 3
         $guardian3User = User::create([
            'name' => 'Hassan Adam',
            'email' => 'hassan@sms.com',
            'password' => Hash::make('password'),
            'role' => 'guardian',
            'email_verified_at' => now(),
        ]);

        $guardian2 = Guardian::create([
            'user_id' => $guardian3User->id,
            'phone_number' => '+0987654321',
            'address' => '456 Oak Avenue, Town',
            'occupation' => 'Financial Auditor',
            'relationship' => 'Father',
        ]);

        // Create Students
        Student::create([
            'admission_number' => 'STD001',
            'first_name' => 'Adnaan',
            'last_name' => 'Bashir',
            'gender' => 'male',
            'date_of_birth' => '2015-05-15',
            'guardian_id' => $guardian1->id,
            'grade_id' => $grade4->id,
            'enrollment_date' => '2023-09-01',
            'status' => 'active',
        ]);

        Student::create([
            'admission_number' => 'STD002',
            'first_name' => 'Ahlaam',
            'last_name' => 'Dheere',
            'gender' => 'female',
            'date_of_birth' => '2013-08-20',
            'guardian_id' => $guardian2->id,
            'grade_id' => $grade5->id,
            'enrollment_date' => '2021-09-01',
            'status' => 'active',
        ]);

        Student::create([
            'admission_number' => 'STD003',
            'first_name' => 'Olivia',
            'last_name' => 'Williams',
            'gender' => 'female',
            'date_of_birth' => '2014-11-10',
            'guardian_id' => $guardian2->id,
            'grade_id' => $grade4->id,
            'enrollment_date' => '2022-09-01',
            'status' => 'active',
        ]);

        Student::create([
            'admission_number' => 'STD004',
            'first_name' => 'Liam',
            'last_name' => 'Williams',
            'gender' => 'male',
            'date_of_birth' => '2019-03-15',
            'guardian_id' => $guardian2->id,
            'grade_id' => $prePrimary1->id,
            'enrollment_date' => '2024-09-01',
            'status' => 'active',
        ]);

        // 🎯 CALL ATTENDANCE SEEDER HERE
        $this->call([
            AttendanceSeeder::class,
        ]);
    }
}