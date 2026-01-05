<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * This seeder runs all seeders in the correct order to populate
     * the database with sample data for development and testing.
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting Database Seeding...');
        $this->command->newLine();

        // 1. Core Setup
        $this->command->info('📚 STEP 1: Core Setup');
        $this->call([
            SchoolSeeder::class,
            SchoolSettingSeeder::class,
            UserSeeder::class,
        ]);
        $this->command->newLine();

        // 2. Academic Structure
        $this->command->info('🏫 STEP 2: Academic Structure');
        $this->call([
            AcademicYearSeeder::class,
            AcademicTermSeeder::class,
            GradeSeeder::class,
            SubjectSeeder::class,
            RoomSeeder::class,
        ]);
        $this->command->newLine();

        // 3. People
        $this->command->info('👥 STEP 3: People (Teachers, Students, Guardians)');
        $this->call([
            TeacherSeeder::class,
            GuardianSeeder::class,
            StudentSeeder::class,
        ]);
        $this->command->newLine();

        // 4. Timetables
        $this->command->info('📋 STEP 4: Timetables');
        $this->call([
            LevelDayBlueprintSeeder::class,
            TimetablePeriodSeeder::class,
            TimetableTemplateSeeder::class,
            TimetableSlotSeeder::class,
        ]);
        $this->command->newLine();

        // 5. Exams & Results
        $this->command->info('📝 STEP 5: Exams & Results');
        $this->call([
            ExamSeeder::class,
            ExamResultSeeder::class,
        ]);
        $this->command->newLine();

        // 6. Documents
        $this->command->info('📄 STEP 6: Documents');
        $this->call([
            DocumentCategorySeeder::class,
            DocumentSeeder::class,
        ]);
        $this->command->newLine();

        // 7. Fees & Transport
        $this->command->info('💰 STEP 7: Fees & Transport');
        $this->call([
            TransportRouteSeeder::class,
            UniversalFeeSeeder::class,
            TuitionFeeSeeder::class,
            FeePreferenceSystemSeeder::class,
        ]);
        $this->command->newLine();

        // 8. Attendance
        $this->command->info('✅ STEP 8: Attendance');
        $this->call([
            AttendanceSeeder::class,
        ]);
        $this->command->newLine();

        $this->command->info('✅ Database seeding completed successfully!');
        $this->command->newLine();
        $this->command->info('🎉 Your school management system is ready to use!');
    }
}
