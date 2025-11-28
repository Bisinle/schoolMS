<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ReportCommentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
                    // ✅ Skip this seeder if not in local environment
        if (!app()->environment('local')) {
            $this->command->info('ReportCommentSeeder skipped in non-local environment.');
            return;
        }
        //
    }
}
