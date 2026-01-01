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
            SchoolSeeder::class,            // 1️⃣ Create schools + admin users (1 per school)
            UserSeeder::class,              // 2️⃣ Create teacher users only
            TeacherSeeder::class,           // 3️⃣ Create teacher records (links to users)
            GuardianSeeder::class,          // 4️⃣ Create guardian users + guardian records
            GradeSeeder::class,             // 5️⃣ Create grades for each school
            SubjectSeeder::class,           // 6️⃣ Create subjects for each school
            StudentSeeder::class,           // 7️⃣ Create students
            AttendanceSeeder::class,        // 8️⃣ Create attendance records
            DocumentCategorySeeder::class,  // 9️⃣ Create document categories
            DocumentSeeder::class,          // 🔟 Create sample documents
            AcademicYearSeeder::class,      // 1️⃣1️⃣ Create academic years (2023-2026)
            AcademicTermSeeder::class,      // 1️⃣2️⃣ Create academic terms (3 per year)
            FeePreferenceSystemSeeder::class,       // 1️⃣3️⃣ Create fee categories for all grades
            SuperAdminSeeder::class,        // 1️⃣4️⃣ Create super admin (global access)

            // TIMETABLE SEEDERS - ADDED IN PHASE 5
            TimetablePeriodSeeder::class,       // 1️⃣5️⃣ Create timetable periods for all schools
            RoomSeeder::class,                  // 1️⃣6️⃣ Create rooms for all schools
            TimetableTemplateSeeder::class,     // 1️⃣7️⃣ Create timetable templates for all grades
            TimetableSlotSeeder::class,         // 1️⃣8️⃣ Create timetable slots (actual schedules)
            TeacherAvailabilitySeeder::class,   // 1️⃣9️⃣ Create teacher availability records
        ]);

        $this->command->newLine();
        $this->command->info('===========================================');
        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('===========================================');
        $this->command->info('🏫 Schools Created (3 schools):');
        $this->command->info('===========================================');
        $this->command->info('1. Elmi Academy (Islamic School)');
        $this->command->info('   📧 admin@elmi.school / password');
        $this->command->info('');
        $this->command->info('2. Sunrise International School (Islamic School)');
        $this->command->info('   📧 admin@sunrise.school / password');
        $this->command->info('');
        $this->command->info('3. مريم بنت عمران (Madrasah)');
        $this->command->info('   📧 admin@madrasah.school / password');
        $this->command->info('===========================================');
        $this->command->info('📊 Data Summary (per school):');
        $this->command->info('- 1 Admin User (created with school)');
        $this->command->info('- 11 Grades (PP1-PP2, G1-G9)');
        $this->command->info('- 13 Subjects (8 Academic, 5 Islamic)');
        $this->command->info('- 5 Teachers (shared across schools)');
        $this->command->info('- 10 Guardians (shared across schools)');
        $this->command->info('- ~30 Students per school');
        $this->command->info('- 13 Document Categories');
        $this->command->info('- Multiple Documents with fake PDFs');
        $this->command->info('- Attendance records for all students');
        $this->command->info('- 4 Academic Years (2023-2026, 2025 active)');
        $this->command->info('- 12 Academic Terms (3 per year)');
        $this->command->info('- 10 Timetable Periods (8 lessons + 2 breaks)');
        $this->command->info('- 20 Rooms (15 classrooms + 5 special rooms)');
        $this->command->info('- Timetable Templates (1 per grade)');
        $this->command->info('- Timetable Slots (complete weekly schedules)');
        $this->command->info('- Teacher Availability Records');
        $this->command->info('===========================================');
        $this->command->info('👤 Global Super Admin:');
        $this->command->info('📧 superadmin@schoolms.com / password');
        $this->command->info('===========================================');
        $this->command->info('📝 Additional Test Accounts:');
        $this->command->info('- faith.teacher@school.com / password');
        $this->command->info('- margaret.teacher@school.com / password');
        $this->command->info('- lydia.teacher@school.com / password');
        $this->command->info('- damaris.teacher@school.com / password');
        $this->command->info('- petty.teacher@school.com / password');
        $this->command->info('- Various guardian accounts (see GuardianSeeder)');
        $this->command->info('===========================================');
    }
}