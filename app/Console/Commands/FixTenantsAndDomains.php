<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use Stancl\Tenancy\Database\Models\Domain;

class FixTenantsAndDomains extends Command
{
    protected $signature = 'tenants:fix-all';
    protected $description = 'Fix missing tenant and domain records in central database';

    public function handle()
    {
        $this->info('Fixing tenant and domain records in CENTRAL database...');

        // CRITICAL: Make sure we're NOT in tenant context
        if (tenancy()->initialized) {
            tenancy()->end();
        }

        try {
            // Create SAF International tenant in CENTRAL database
            $tenant1 = Tenant::firstOrCreate(
                ['id' => 'saf-international'],
                [
                    'data' => [
                        'name' => 'SAF International',
                        'email' => 'admin@saf-international.com'
                    ]
                ]
            );
            $this->info('✓ SAF International tenant exists in central DB');

            // Create domain for SAF International
            Domain::firstOrCreate(
                ['domain' => 'saf-international.school-ms.com'],
                ['tenant_id' => 'saf-international']
            );
            $this->info('✓ SAF International domain exists');

            // Create Beyruha Academy tenant in CENTRAL database
            $tenant2 = Tenant::firstOrCreate(
                ['id' => 'beyruha-academy'],
                [
                    'data' => [
                        'name' => 'Beyruha Academy',
                        'email' => 'admin@beyruha.com'
                    ]
                ]
            );
            $this->info('✓ Beyruha Academy tenant exists in central DB');

            // Create domain for Beyruha Academy
            Domain::firstOrCreate(
                ['domain' => 'beyruha-academy.school-ms.com'],
                ['tenant_id' => 'beyruha-academy']
            );
            $this->info('✓ Beyruha Academy domain exists');

            $this->info('');
            $this->info('All done! Tenants and domains are now in the central database.');
            
        } catch (\Exception $e) {
            $this->error('Failed: ' . $e->getMessage());
            $this->error('Trace: ' . $e->getTraceAsString());
        }

        return Command::SUCCESS;
    }
}