<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🌱 Starting database seeding...');
        $this->command->newLine();

        // Call seeders in order (respecting dependencies)
        $this->call([
            UserSeeder::class,
            TeacherSeeder::class,
            GuardianSeeder::class,
            GradeSeeder::class,
            SubjectSeeder::class,
            StudentSeeder::class,
            AttendanceSeeder::class,
            DocumentCategorySeeder::class,  // 🆕 NEW
            DocumentSeeder::class, 
        ]);

        $this->command->newLine();
        $this->command->info('===========================================');
        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('===========================================');
        $this->command->info('📧 Login Credentials:');
        $this->command->info('===========================================');
        $this->command->info('👤 Admin: admin@school.com / password');
        $this->command->info('👨‍🏫 Teacher 1: teacher@school.com / password');
        $this->command->info('👨‍🏫 Teacher 2: teacher2@school.com / password');
        $this->command->info('👨‍🏫 Teacher 3: teacher3@school.com / password');
        $this->command->info('👪 Guardian: guardian@school.com / password');
        $this->command->info('===========================================');
        $this->command->info('📊 Summary:');
        $this->command->info('- 5 Users (1 Admin, 3 Teachers, 1 Guardian)');
        $this->command->info('- 11 Grades (PP1-PP2, G1-G9)');
        $this->command->info('- 12 Subjects (7 Academic, 5 Islamic)');
        $this->command->info('- 3 Teachers (assigned to various grades)');
        $this->command->info('- 5 Students (distributed across grades)');
        $this->command->info('- 1 Guardian (parent of all sample students)');
        $this->command->info('===========================================');
        $this->command->info('- 13 Document Categories'); 
        $this->command->info('- ~100+ Documents (with fake PDF files)'); 
        $this->command->info('===========================================');
    }
}