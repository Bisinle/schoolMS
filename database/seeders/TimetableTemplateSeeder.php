<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Grade;
use App\Models\TimetableTemplate;
use App\Models\TimetablePeriod;
use App\Models\TimetableSlot;
use App\Models\Teacher;
use App\Models\AcademicTerm;

class TimetableTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates timetable templates and slots for all grades with valid levels
     */
    public function run(): void
    {
        $this->command->info('🔄 Starting Timetable Template & Slot Seeding...');

        // Automatically delete existing templates and slots (no prompt)
        $this->command->info('🗑️  Deleting existing templates and slots...');

        // Delete in correct order to respect foreign key constraints
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('timetable_conflicts')->truncate();
        DB::table('timetable_slots')->truncate();
        DB::table('timetable_templates')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('✓ Deleted all existing templates and slots');

        // Get all grades with valid levels
        $grades = Grade::whereIn('level', ['ECD', 'LOWER PRIMARY', 'UPPER PRIMARY', 'JUNIOR SECONDARY'])
            ->with(['subjects', 'teachers', 'defaultRoom'])
            ->get();

        $this->command->info("📚 Found {$grades->count()} grades to process");

        $templateCount = 0;
        $slotCount = 0;

        foreach ($grades as $grade) {
            $this->command->info("\n--- Processing: {$grade->name} ({$grade->level}) ---");

            // Skip if grade has no subjects
            if ($grade->subjects->count() === 0) {
                $this->command->warn("  ⚠️  Skipping - No subjects assigned");
                continue;
            }

            // Get or create academic term
            $academicTerm = AcademicTerm::where('school_id', $grade->school_id)
                ->where('is_active', true)
                ->first();

            if (!$academicTerm) {
                // Get the most recent term
                $academicTerm = AcademicTerm::where('school_id', $grade->school_id)
                    ->orderBy('start_date', 'desc')
                    ->first();
            }

            if (!$academicTerm) {
                $this->command->warn("  ⚠️  No academic term found - skipping");
                continue;
            }

            // Create timetable template for this grade
            $template = TimetableTemplate::create([
                'school_id' => $grade->school_id,
                'grade_id' => $grade->id,
                'academic_term_id' => $academicTerm->id,
                'name' => "{$grade->name} - {$academicTerm->name} Timetable",
                'description' => "Timetable for {$grade->name} for {$academicTerm->name}",
                'status' => 'published',
                'is_active' => true,
                'active_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                'school_start_time' => '07:30',
                'school_end_time' => '16:35',
            ]);

            $templateCount++;
            $this->command->info("  ✓ Created template: {$template->name}");

            // Get periods for this grade level
            $periods = TimetablePeriod::where('school_id', $grade->school_id)
                ->where('grade_level', $grade->level)
                ->where('is_active', true)
                ->orderBy('order')
                ->get();

            if ($periods->count() === 0) {
                $this->command->warn("  ⚠️  No periods found for {$grade->level}");
                continue;
            }

            $this->command->info("  📅 Found {$periods->count()} periods");

            // Get class teacher
            $classTeacher = $grade->teachers()->wherePivot('is_class_teacher', true)->first();

            // Get all teachers as fallback
            $allTeachers = Teacher::where('school_id', $grade->school_id)
                ->where('status', 'active')
                ->get();

            // Skip if no teachers available
            if ($allTeachers->count() === 0) {
                $this->command->warn("  ⚠️  No teachers available - skipping");
                continue;
            }

            // Get grade's subjects (excluding 'Break')
            $gradeSubjects = $grade->subjects()
                ->where('name', '!=', 'Break')
                ->where('status', 'active')
                ->get();

            $this->command->info("  📖 Found {$gradeSubjects->count()} subjects");

            // Create slots for each day of the week
            $daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

            foreach ($daysOfWeek as $day) {
                $subjectIndex = 0;

                foreach ($periods as $period) {
                    $slotData = [
                        'school_id' => $grade->school_id,
                        'timetable_template_id' => $template->id,
                        'timetable_period_id' => $period->id,
                        'day_of_week' => $day,
                        'slot_type' => $period->period_type,
                    ];

                    // For lesson slots, assign subject, teacher, and room
                    if ($period->period_type === 'lesson' && $gradeSubjects->count() > 0) {
                        // Rotate through subjects
                        $subject = $gradeSubjects[$subjectIndex % $gradeSubjects->count()];
                        $slotData['subject_id'] = $subject->id;

                        // Assign class teacher if available, otherwise random teacher
                        $slotData['teacher_id'] = $classTeacher ? $classTeacher->id : $allTeachers->random()->id;

                        // Assign default room if available
                        if ($grade->default_room_id) {
                            $slotData['room_id'] = $grade->default_room_id;
                        }

                        $subjectIndex++;
                    }

                    TimetableSlot::create($slotData);
                    $slotCount++;
                }
            }

            $slotsCreated = count($daysOfWeek) * $periods->count();
            $this->command->info("  ✓ Created {$slotsCreated} slots for the week");
        }

        $this->command->info("\n✅ Seeding Complete!");
        $this->command->info("📊 Summary:");
        $this->command->info("   - Templates created: {$templateCount}");
        $this->command->info("   - Total slots created: {$slotCount}");
    }
}

