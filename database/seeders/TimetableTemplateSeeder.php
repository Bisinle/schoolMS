<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TimetableTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * NOTE: Templates should be created from the UI after generating periods.
     * This seeder is intentionally empty.
     *
     * To create templates:
     * 1. Generate periods from blueprints first
     * 2. Go to Timetables in the admin panel
     * 3. Click "Create New Template" for each grade/term
     */
    public function run(): void
    {
        $this->command->info('📅 Timetable Template Seeder');
        $this->command->info('   ℹ️  Templates should be created from the UI');
        $this->command->info('   → First generate periods from blueprints');
        $this->command->info('   → Then create templates in Timetables section');
    }
}
