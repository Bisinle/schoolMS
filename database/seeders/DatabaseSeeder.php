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
            SchoolSeeder::class,            // 🆕 FIRST: Create schools
            UserSeeder::class,
            TeacherSeeder::class,
            GuardianSeeder::class,
            GradeSeeder::class,
            SubjectSeeder::class,
            StudentSeeder::class,
            AttendanceSeeder::class,
            DocumentCategorySeeder::class,
            DocumentSeeder::class,
        ]);

        $this->command->newLine();
        $this->command->info('===========================================');
        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('===========================================');
        $this->command->info('🏫 Schools Created:');
        $this->command->info('===========================================');
        $this->command->info('1. Elmi Academy');
        $this->command->info('   📧 admin@elmi.school / password');
        $this->command->info('');
        $this->command->info('2. Sunrise International School');
        $this->command->info('   📧 admin@sunrise.school / password');
        $this->command->info('');
        $this->command->info('3. Al-Noor Academy');
        $this->command->info('   📧 admin@alnoor.school / password');
        $this->command->info('===========================================');
        $this->command->info('📊 Summary (per school):');
        $this->command->info('- 11 Grades (PP1-PP2, G1-G9)');
        $this->command->info('- 13 Subjects (8 Academic, 5 Islamic)');
        $this->command->info('- Multiple Teachers & Guardians');
        $this->command->info('- ~30 Students per school');
        $this->command->info('- 13 Document Categories');
        $this->command->info('- Multiple Documents with fake PDFs');
        $this->command->info('- Attendance records for all students');
        $this->command->info('===========================================');
        $this->command->info('📝 Additional Test Users:');
        $this->command->info('- admin@school.com / password');
        $this->command->info('- guardian@school.com / password');
        $this->command->info('- Various teacher accounts');
        $this->command->info('===========================================');
    }
}