<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\Room;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $schools = School::all();

        foreach ($schools as $school) {
            // Create regular classrooms
            for ($i = 1; $i <= 15; $i++) {
                Room::create([
                    'school_id' => $school->id,
                    'name' => "Classroom {$i}",
                    'code' => "CLS-{$i}",
                    'room_type' => 'classroom',
                    'capacity' => 40,
                    'building' => 'Main Building',
                    'floor' => $i <= 5 ? 'Ground Floor' : ($i <= 10 ? '1st Floor' : '2nd Floor'),
                    'facilities' => ['whiteboard', 'projector', 'air_conditioning'],
                    'status' => 'available',
                    'is_active' => true,
                ]);
            }

            // Create science labs
            Room::create([
                'school_id' => $school->id,
                'name' => 'Chemistry Lab',
                'code' => 'LAB-CHEM',
                'room_type' => 'laboratory',
                'capacity' => 30,
                'building' => 'Science Block',
                'floor' => '1st Floor',
                'facilities' => ['lab_equipment', 'safety_gear', 'projector', 'fume_hood'],
                'status' => 'available',
                'is_active' => true,
            ]);

            Room::create([
                'school_id' => $school->id,
                'name' => 'Physics Lab',
                'code' => 'LAB-PHY',
                'room_type' => 'laboratory',
                'capacity' => 30,
                'building' => 'Science Block',
                'floor' => '1st Floor',
                'facilities' => ['lab_equipment', 'projector', 'experiment_tables'],
                'status' => 'available',
                'is_active' => true,
            ]);

            Room::create([
                'school_id' => $school->id,
                'name' => 'Computer Lab',
                'code' => 'LAB-COMP',
                'room_type' => 'computer_lab',
                'capacity' => 35,
                'building' => 'Main Building',
                'floor' => '2nd Floor',
                'facilities' => ['computers', 'projector', 'internet', 'air_conditioning'],
                'status' => 'available',
                'is_active' => true,
            ]);

            // Create library
            Room::create([
                'school_id' => $school->id,
                'name' => 'School Library',
                'code' => 'LIB',
                'room_type' => 'library',
                'capacity' => 50,
                'building' => 'Main Building',
                'floor' => 'Ground Floor',
                'facilities' => ['books', 'computers', 'study_tables', 'wifi'],
                'status' => 'available',
                'is_active' => true,
            ]);

            // Create assembly hall
            Room::create([
                'school_id' => $school->id,
                'name' => 'Assembly Hall',
                'code' => 'HALL',
                'room_type' => 'auditorium',
                'capacity' => 200,
                'building' => 'Main Building',
                'floor' => 'Ground Floor',
                'facilities' => ['sound_system', 'stage', 'projector', 'microphones'],
                'status' => 'available',
                'is_active' => true,
            ]);
        }
    }
}
