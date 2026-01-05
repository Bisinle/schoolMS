<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Room;
use App\Models\Grade;
use App\Models\School;

class RoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates rooms for each grade plus specialized labs
     */
    public function run(): void
    {
        $this->command->info('🏫 Seeding Rooms...');

        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        $totalCreated = 0;

        foreach ($schools as $school) {
            // Get all grades for this school
            $grades = Grade::where('school_id', $school->id)->orderBy('name')->get();

            if ($grades->isEmpty()) {
                $this->command->warn("  ⚠️  {$school->name}: No grades found, skipping...");
                continue;
            }

            $roomCount = 0;

            // Create one classroom per grade
            foreach ($grades as $index => $grade) {
                $roomNumber = 100 + $index + 1; // 101, 102, 103, etc.

                $exists = Room::where('school_id', $school->id)
                    ->where('code', "R{$roomNumber}")
                    ->exists();

                if (!$exists) {
                    Room::create([
                        'school_id' => $school->id,
                        'name' => "{$grade->name} Classroom",
                        'code' => "R{$roomNumber}",
                        'room_type' => 'classroom',
                        'capacity' => $this->getClassroomCapacity($grade->level),
                        'building' => 'Main Building',
                        'floor' => $this->getFloor($index),
                        'facilities' => ['whiteboard', 'projector', 'desks', 'chairs', 'notice_board'],
                        'status' => 'available',
                        'is_active' => true,
                        'notes' => "Default classroom for {$grade->name}",
                    ]);

                    $roomCount++;
                    $totalCreated++;
                }
            }

            // Create Computer Lab
            $exists = Room::where('school_id', $school->id)
                ->where('code', 'COMP-LAB')
                ->exists();

            if (!$exists) {
                Room::create([
                    'school_id' => $school->id,
                    'name' => 'Computer Laboratory',
                    'code' => 'COMP-LAB',
                    'room_type' => 'computer_lab',
                    'capacity' => 40,
                    'building' => 'Main Building',
                    'floor' => 'Ground Floor',
                    'facilities' => ['computers', 'projector', 'air_conditioning', 'internet', 'printer', 'whiteboard'],
                    'status' => 'available',
                    'is_active' => true,
                    'notes' => 'Computer lab with 40 workstations for ICT lessons',
                ]);

                $roomCount++;
                $totalCreated++;
            }

            // Create Chemistry Lab
            $exists = Room::where('school_id', $school->id)
                ->where('code', 'CHEM-LAB')
                ->exists();

            if (!$exists) {
                Room::create([
                    'school_id' => $school->id,
                    'name' => 'Chemistry Laboratory',
                    'code' => 'CHEM-LAB',
                    'room_type' => 'laboratory',
                    'capacity' => 35,
                    'building' => 'Science Block',
                    'floor' => 'First Floor',
                    'facilities' => ['lab_benches', 'fume_hood', 'gas_supply', 'water_supply', 'safety_equipment', 'chemical_storage', 'fire_extinguisher'],
                    'status' => 'available',
                    'is_active' => true,
                    'notes' => 'Fully equipped chemistry laboratory for practical experiments',
                ]);

                $roomCount++;
                $totalCreated++;
            }

            // Create Physics Lab
            $exists = Room::where('school_id', $school->id)
                ->where('code', 'PHYS-LAB')
                ->exists();

            if (!$exists) {
                Room::create([
                    'school_id' => $school->id,
                    'name' => 'Physics Laboratory',
                    'code' => 'PHYS-LAB',
                    'room_type' => 'laboratory',
                    'capacity' => 35,
                    'building' => 'Science Block',
                    'floor' => 'Ground Floor',
                    'facilities' => ['lab_benches', 'power_supply', 'measuring_instruments', 'demonstration_area', 'storage_cabinets', 'safety_equipment'],
                    'status' => 'available',
                    'is_active' => true,
                    'notes' => 'Physics laboratory with equipment for mechanics, electricity, and optics experiments',
                ]);

                $roomCount++;
                $totalCreated++;
            }

            if ($roomCount > 0) {
                $this->command->info("  ✅ {$school->name}: {$roomCount} rooms created");
            } else {
                $this->command->warn("  ⚠️  {$school->name}: Rooms already exist");
            }
        }

        $this->command->info("✅ {$totalCreated} rooms seeded successfully!");
    }

    /**
     * Get classroom capacity based on grade level
     */
    private function getClassroomCapacity(string $level): int
    {
        return match($level) {
            'ECD' => 25,
            'LOWER PRIMARY' => 35,
            'UPPER PRIMARY' => 40,
            'JUNIOR SECONDARY' => 40,
            default => 35,
        };
    }

    /**
     * Get floor based on index
     */
    private function getFloor(int $index): string
    {
        if ($index < 4) {
            return 'Ground Floor';
        } elseif ($index < 8) {
            return 'First Floor';
        } else {
            return 'Second Floor';
        }
    }
}
