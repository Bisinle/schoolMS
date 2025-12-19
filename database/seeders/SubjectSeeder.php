<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Grade;
use App\Models\School;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        // Get all schools to create subjects for each
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        $subjectsData = [
            // Academic Subjects
            ['name' => 'Mathematics', 'code' => 'MATH', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'English', 'code' => 'ENG', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Creative Arts', 'code' => 'ART', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Enviromental Activities', 'code' => 'PE', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Islamic Religion Education', 'code' => 'IRE', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'SS
            cience & Technology', 'code' => 'SCI', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Kiswahili', 'code' => 'KIS', 'category' => 'academic', 'status' => 'active'],
            ['name' => 'Social Studies', 'code' => 'SST', 'category' => 'academic', 'status' => 'active'],
            // Islamic Subjects
            ['name' => 'القرآن', 'code' => 'QUR', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'أحكام التجويد', 'code' => 'TAJWID', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'تحفة المريد', 'code' => 'TUHFAT_M', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'تحفة الأطفال', 'code' => 'TUHFAT_A', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'الجزريّة', 'code' => 'JAZARIYA', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'التفسير', 'code' => 'TAFSIR', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'عمدة الأحكام', 'code' => 'UMDAH', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'سفينة النجاة – فقه ١', 'code' => 'SAFIINA', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'العقيدة', 'code' => 'AQIDA', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'خذ عقيدتك', 'code' => 'KHUD_AQID', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'الأصول الثلاثة مع القواعد الأربع', 'code' => 'USUL_QAWAID', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'الأذكار', 'code' => 'ADHKAR', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'الأربعون النووية', 'code' => 'ARBAEEN', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'السيرة', 'code' => 'SEERAH', 'category' => 'islamic', 'status' => 'active'],
            ['name' => 'القراءة والكتابة', 'code' => 'QIRAHA_KITABAH', 'category' => 'islamic', 'status' => 'active'],
        ];

        // Create subjects for each school
        foreach ($schools as $school) {
            $createdSubjects = [];
            foreach ($subjectsData as $subjectData) {
                $createdSubjects[] = Subject::create(array_merge($subjectData, ['school_id' => $school->id]));
            }

            // Assign all subjects to all grades for this school
            $schoolGrades = Grade::where('school_id', $school->id)->get();
            foreach ($schoolGrades as $grade) {
                $grade->subjects()->attach(collect($createdSubjects)->pluck('id'));
            }
        }

        $this->command->info('✅ Subjects seeded successfully for all schools!');
    }
}
