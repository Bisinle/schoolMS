<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Stancl\Tenancy\Database\Models\Domain;

class FixDomains extends Command
{
    protected $signature = 'tenants:fix-domains';
    protected $description = 'Fix missing domain records in central database';

    public function handle()
    {
        $this->info('Fixing domain records...');

        try {
            // Check if domains exist first
            $existing = Domain::whereIn('domain', [
                'saf-international.school-ms.com',
                'beyruha-academy.school-ms.com'
            ])->pluck('domain')->toArray();

            // SAF International
            if (!in_array('saf-international.school-ms.com', $existing)) {
                Domain::create([
                    'domain' => 'saf-international.school-ms.com',
                    'tenant_id' => 'saf-international'
                ]);
                $this->info('✓ Created domain for SAF International');
            } else {
                $this->info('→ SAF International domain already exists');
            }

            // Beyruha Academy
            if (!in_array('beyruha-academy.school-ms.com', $existing)) {
                Domain::create([
                    'domain' => 'beyruha-academy.school-ms.com',
                    'tenant_id' => 'beyruha-academy'
                ]);
                $this->info('✓ Created domain for Beyruha Academy');
            } else {
                $this->info('→ Beyruha Academy domain already exists');
            }

            $this->info('Done!');
        } catch (\Exception $e) {
            $this->error('Failed: ' . $e->getMessage());
        }

        return Command::SUCCESS;
    }
}