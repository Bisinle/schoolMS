<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TimetablePeriodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * NOTE: Periods should be generated from the UI using blueprints.
     * This seeder is intentionally empty.
     *
     * To generate periods:
     * 1. Go to Blueprints in the admin panel
     * 2. Select a blueprint (e.g., "ECD Standard Day")
     * 3. Click "Generate Periods" button
     */
    public function run(): void
    {
        $this->command->info('⏰ Timetable Period Seeder');
        $this->command->info('   ℹ️  Periods should be generated from the UI using blueprints');
        $this->command->info('   → Go to Blueprints → Select a blueprint → Generate Periods');
    }
}
