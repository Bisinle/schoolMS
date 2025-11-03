<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Grade;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        $subjects = [
            // Academic Subjects
            ['name' => 'Mathematics', 'code' => 'MATH', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'English', 'code' => 'ENG', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Creative Arts', 'code' => 'ART', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Enviromental Activities', 'code' => 'PE', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Islamic Religion Education', 'code' => 'IRE', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Science & Technology', 'code' => 'SCI', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Kiswahili', 'code' => 'KIS', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Social Studies', 'code' => 'SST', 'category' => 'academic', 'status' => 'active'],
            // Islamic Subjects
            ['name' => 'القرءان الكريم', 'code' => 'QUR', 'category' => 'islamic', 'status' => 'active'],
            ['name' => ' القراءة والكتابة ', 'code' => 'Kitabah', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'الاذكار', 'code' => 'Azkar', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'الحديث', 'code' => 'HAD', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'العقيدة', 'code' => 'AQIDA', 'category' => 'islamic', 'status' => 'active'],
        ];

        $createdSubjects = [];
        foreach ($subjects as $subjectData) {
            $createdSubjects[] = Subject::create($subjectData);
        }

        // Assign all subjects to all grades
        $grades = Grade::all();
        foreach ($grades as $grade) {
            $grade->subjects()->attach(collect($createdSubjects)->pluck('id'));
        }

        $this->command->info('✅ Subjects seeded successfully!');
    }
}
