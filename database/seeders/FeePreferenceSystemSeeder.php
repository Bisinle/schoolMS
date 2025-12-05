<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FeePreferenceSystemSeeder extends Seeder
{
    /**
     * Seed the fee preference system.
     * 
     * This seeder runs all the seeders needed for the new fee preference system:
     * - Transport routes
     * - Tuition fees (per grade)
     * - Universal fees (food, sports, etc.)
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting Fee Preference System Seeding...');
        $this->command->newLine();

        // Seed transport routes
        $this->command->info('📍 Seeding transport routes...');
        $this->call(TransportRouteSeeder::class);
        $this->command->newLine();

        // Seed tuition fees
        $this->command->info('📚 Seeding tuition fees...');
        $this->call(TuitionFeeSeeder::class);
        $this->command->newLine();

        // Seed universal fees
        $this->command->info('🎯 Seeding universal fees...');
        $this->call(UniversalFeeSeeder::class);
        $this->command->newLine();

        $this->command->info('✅ Fee Preference System seeded successfully!');
        $this->command->newLine();
        
        $this->command->info('📋 Summary:');
        $this->command->info('   - Transport routes created with one-way and two-way pricing');
        $this->command->info('   - Tuition fees created for all grades with full-day and half-day options');
        $this->command->info('   - Universal fees created (Food, Sports, Library, Technology)');
        $this->command->newLine();
        
        $this->command->info('🎯 Next Steps:');
        $this->command->info('   1. Review the seeded data in the database');
        $this->command->info('   2. Adjust amounts as needed for your school');
        $this->command->info('   3. Create guardian fee preferences for students');
        $this->command->info('   4. Generate invoices using the new preference system');
    }
}

