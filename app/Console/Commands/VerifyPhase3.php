<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Grade;
use App\Models\TimetableTemplate;
use App\Models\AcademicTerm;
use App\Services\TimetableGenerationService;
use App\Services\BlueprintPeriodGenerationService;

class VerifyPhase3 extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'verify:phase3';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify Phase 3 auto-generation implementation';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== PHASE 3 VERIFICATION ===');
        $this->newLine();

        // Step 1: Find a grade with class teacher
        $this->info('Step 1: Finding grade with class teacher...');
        $grade = Grade::whereHas('teachers', function($q) {
            $q->where('grade_teacher.is_class_teacher', true);
        })->with(['teachers', 'subjects'])->first();

        if (!$grade) {
            $this->error('❌ No grade found with class teacher. Please create one first.');
            return 1;
        }

        $this->info("✅ Found grade: {$grade->name} (Level: {$grade->level})");

        $classTeacher = $grade->getClassTeacher();
        $this->info("✅ Class teacher: {$classTeacher->user->name}");

        // Step 2: Check subjects
        $this->newLine();
        $this->info('Step 2: Checking subjects...');
        $subjects = $grade->subjects;
        if ($subjects->isEmpty()) {
            $this->error('❌ Grade has no subjects assigned.');
            return 1;
        }
        $this->info("✅ Grade has {$subjects->count()} subjects");

        // Step 3: Check blueprint
        $this->newLine();
        $this->info('Step 3: Checking blueprint...');
        $blueprint = $grade->activeBlueprint();
        if (!$blueprint) {
            $this->error("❌ No active blueprint found for level: {$grade->level}");
            return 1;
        }
        $this->info("✅ Active blueprint: {$blueprint->name}");
        $this->info("   Periods: {$blueprint->periods->count()}");

        // Step 4: Check periods generated from blueprint
        $this->newLine();
        $this->info('Step 4: Checking generated periods...');
        $periods = \App\Models\TimetablePeriod::where('school_id', $grade->school_id)
            ->where('grade_level', $grade->level)
            ->whereNotNull('generated_from_blueprint_id')
            ->get();

        if ($periods->isEmpty()) {
            $this->warn('⚠️  No periods generated from blueprint. Generating now...');
            $periodService = new BlueprintPeriodGenerationService();
            try {
                $stats = $periodService->generatePeriods($blueprint);
                $this->info("✅ Generated {$stats['created']} periods from blueprint");

                // Reload periods
                $periods = \App\Models\TimetablePeriod::where('school_id', $grade->school_id)
                    ->where('grade_level', $grade->level)
                    ->whereNotNull('generated_from_blueprint_id')
                    ->get();
            } catch (\Exception $e) {
                $this->error("❌ Failed to generate periods: {$e->getMessage()}");
                return 1;
            }
        } else {
            $this->info("✅ Found {$periods->count()} generated periods");
        }

        // Step 5: Validation check
        $this->newLine();
        $this->info('Step 5: Running validation...');
        $validation = $grade->canGenerateTimetable();
        if (!$validation['can_generate']) {
            $this->error('❌ Validation failed:');
            foreach ($validation['errors'] as $error) {
                $this->error("   - $error");
            }
            return 1;
        }
        $this->info('✅ Validation passed');

        // Step 6: Find or create template
        $this->newLine();
        $this->info('Step 6: Finding/creating template...');
        $academicTerm = AcademicTerm::where('school_id', $grade->school_id)
            ->where('is_active', true)
            ->first();

        if (!$academicTerm) {
            // Try to find any term
            $academicTerm = AcademicTerm::where('school_id', $grade->school_id)->first();

            if (!$academicTerm) {
                $this->error('❌ No academic term found. Please create one first.');
                return 1;
            }

            $this->warn("⚠️  Using inactive term: {$academicTerm->name}");
        } else {
            $this->info("✅ Using active term: {$academicTerm->name}");
        }

        $template = TimetableTemplate::where('grade_id', $grade->id)
            ->where('academic_term_id', $academicTerm->id)
            ->where('status', 'draft')
            ->first();

        if (!$template) {
            $template = TimetableTemplate::create([
                'school_id' => $grade->school_id,
                'grade_id' => $grade->id,
                'academic_term_id' => $academicTerm->id,
                'name' => "Phase 3 Test - {$grade->name}",
                'status' => 'draft',
                'effective_from' => now(),
            ]);
            $this->info("✅ Created new template: {$template->name}");
        } else {
            $this->info("✅ Using existing template: {$template->name}");
        }

        // Step 7: Generate timetable
        $this->newLine();
        $this->info('Step 7: Generating timetable...');
        try {
            $service = new TimetableGenerationService();
            $result = $service->generate($template);

            $this->info('✅ Generation successful!');
            $this->info("   Total slots: {$result['generated']}");
            $this->info("   Lesson slots: {$result['lessons']}");
            $this->info("   Break slots: {$result['breaks']}");
        } catch (\Exception $e) {
            $this->error("❌ Generation failed: {$e->getMessage()}");
            return 1;
        }

        // Step 8: Verify lesson slots have class teacher
        $this->newLine();
        $this->info('Step 8: Verifying teacher assignments...');
        $lessonSlots = $template->slots()->where('is_teachable', true)->get();
        $slotsWithTeacher = $lessonSlots->where('teacher_id', $classTeacher->id)->count();
        $slotsWithAutoFlag = $lessonSlots->where('auto_assigned_teacher', true)->count();

        $this->info("   Lesson slots: {$lessonSlots->count()}");
        $this->info("   Slots with class teacher: {$slotsWithTeacher}");
        $this->info("   Slots with auto_assigned_teacher flag: {$slotsWithAutoFlag}");

        if ($slotsWithTeacher === $lessonSlots->count()) {
            $this->info('✅ All lesson slots have class teacher assigned');
        } else {
            $this->error('❌ Not all lesson slots have class teacher assigned');
        }

        if ($slotsWithAutoFlag === $lessonSlots->count()) {
            $this->info('✅ All lesson slots have auto_assigned_teacher flag set');
        } else {
            $this->error('❌ Not all lesson slots have auto_assigned_teacher flag set');
        }

        // Step 9: Verify break slots have no teacher
        $this->newLine();
        $this->info('Step 9: Verifying break slots...');
        $breakSlots = $template->slots()->where('is_teachable', false)->get();
        $breakSlotsWithTeacher = $breakSlots->whereNotNull('teacher_id')->count();

        $this->info("   Break slots: {$breakSlots->count()}");
        $this->info("   Break slots with teacher: {$breakSlotsWithTeacher}");

        if ($breakSlotsWithTeacher === 0) {
            $this->info('✅ No break slots have teachers assigned');
        } else {
            $this->error('❌ Some break slots have teachers assigned');
        }

        $this->newLine();
        $this->info('=== VERIFICATION COMPLETE ===');
        $this->newLine();
        $this->info('Summary:');
        $this->info("✅ Grade: {$grade->name}");
        $this->info("✅ Class Teacher: {$classTeacher->user->name}");
        $this->info("✅ Template: {$template->name}");
        $this->info("✅ Total Slots: {$result['generated']}");
        $this->info("✅ Lesson Slots with Class Teacher: {$slotsWithTeacher}/{$lessonSlots->count()}");
        $this->info("✅ Auto-assigned Flag Set: {$slotsWithAutoFlag}/{$lessonSlots->count()}");
        $this->newLine();

        return 0;
    }
}
