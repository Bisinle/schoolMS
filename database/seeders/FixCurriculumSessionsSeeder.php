<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Grade;
use App\Models\Subject;
use Illuminate\Support\Facades\DB;

class FixCurriculumSessionsSeeder extends Seeder
{
    /**
     * Correct curriculum structure per level
     */
    private $curriculumStructure = [
        'ECD' => [
            'English' => 5,
            'Mathematics' => 5,
            'Creative Arts' => 6,
            'Environmental Activities' => 5,
            'IRE' => 3, // Islamic Religious Education
        ],
        'LOWER PRIMARY' => [
            'English' => 5,
            'Mathematics' => 5,
            'Creative Arts' => 6,
            'Environmental Activities' => 5,
            'IRE' => 3,
        ],
        'UPPER PRIMARY' => [
            'English' => 5,
            'Kiswahili' => 4,
            'Mathematics' => 5,
            'IRE' => 3,
            'Science & Technology' => 4,
            'Agriculture' => 4,
            'Social Studies' => 3,
            'Creative Arts' => 6,
            'Pastoral Programme' => 1,
        ],
        'JUNIOR SECONDARY' => [
            'English' => 5,
            'Kiswahili' => 4,
            'Mathematics' => 5,
            'IRE' => 4,
            'Social Studies' => 4,
            'Integrated Science' => 5,
            'Pre-Technical Studies' => 4,
            'Agriculture' => 4,
            'Creative Arts & Sports' => 5,
            'Pastoral Programme' => 1,
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🔧 Fixing curriculum subjects and sessions per week...');

        foreach ($this->curriculumStructure as $level => $subjects) {
            $this->fixLevelCurriculum($level, $subjects);
        }

        $this->command->info('✅ Curriculum subjects and sessions fixed successfully!');
    }

    /**
     * Fix curriculum for a specific level
     */
    private function fixLevelCurriculum(string $level, array $subjectSessions): void
    {
        $grades = Grade::where('level', $level)->get();

        if ($grades->isEmpty()) {
            $this->command->warn("⚠️  No grades found for level: {$level}");
            return;
        }

        foreach ($grades as $grade) {
            $this->command->info("  Fixing {$grade->name} ({$level})...");

            // Clear existing subject assignments
            DB::table('grade_subject')->where('grade_id', $grade->id)->delete();

            $totalSessions = 0;

            // Assign correct subjects with correct sessions
            foreach ($subjectSessions as $subjectName => $sessions) {
                $subject = Subject::where('school_id', $grade->school_id)
                    ->where('name', $subjectName)
                    ->first();

                if (!$subject) {
                    $this->command->warn("    ⚠️  Subject '{$subjectName}' not found. Creating it...");
                    $subject = Subject::create([
                        'school_id' => $grade->school_id,
                        'name' => $subjectName,
                        'code' => strtoupper(substr($subjectName, 0, 3)),
                        'category' => $this->getCategory($subjectName),
                        'status' => 'active',
                    ]);
                }

                // Attach subject with correct sessions_per_week
                DB::table('grade_subject')->insert([
                    'grade_id' => $grade->id,
                    'subject_id' => $subject->id,
                    'sessions_per_week' => $sessions,
                    'priority' => $this->getPriority($subjectName),
                    'must_be_daily' => in_array($subjectName, ['English', 'Mathematics']),
                    'can_repeat_same_day' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $totalSessions += $sessions;
                $this->command->info("    ✓ {$subjectName}: {$sessions} sessions/week");
            }

            $this->command->info("    Total: {$totalSessions} sessions/week");
        }
    }

    /**
     * Get priority for a subject (high, neutral, low)
     */
    private function getPriority(string $subjectName): string
    {
        $priorities = [
            'English' => 'high',
            'Mathematics' => 'high',
            'Kiswahili' => 'high',
            'Science & Technology' => 'high',
            'Integrated Science' => 'high',
            'Environmental Activities' => 'neutral',
            'Social Studies' => 'neutral',
            'IRE' => 'neutral',
            'Creative Arts' => 'low',
            'Creative Arts & Sports' => 'low',
            'Agriculture' => 'neutral',
            'Pre-Technical Studies' => 'neutral',
            'Pastoral Programme' => 'low',
        ];

        return $priorities[$subjectName] ?? 'neutral';
    }

    /**
     * Get category for a subject (academic, islamic, arts)
     */
    private function getCategory(string $subjectName): string
    {
        $categories = [
            'IRE' => 'islamic',
            'Pastoral Programme' => 'islamic',
            'Creative Arts' => 'arts',
            'Creative Arts & Sports' => 'arts',
        ];

        return $categories[$subjectName] ?? 'academic';
    }
}

