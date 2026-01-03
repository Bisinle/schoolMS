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

        if ($teacherUsers->count() < 5) {
            $this->command->error('Not enough teacher users found. Run UserSeeder first.');
            return;
        }

        // Lydia - English & Literature
        Teacher::create([
            'school_id' => $teacherUsers[0]->school_id,
            'user_id' => $teacherUsers[0]->id,
            'employee_number' => UniqueIdentifierService::generateEmployeeNumber($teacherUsers[0]->school_id),
            'phone_number' => '0712345671',
            'address' => 'Nairobi, Kenya',
            'qualification' => 'Bachelor of Arts in English',
            'date_of_joining' => '2020-01-15',
            'status' => 'active',
        ]);

        // Faith - Mathematics
        Teacher::create([
            'school_id' => $teacherUsers[1]->school_id,
            'user_id' => $teacherUsers[1]->id,
            'employee_number' => UniqueIdentifierService::generateEmployeeNumber($teacherUsers[1]->school_id),
            'phone_number' => '0712345672',
            'address' => 'Nairobi, Kenya',
            'qualification' => 'Bachelor of Education (Mathematics)',
            'date_of_joining' => '2019-08-20',
            'status' => 'active',
        ]);

        // Margaret - Science & Technology
        Teacher::create([
            'school_id' => $teacherUsers[2]->school_id,
            'user_id' => $teacherUsers[2]->id,
            'employee_number' => UniqueIdentifierService::generateEmployeeNumber($teacherUsers[2]->school_id),
            'phone_number' => '0712345673',
            'address' => 'Mombasa, Kenya',
            'qualification' => 'Master of Science',
            'date_of_joining' => '2021-03-10',
            'status' => 'active',
        ]);

        // Betty - Islamic Studies & Arabic
        Teacher::create([
            'school_id' => $teacherUsers[3]->school_id,
            'user_id' => $teacherUsers[3]->id,
            'employee_number' => UniqueIdentifierService::generateEmployeeNumber($teacherUsers[3]->school_id),
            'phone_number' => '0712345674',
            'address' => 'Kisumu, Kenya',
            'qualification' => 'Bachelor of Islamic Studies',
            'date_of_joining' => '2022-01-10',
            'status' => 'active',
        ]);

        // Jackline - Social Studies & CRE
        Teacher::create([
            'school_id' => $teacherUsers[4]->school_id,
            'user_id' => $teacherUsers[4]->id,
            'employee_number' => UniqueIdentifierService::generateEmployeeNumber($teacherUsers[4]->school_id),
            'phone_number' => '0712345675',
            'address' => 'Nakuru, Kenya',
            'qualification' => 'Bachelor of Education (Arts)',
            'date_of_joining' => '2023-05-15',
            'status' => 'active',
        ]);

        $this->command->info('✅ 5 Teachers seeded successfully!');
        $this->command->info('   - Lydia (English & Literature)');
        $this->command->info('   - Faith (Mathematics)');
        $this->command->info('   - Margaret (Science & Technology)');
        $this->command->info('   - Betty (Islamic Studies & Arabic)');
        $this->command->info('   - Jackline (Social Studies & CRE)');
    }
}
