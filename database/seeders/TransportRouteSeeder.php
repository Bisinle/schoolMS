<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TransportRoute;
use App\Models\School;

class TransportRouteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates transport routes for Nairobi areas
     */
    public function run(): void
    {
        $this->command->info('🚌 Seeding Transport Routes...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        // Transport routes with realistic Nairobi pricing
        $routes = [
            [
                'route_name' => 'South C',
                'amount_two_way' => 15000.00,
                'amount_one_way' => 8500.00,
                'description' => 'South C and surrounding areas - Pickup points: Mugoya Estate, Bellevue, Popo Road, Akila Road',
                'is_active' => true,
            ],
            [
                'route_name' => 'South B',
                'amount_two_way' => 14000.00,
                'amount_one_way' => 8000.00,
                'description' => 'South B area - Pickup points: Mombasa Road, Mukenia Road, Makadara, Jogoo Road Junction',
                'is_active' => true,
            ],
            [
                'route_name' => 'Eastleigh',
                'amount_two_way' => 12000.00,
                'amount_one_way' => 7000.00,
                'description' => 'Eastleigh area - Pickup points: 1st Avenue, 7th Street, General Waruinge, Eastleigh Section 1, 2, 3',
                'is_active' => true,
            ],
            [
                'route_name' => 'Nairobi West',
                'amount_two_way' => 13000.00,
                'amount_one_way' => 7500.00,
                'description' => 'Nairobi West area - Pickup points: Madaraka Estate, Nyayo Stadium, Ole Sangale Road, Langata Road',
                'is_active' => true,
            ],
            // Additional routes for variety
            [
                'route_name' => 'Ngara',
                'amount_two_way' => 10000.00,
                'amount_one_way' => 6000.00,
                'description' => 'Ngara and Pangani areas - Pickup points: Ngara Market, Pangani Roundabout, Racecourse Road',
                'is_active' => true,
            ],
            [
                'route_name' => 'Parklands',
                'amount_two_way' => 13000.00,
                'amount_one_way' => 7500.00,
                'description' => 'Parklands and Westlands - Pickup points: Parklands Road, 3rd Parklands Avenue, Limuru Road',
                'is_active' => true,
            ],
            [
                'route_name' => 'Umoja',
                'amount_two_way' => 11000.00,
                'amount_one_way' => 6500.00,
                'description' => 'Umoja and Donholm areas - Pickup points: Umoja 1, Umoja 2, Donholm Phase 8, Savannah',
                'is_active' => true,
            ],
            [
                'route_name' => 'Embakasi',
                'amount_two_way' => 12000.00,
                'amount_one_way' => 7000.00,
                'description' => 'Embakasi area - Pickup points: Pipeline, Tassia, Fedha, Nyayo Estate Embakasi',
                'is_active' => true,
            ],
            [
                'route_name' => 'Kasarani',
                'amount_two_way' => 14000.00,
                'amount_one_way' => 8000.00,
                'description' => 'Kasarani area - Pickup points: Mwiki, Kasarani Stadium, Hunters, Seasons',
                'is_active' => true,
            ],
            [
                'route_name' => 'Kahawa',
                'amount_two_way' => 15000.00,
                'amount_one_way' => 8500.00,
                'description' => 'Kahawa area - Pickup points: Kahawa West, Kahawa Sukari, Githurai 44, Zimmerman',
                'is_active' => true,
            ],
        ];

        $totalCreated = 0;

        foreach ($schools as $school) {
            $routeCount = 0;

            foreach ($routes as $route) {
                // Check if route already exists
                $exists = TransportRoute::where('school_id', $school->id)
                    ->where('route_name', $route['route_name'])
                    ->exists();

                if (!$exists) {
                    TransportRoute::create(array_merge($route, [
                        'school_id' => $school->id,
                    ]));
                    $routeCount++;
                    $totalCreated++;
                }
            }

            if ($routeCount > 0) {
                $this->command->info("  ✅ {$school->name}: {$routeCount} transport routes created");
            } else {
                $this->command->warn("  ⚠️  {$school->name}: Transport routes already exist");
            }
        }

        $this->command->info("✅ {$totalCreated} transport routes seeded successfully!");
    }
}
