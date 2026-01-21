<?php

namespace App\Services;

use App\Models\Grade;
use App\Models\TimetableTemplate;
use App\Models\TimetableSlot;
use App\Models\LevelDayBlueprint;
use App\Services\Timetable\PriorityBasedPeriodAllocator;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class TimetableGenerationService
{
    protected $template;
    protected $grade;
    protected $blueprint;
    protected $workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    protected $priorityAllocator;
    
    public function generate(TimetableTemplate $template): array
    {
        $this->template = $template;
        $this->grade = $template->grade;
        $this->priorityAllocator = new PriorityBasedPeriodAllocator();

        // ============================================
        // LAYER 3: SERVICE VALIDATION (Final Safeguard)
        // ============================================
        // This is the last line of defense before database operations.
        // Validates prerequisites even if controller validation was bypassed.
        $validation = $this->grade->canGenerateTimetable();

        if (!$validation['can_generate']) {
            // Build detailed error message following design principles
            $errorMessage = "Cannot Generate Timetable for {$this->grade->name}\n\n";

            // Show missing requirements
            if (!empty($validation['errors'])) {
                $errorMessage .= "Missing Requirements:\n";
                foreach ($validation['errors'] as $error) {
                    if (is_array($error)) {
                        $errorMessage .= "❌ {$error['message']}\n";
                        $errorMessage .= "   → {$error['action']}\n\n";
                    } else {
                        // Fallback for old string format
                        $errorMessage .= "❌ {$error}\n\n";
                    }
                }
            }

            // Show successes (what's already configured)
            if (!empty($validation['successes'])) {
                $errorMessage .= "Already Configured:\n";
                foreach ($validation['successes'] as $success) {
                    $errorMessage .= "✅ {$success}\n";
                }
                $errorMessage .= "\n";
            }

            // Show warnings
            if (!empty($validation['warnings'])) {
                $errorMessage .= "Warnings:\n";
                foreach ($validation['warnings'] as $warning) {
                    if (is_array($warning)) {
                        $errorMessage .= "⚠️ {$warning['message']}\n";
                        $errorMessage .= "   → {$warning['action']}\n\n";
                    } else {
                        // Fallback for old string format
                        $errorMessage .= "⚠️ {$warning}\n\n";
                    }
                }
            }

            throw new \Exception($errorMessage);
        }

        // Get blueprint after validation
        $this->blueprint = $this->grade->activeBlueprint();

        // Step 1: Delete existing auto-generated slots (if regenerating)
        $this->clearExistingSlots();

        // Step 2: Generate structural slots (all days × all periods)
        $slots = $this->generateStructuralSlots();

        // Step 3: Get curriculum rules
        $curriculumRules = $this->getCurriculumRules();

        // Step 4: Allocate subjects
        $createdSlots = $this->allocateSubjects($slots, $curriculumRules);

        // Step 5: Post-generation validation
        $postValidation = $this->validateGeneratedTimetable($createdSlots, $curriculumRules);

        return [
            'generated' => $createdSlots->count(),
            'lessons' => $createdSlots->where('slot_type', 'lesson')->count(),
            'breaks' => $createdSlots->whereIn('slot_type', ['short_break', 'lunch', 'prayer', 'sports', 'activity'])->count(),
            'study_halls' => $createdSlots->where('slot_type', 'study')->count(),
            'validation' => $validation, // Include validation results for display
            'post_validation' => $postValidation, // Post-generation checks
        ];
    }

    protected function clearExistingSlots()
    {
        TimetableSlot::where('timetable_template_id', $this->template->id)
            ->where('manually_created', false) // Only delete auto-generated
            ->delete();
    }

    protected function generateStructuralSlots(): Collection
    {
        $slots = collect();

        foreach ($this->workingDays as $day) {
            foreach ($this->blueprint->periods as $blueprintPeriod) {
                // Map blueprint period types to slot types
                $slotType = $this->mapPeriodTypeToSlotType($blueprintPeriod->period_type);

                // Skip lesson slots - they will be created later with subjects assigned
                // This avoids the "Lesson slots must have a subject" validation error
                if ($blueprintPeriod->is_teachable) {
                    // Store blueprint period info for later lesson slot creation
                    $slots->push((object)[
                        'is_placeholder' => true,
                        'day_of_week' => $day,
                        'blueprint_period' => $blueprintPeriod,
                        'slot_type' => $slotType,
                    ]);
                    continue;
                }

                // Create non-lesson slots (breaks, lunch, etc.)
                $slot = TimetableSlot::create([
                    'timetable_template_id' => $this->template->id,
                    'school_id' => $this->template->school_id,
                    'day_of_week' => $day,
                    'timetable_period_id' => null, // Blueprint periods are different from timetable_periods
                    'sequence_order' => $blueprintPeriod->sequence_order,
                    'start_time' => $blueprintPeriod->start_time,
                    'end_time' => $blueprintPeriod->end_time,
                    'duration_minutes' => $blueprintPeriod->duration_minutes,
                    'slot_type' => $slotType,
                    'priority_band' => $blueprintPeriod->priority_band,
                    'is_teachable' => false,
                    'manually_created' => false,
                    'room_id' => null,
                ]);

                $slots->push($slot);
            }
        }

        return $slots;
    }

    protected function mapPeriodTypeToSlotType(string $periodType): string
    {
        // Map blueprint period types to timetable slot types
        $mapping = [
            'lesson' => 'lesson',
            'short_break' => 'short_break',
            'lunch' => 'lunch',
            'prayer' => 'prayer',
            'sports' => 'sports',
            'activity' => 'activity',
        ];

        return $mapping[$periodType] ?? 'other';
    }

    protected function getCurriculumRules(): Collection
    {
        return $this->grade->subjects()
            ->withPivot(['sessions_per_week', 'priority', 'must_be_daily', 'can_repeat_same_day'])
            ->get()
            ->map(function ($subject) {
                return [
                    'subject' => $subject,
                    'sessions_per_week' => $subject->pivot->sessions_per_week ?? 0,
                    'priority' => $subject->pivot->priority ?? 'neutral',
                    'must_be_daily' => $subject->pivot->must_be_daily ?? false,
                    'can_repeat_same_day' => $subject->pivot->can_repeat_same_day ?? false,
                    'remaining' => $subject->pivot->sessions_per_week ?? 0,
                ];
            })
            ->filter(function ($rule) {
                return $rule['sessions_per_week'] > 0;
            });
    }

    protected function allocateSubjects(Collection $placeholders, Collection $curriculumRules)
    {
        // Get only placeholder slots (lesson slots to be created)
        $lessonPlaceholders = $placeholders->where('is_placeholder', true);

        // Build subject allocation map
        $subjectAllocations = $this->buildSubjectAllocationMap($lessonPlaceholders, $curriculumRules);

        // Create ALL lesson slots (both with and without subjects)
        $createdSlots = collect();

        // Track which placeholders have been allocated
        $allocatedPlaceholders = collect();

        // First, create slots with subjects assigned
        foreach ($subjectAllocations as $allocation) {
            $slot = TimetableSlot::create([
                'timetable_template_id' => $this->template->id,
                'school_id' => $this->template->school_id,
                'day_of_week' => $allocation['day_of_week'],
                'timetable_period_id' => null,
                'sequence_order' => $allocation['blueprint_period']->sequence_order,
                'start_time' => $allocation['blueprint_period']->start_time,
                'end_time' => $allocation['blueprint_period']->end_time,
                'duration_minutes' => $allocation['blueprint_period']->duration_minutes,
                'slot_type' => $allocation['slot_type'],
                'priority_band' => $allocation['blueprint_period']->priority_band,
                'is_teachable' => true,
                'manually_created' => false,
                'subject_id' => $allocation['subject_id'], // Subject assigned during creation
                'teacher_id' => null, // To be filled by assignTeachers
                'room_id' => $this->grade->default_room_id,
            ]);

            $createdSlots->push($slot);

            // Mark this placeholder as allocated
            $allocatedPlaceholders->push([
                'day' => $allocation['day_of_week'],
                'sequence' => $allocation['blueprint_period']->sequence_order,
            ]);
        }

        // Second, create empty slots for remaining unallocated placeholders
        foreach ($lessonPlaceholders as $placeholder) {
            // Check if this placeholder was already allocated
            $isAllocated = $allocatedPlaceholders->contains(function ($allocated) use ($placeholder) {
                return $allocated['day'] === $placeholder->day_of_week
                    && $allocated['sequence'] === $placeholder->blueprint_period->sequence_order;
            });

            if (!$isAllocated) {
                // Create an empty slot (study hall / free period)
                $slot = TimetableSlot::create([
                    'timetable_template_id' => $this->template->id,
                    'school_id' => $this->template->school_id,
                    'day_of_week' => $placeholder->day_of_week,
                    'timetable_period_id' => null,
                    'sequence_order' => $placeholder->blueprint_period->sequence_order,
                    'start_time' => $placeholder->blueprint_period->start_time,
                    'end_time' => $placeholder->blueprint_period->end_time,
                    'duration_minutes' => $placeholder->blueprint_period->duration_minutes,
                    'slot_type' => 'study', // Mark as study hall / free period
                    'priority_band' => $placeholder->blueprint_period->priority_band,
                    'is_teachable' => false, // Not a lesson, so no subject required
                    'manually_created' => false,
                    'subject_id' => null,
                    'teacher_id' => null,
                    'room_id' => $this->grade->default_room_id,
                ]);

                $createdSlots->push($slot);
            }
        }

        // Step 3: Assign teachers to created lesson slots (only those with subjects)
        $this->assignTeachers($createdSlots->where('is_teachable', true));

        return $createdSlots;
    }

    protected function buildSubjectAllocationMap(Collection $lessonPlaceholders, Collection $curriculumRules)
    {
        $allocations = collect();

        // Build subject pool based on sessions_per_week
        $subjectPool = collect();
        foreach ($curriculumRules as $rule) {
            for ($i = 0; $i < $rule['sessions_per_week']; $i++) {
                $subjectPool->push([
                    'subject_id' => $rule['subject']->id,
                    'priority' => $rule['priority'],
                    'must_be_daily' => $rule['must_be_daily'],
                    'can_repeat_same_day' => $rule['can_repeat_same_day'],
                ]);
            }
        }

        // ============================================
        // SIMPLE ROUND-ROBIN ALLOCATION
        // ============================================
        // Group placeholders by day for even distribution
        $placeholdersByDay = $lessonPlaceholders->groupBy('day_of_week');

        $dayRotation = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        $currentDayIndex = 0;

        // Allocate all subjects using round-robin across days
        foreach ($subjectPool as $subject) {
            $placeholder = null;
            $attempts = 0;

            // Try to find a placeholder in the current day (round-robin)
            while ($attempts < count($dayRotation) && !$placeholder) {
                $currentDay = $dayRotation[$currentDayIndex % count($dayRotation)];

                if ($placeholdersByDay->has($currentDay) && $placeholdersByDay->get($currentDay)->isNotEmpty()) {
                    $placeholder = $placeholdersByDay->get($currentDay)->shift();
                }

                if (!$placeholder) {
                    $currentDayIndex++;
                    $attempts++;
                }
            }

            if ($placeholder) {
                $allocations->push([
                    'day_of_week' => $placeholder->day_of_week,
                    'blueprint_period' => $placeholder->blueprint_period,
                    'slot_type' => $placeholder->slot_type,
                    'subject_id' => $subject['subject_id'],
                ]);
                $currentDayIndex++; // Move to next day for next subject
            }
        }

        return $allocations;
    }



    protected function assignTeachers(Collection $slots)
    {
        $lessonSlots = $slots->where('is_teachable', true)->whereNotNull('subject_id');

        // Get the class teacher for this grade
        $classTeacher = $this->grade->getClassTeacher();

        foreach ($lessonSlots as $slot) {
            // Auto-assign class teacher to ALL lesson slots
            // Admin can manually override this later if needed
            if ($classTeacher) {
                $slot->update([
                    'teacher_id' => $classTeacher->id,
                    'auto_assigned_teacher' => true, // Flag for UI indication
                ]);
            }

            // Note: The old logic below is replaced by auto-assigning class teacher
            // Admins can manually change to specialist teachers after generation

            // OLD LOGIC (commented out):
            // Get teachers assigned to this grade for this subject
            // $teachers = $this->grade->teachers()
            //     ->whereHas('subjects', function ($query) use ($slot) {
            //         $query->where('subjects.id', $slot->subject_id);
            //     })
            //     ->get();
            //
            // if ($teachers->count() === 1) {
            //     // Auto-assign if only one teacher
            //     $slot->update(['teacher_id' => $teachers->first()->id]);
            // } elseif ($teachers->count() > 1) {
            //     // Random pick (can be improved with load balancing)
            //     $slot->update(['teacher_id' => $teachers->random()->id]);
            // }
        }
    }

    /**
     * Validate the generated timetable against curriculum rules
     */
    protected function validateGeneratedTimetable(Collection $createdSlots, Collection $curriculumRules): array
    {
        $issues = [];
        $warnings = [];
        $stats = [];

        // Check 1: Verify all lesson slots have subjects assigned
        $emptySlots = $createdSlots->where('is_teachable', true)->whereNull('subject_id');
        if ($emptySlots->isNotEmpty()) {
            $issues[] = "Found {$emptySlots->count()} empty lesson slots that should have subjects assigned";
        }

        // Check 2: Verify sessions per week match curriculum rules
        $subjectCounts = $createdSlots->where('is_teachable', true)
            ->whereNotNull('subject_id')
            ->groupBy('subject_id')
            ->map(function ($slots) {
                return $slots->count();
            });

        foreach ($curriculumRules as $rule) {
            $subjectId = $rule['subject']->id;
            $expectedSessions = $rule['sessions_per_week'];
            $actualSessions = $subjectCounts->get($subjectId, 0);

            if ($actualSessions !== $expectedSessions) {
                $issues[] = "Subject '{$rule['subject']->name}': Expected {$expectedSessions} sessions/week, got {$actualSessions}";
            }

            $stats[$rule['subject']->name] = [
                'expected' => $expectedSessions,
                'actual' => $actualSessions,
                'match' => $actualSessions === $expectedSessions,
            ];
        }

        // Check 3: Verify daily distribution
        $dayStats = [];
        foreach ($this->workingDays as $day) {
            $daySlots = $createdSlots->where('day_of_week', $day)
                ->where('is_teachable', true)
                ->whereNotNull('subject_id');

            $totalSlots = $daySlots->count();

            $dayStats[$day] = [
                'total_slots' => $totalSlots,
            ];

            // Warn if a day has no lessons
            if ($totalSlots === 0) {
                $warnings[] = ucfirst($day) . ": No lessons scheduled";
            }
        }

        // Check 4: Verify daily distribution (must_be_daily subjects)
        foreach ($curriculumRules as $rule) {
            if ($rule['must_be_daily']) {
                $subjectId = $rule['subject']->id;
                $daysWithSubject = $createdSlots->where('subject_id', $subjectId)
                    ->pluck('day_of_week')
                    ->unique()
                    ->count();

                $expectedDays = count($this->workingDays);
                if ($daysWithSubject < $expectedDays) {
                    $warnings[] = "Subject '{$rule['subject']->name}' is marked as 'must be daily' but only appears on {$daysWithSubject}/{$expectedDays} days";
                }
            }
        }

        return [
            'valid' => empty($issues),
            'issues' => $issues,
            'warnings' => $warnings,
            'stats' => $stats,
            'day_stats' => $dayStats,
        ];
    }
}
