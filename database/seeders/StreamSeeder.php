<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Stream;
use App\Models\School;

class StreamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeds North, South, and East streams for all schools
     */
    public function run(): void
    {
        $schools = School::all();

        $defaultStreams = [
            ['name' => 'North', 'code' => 'N', 'status' => 'active'],
            ['name' => 'South', 'code' => 'S', 'status' => 'active'],
            ['name' => 'East', 'code' => 'E', 'status' => 'active'],
        ];

        foreach ($schools as $school) {
            foreach ($defaultStreams as $streamData) {
                // Check if stream already exists for this school
                $exists = Stream::where('school_id', $school->id)
                    ->where('name', $streamData['name'])
                    ->exists();

                if (!$exists) {
                    Stream::create([
                        'school_id' => $school->id,
                        'name' => $streamData['name'],
                        'code' => $streamData['code'],
                        'status' => $streamData['status'],
                    ]);
                }
            }
        }

        $this->command->info('Default streams (North, South, East) seeded for all schools.');
    }
}
