<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TransportRoute;
use App\Models\School;

class TransportRouteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all schools
        $schools = School::all();

        // Sample transport routes with realistic Nairobi pricing
        $routes = [
            [
                'route_name' => 'Eastleigh',
                'amount_two_way' => 12000.00,
                'amount_one_way' => 7000.00,
                'description' => 'Eastleigh area - Pickup points: 1st Avenue, 7th Street, General Waruinge',
            ],
            [
                'route_name' => 'South C',
                'amount_two_way' => 15000.00,
                'amount_one_way' => 8500.00,
                'description' => 'South C and surrounding areas - Pickup points: Mugoya, Bellevue, Popo Road',
            ],
            [
                'route_name' => 'Ngara',
                'amount_two_way' => 10000.00,
                'amount_one_way' => 6000.00,
                'description' => 'Ngara and Pangani areas - Pickup points: Ngara Market, Pangani Roundabout',
            ],
            [
                'route_name' => 'Parklands',
                'amount_two_way' => 13000.00,
                'amount_one_way' => 7500.00,
                'description' => 'Parklands and Westlands - Pickup points: Parklands Road, 3rd Parklands',
            ],
            [
                'route_name' => 'Umoja',
                'amount_two_way' => 11000.00,
                'amount_one_way' => 6500.00,
                'description' => 'Umoja and Donholm areas - Pickup points: Umoja 1, Umoja 2, Donholm Phase 8',
            ],
        ];

        foreach ($schools as $school) {
            foreach ($routes as $route) {
                TransportRoute::create([
                    'school_id' => $school->id,
                    ...$route,
                    'is_active' => true,
                ]);
            }
        }

        $this->command->info('Transport routes seeded successfully!');
    }
}

