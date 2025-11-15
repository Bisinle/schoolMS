<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use Stancl\Tenancy\Database\Models\Domain;
use Illuminate\Support\Facades\DB;

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
            // Create tenants WITHOUT triggering events (which try to create databases)
            
            // SAF International
            $existing1 = Tenant::find('saf-international');
            if (!$existing1) {
                DB::table('tenants')->insert([
                    'id' => 'saf-international',
                    'data' => json_encode([
                        'name' => 'SAF International',
                        'email' => 'admin@saf-international.com'
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->info('✓ Created SAF International tenant in central DB');
            } else {
                $this->info('→ SAF International tenant already exists');
            }

            // Create domain for SAF International
            Domain::firstOrCreate(
                ['domain' => 'saf-international.school-ms.com'],
                ['tenant_id' => 'saf-international']
            );
            $this->info('✓ SAF International domain exists');

            // Beyruha Academy
            $existing2 = Tenant::find('beyruha-academy');
            if (!$existing2) {
                DB::table('tenants')->insert([
                    'id' => 'beyruha-academy',
                    'data' => json_encode([
                        'name' => 'Beyruha Academy',
                        'email' => 'admin@beyruha.com'
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->info('✓ Created Beyruha Academy tenant in central DB');
            } else {
                $this->info('→ Beyruha Academy tenant already exists');
            }

            // Create domain for Beyruha Academy
            Domain::firstOrCreate(
                ['domain' => 'beyruha-academy.school-ms.com'],
                ['tenant_id' => 'beyruha-academy']
            );
            $this->info('✓ Beyruha Academy domain exists');

            $this->info('');
            $this->info('All done! Now visit the tenant subdomains to test.');
            
        } catch (\Exception $e) {
            $this->error('Failed: ' . $e->getMessage());
        }

        return Command::SUCCESS;
    }
}