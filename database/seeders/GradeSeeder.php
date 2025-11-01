<?php

namespace Database\Seeders;

use App\Models\Grade;
use App\Models\Teacher;
use Illuminate\Database\Seeder;

class GradeSeeder extends Seeder
{
    public function run(): void
    {
        $grades = [
            [
                'name' => 'Pre-Primary 1',
                'code' => 'PP1',
                'level' => 'ECD',
                'capacity' => 30,
                'description' => 'First year of early childhood education',
                'status' => 'active',
            ],
            [
                'name' => 'Pre-Primary 2',
                'code' => 'PP2',
                'level' => 'ECD',
                'capacity' => 30,
                'description' => 'Second year of early childhood education',
                'status' => 'active',
            ],
            [
                'name' => 'Grade 1',
                'code' => 'G1',
                'level' => 'LOWER PRIMARY',
                'capacity' => 40,
                'description' => 'First year of lower primary education',
                'status' => 'active',
            ],
            [
                'name' => 'Grade 2',
                'code' => 'G2',
                'level' => 'LOWER PRIMARY',
                'capacity' => 40,
                'description' => 'Second year of lower primary education',
                'status' => 'active',
            ],
            [
                'name' => 'Grade 3',
                'code' => 'G3',
                'level' => 'LOWER PRIMARY',
                'capacity' => 40,
                'description' => 'Third year of lower primary education',
                'status' => 'active',
            ],
            [
                'name' => 'Grade 4',
                'code' => 'G4',
                'level' => 'UPPER PRIMARY',
                'capacity' => 40,
                'description' => 'First year of upper primary education',
                'status' => 'active',
            ],
            [
                'name' => 'Grade 5',
                'code' => 'G5',
                'level' => 'UPPER PRIMARY',
                'capacity' => 40,
                'description' => 'Second year of upper primary education',
                'status' => 'active',
            ],
            [
                'name' => 'Grade 6',
                'code' => 'G6',
                'level' => 'UPPER PRIMARY',
                'capacity' => 40,
                'description' => 'Third year of upper primary education',
                'status' => 'active',
            ],
            [
                'name' => 'Grade 7',
                'code' => 'G7',
                'level' => 'JUNIOR SECONDARY',
                'capacity' => 45,
                'description' => 'First year of junior secondary education',
                'status' => 'active',
            ],
            [
                'name' => 'Grade 8',
                'code' => 'G8',
                'level' => 'JUNIOR SECONDARY',
                'capacity' => 45,
                'description' => 'Second year of junior secondary education',
                'status' => 'active',
            ],
            [
                'name' => 'Grade 9',
                'code' => 'G9',
                'level' => 'JUNIOR SECONDARY',
                'capacity' => 45,
                'description' => 'Third year of junior secondary education',
                'status' => 'active',
            ],
        ];

        foreach ($grades as $gradeData) {
            Grade::create($gradeData);
        }

        // Assign teachers to grades
        $teachers = Teacher::all();
        $allGrades = Grade::all();

        if ($teachers->count() >= 3 && $allGrades->count() >= 6) {
            // Teacher 1 -> Grade 1 (Class Teacher), Grade 2
            $teachers[0]->grades()->attach([
                $allGrades[2]->id => ['is_class_teacher' => true],
                $allGrades[3]->id => ['is_class_teacher' => false],
            ]);

            // Teacher 2 -> Grade 3 (Class Teacher), Grade 4
            $teachers[1]->grades()->attach([
                $allGrades[4]->id => ['is_class_teacher' => true],
                $allGrades[5]->id => ['is_class_teacher' => false],
            ]);

            // Teacher 3 -> PP1 (Class Teacher), PP2
            $teachers[2]->grades()->attach([
                $allGrades[0]->id => ['is_class_teacher' => true],
                $allGrades[1]->id => ['is_class_teacher' => false],
            ]);
        }

        $this->command->info('✅ Grades seeded successfully!');
    }
}