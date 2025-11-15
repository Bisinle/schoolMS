<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;

class SetupExistingTenants extends Command
{
    protected $signature = 'tenants:setup-existing';
    protected $description = 'Setup existing tenants that were created via API but failed';

    public function handle()
    {
        $this->info('Setting up existing tenants...');

        // Create SAF International
        try {
            $tenant1 = Tenant::create([
                'id' => 'saf-international',
                'data' => [
                    'name' => 'SAF International',
                    'email' => 'admin@saf-international.com'
                ]
            ]);
            $tenant1->domains()->create(['domain' => 'saf-international.school-ms.com']);
            $this->info('✓ Created SAF International tenant');
        } catch (\Exception $e) {
            $this->error('Failed to create SAF International: ' . $e->getMessage());
        }

        // Create Beyruha Academy
        try {
            $tenant2 = Tenant::create([
                'id' => 'beyruha-academy',
                'data' => [
                    'name' => 'Beyruha Academy',
                    'email' => 'admin@beyruha.com'
                ]
            ]);
            $tenant2->domains()->create(['domain' => 'beyruha-academy.school-ms.com']);
            $this->info('✓ Created Beyruha Academy tenant');
        } catch (\Exception $e) {
            $this->error('Failed to create Beyruha Academy: ' . $e->getMessage());
        }

        $this->info('Done! Now run: php artisan tenants:migrate');

        return Command::SUCCESS;
    }
}