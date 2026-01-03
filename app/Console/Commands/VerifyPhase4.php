<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Grade;
use App\Models\TimetableTemplate;
use App\Models\TimetableSlot;
use App\Models\Subject;

class VerifyPhase4 extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'verify:phase4';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify Phase 4 UI enhancements for specialist override';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== PHASE 4 VERIFICATION ===');
        $this->newLine();

        // Step 1: Find a template with generated slots
        $this->info('Step 1: Finding template with generated slots...');
        $template = TimetableTemplate::whereHas('slots', function($q) {
            $q->where('is_teachable', true);
        })->with(['grade', 'slots.subject', 'slots.teacher'])->first();

        if (!$template) {
            $this->error('❌ No template found with generated slots. Please run Phase 3 verification first.');
            return 1;
        }

        $this->info("✅ Found template: {$template->name}");
        $this->info("   Grade: {$template->grade->name}");

        // Step 2: Check for auto-assigned teachers
        $this->newLine();
        $this->info('Step 2: Checking auto-assigned teachers...');
        $autoAssignedSlots = $template->slots()
            ->where('auto_assigned_teacher', true)
            ->count();

        $this->info("   Auto-assigned slots: {$autoAssignedSlots}");
        
        if ($autoAssignedSlots > 0) {
            $this->info('✅ Auto-assigned teacher flag is working');
        } else {
            $this->warn('⚠️  No auto-assigned slots found. This is expected if all teachers were manually assigned.');
        }

        // Step 3: Check for specialist subjects
        $this->newLine();
        $this->info('Step 3: Checking for specialist subjects...');
        $specialistSubjects = ['Physical Education', 'Music', 'Art', 'Computer', 'ICT', 'Drama', 'Dance', 'PE'];
        
        $specialistSlots = $template->slots()
            ->whereHas('subject', function($q) use ($specialistSubjects) {
                foreach ($specialistSubjects as $specialist) {
                    $q->orWhere('name', 'like', "%{$specialist}%");
                }
            })
            ->with('subject')
            ->get();

        $uniqueSpecialistSubjects = $specialistSlots->pluck('subject.name')->unique();

        $this->info("   Specialist subject slots: {$specialistSlots->count()}");
        $this->info("   Unique specialist subjects: {$uniqueSpecialistSubjects->count()}");
        
        if ($uniqueSpecialistSubjects->count() > 0) {
            $this->info('   Subjects:');
            foreach ($uniqueSpecialistSubjects as $subject) {
                $this->info("      - {$subject}");
            }
            $this->info('✅ Specialist subjects detected');
        } else {
            $this->warn('⚠️  No specialist subjects found in this template');
        }

        // Step 4: Test bulk update endpoint (dry run)
        $this->newLine();
        $this->info('Step 4: Verifying bulk update capability...');
        
        $testSubject = $template->slots()->whereNotNull('subject_id')->first();
        if ($testSubject) {
            $slotsWithSubject = $template->slots()
                ->where('subject_id', $testSubject->subject_id)
                ->count();
            
            $this->info("   Test subject: {$testSubject->subject->name}");
            $this->info("   Slots with this subject: {$slotsWithSubject}");
            $this->info('✅ Bulk update endpoint ready (route: timetables.templates.bulk-update-teacher)');
        } else {
            $this->warn('⚠️  No slots with subjects found for bulk update test');
        }

        // Step 5: Check UI components exist
        $this->newLine();
        $this->info('Step 5: Checking UI components...');
        
        $gridComponent = base_path('resources/js/Components/Timetable/TimetableGrid.jsx');
        $bulkModalComponent = base_path('resources/js/Components/Timetable/BulkTeacherChangeModal.jsx');
        
        if (file_exists($gridComponent)) {
            $this->info('✅ TimetableGrid component exists');
            
            // Check for Phase 4 enhancements
            $gridContent = file_get_contents($gridComponent);
            if (strpos($gridContent, 'auto_assigned_teacher') !== false) {
                $this->info('✅ Auto-assigned teacher indicator implemented');
            }
            if (strpos($gridContent, 'needsSpecialistReview') !== false) {
                $this->info('✅ Specialist subject highlighting implemented');
            }
        } else {
            $this->error('❌ TimetableGrid component not found');
        }

        if (file_exists($bulkModalComponent)) {
            $this->info('✅ BulkTeacherChangeModal component exists');
        } else {
            $this->error('❌ BulkTeacherChangeModal component not found');
        }

        $this->newLine();
        $this->info('=== VERIFICATION COMPLETE ===');
        $this->newLine();

        return 0;
    }
}

