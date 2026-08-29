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
     *
     * ⚠️ ONLY runs in local environment for safety.
     */
    public function run(): void
    {
        // Environment check - only run in local environment
        if (!app()->environment('local')) {
            $this->command->error('❌ Database seeding is only allowed in local environment!');
            $this->command->warn('   Current environment: ' . app()->environment());
            $this->command->warn('   Seeding aborted for safety.');
            return;
        }

        $this->command->info('🌱 Starting Database Seeding...');
        $this->command->info('   Environment: ' . app()->environment());
        $this->command->newLine();

        // 0. Super Admin (System Level)
        $this->command->info('🔐 STEP 0: System Administrator');
        $this->call([
            SuperAdminSeeder::class,
        ]);
        $this->command->newLine();

        // 1. Core Setup
        $this->command->info('📚 STEP 1: Core Setup');
        $this->call([
            SchoolSeeder::class,
            SchoolSettingSeeder::class,
            UserSeeder::class,
            // Spatie roles/permissions (Phase 4 of the migration in
            // docs/spatie-migration-worksheet.md) — inert, nothing reads
            // these yet. Safe to re-run, no dependency on any other seeder.
            RolePermissionSeeder::class,
            // Backfills every user onto their matching Spatie role (Phase 5)
            // — must run after both UserSeeder and RolePermissionSeeder.
            UserRoleBackfillSeeder::class,
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
