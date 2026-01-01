<?php

namespace App\Services;

use App\Models\Grade;
use App\Models\TimetableTemplate;
use App\Models\TimetableSlot;
use App\Models\LevelDayBlueprint;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class TimetableGenerationService
{
    protected $template;
    protected $grade;
    protected $blueprint;
    protected $workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    public function generate(TimetableTemplate $template): array
    {
        $this->template = $template;
        $this->grade = $template->grade;
        $this->blueprint = $this->grade->activeBlueprint();
        
        if (!$this->blueprint) {
            throw new \Exception("No active blueprint found for level: {$this->grade->level}");
        }

        // Step 1: Delete existing auto-generated slots (if regenerating)
        $this->clearExistingSlots();

        // Step 2: Generate structural slots (all days × all periods)
        $slots = $this->generateStructuralSlots();

        // Step 3: Get curriculum rules
        $curriculumRules = $this->getCurriculumRules();

        // Step 4: Allocate subjects
        $this->allocateSubjects($slots, $curriculumRules);

        return [
            'generated' => $slots->count(),
            'lessons' => $slots->where('slot_type', 'lesson')->count(),
            'breaks' => $slots->whereIn('slot_type', ['short_break', 'lunch', 'prayer', 'sports', 'activity'])->count(),
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
                    'is_teachable' => $blueprintPeriod->is_teachable,
                    'manually_created' => false,
                    'subject_id' => null, // To be filled for lessons
                    'teacher_id' => null, // To be filled for lessons
                    'room_id' => $blueprintPeriod->is_teachable ? $this->grade->default_room_id : null,
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
            'short_break' => 'break',
            'lunch' => 'lunch',
            'prayer' => 'other',
            'sports' => 'activity',
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

    protected function allocateSubjects(Collection $slots, Collection $curriculumRules)
    {
        // Step 1: Lock daily subjects (Math, English) - one per day, morning slots
        $this->allocateDailySubjects($slots, $curriculumRules);

        // Step 2: Allocate remaining subjects with priority matching
        $this->allocateRemainingSubjects($slots, $curriculumRules);

        // Step 3: Assign teachers
        $this->assignTeachers($slots);
    }

    protected function allocateDailySubjects(Collection $slots, Collection $curriculumRules)
    {
        $dailySubjects = $curriculumRules->where('must_be_daily', true);

        foreach ($this->workingDays as $day) {
            $availableSlots = $slots->where('day_of_week', $day)
                ->where('is_teachable', true)
                ->where('priority_band', 'morning_high')
                ->whereNull('subject_id')
                ->shuffle();

            foreach ($dailySubjects as &$rule) {
                if ($rule['remaining'] <= 0) continue;

                $slot = $availableSlots->shift();
                if ($slot) {
                    $slot->update(['subject_id' => $rule['subject']->id]);
                    $rule['remaining']--;
                }
            }
        }
    }

    protected function allocateRemainingSubjects(Collection $slots, Collection $curriculumRules)
    {
        // Build subject pool based on remaining counts
        $subjectPool = collect();
        foreach ($curriculumRules as $rule) {
            for ($i = 0; $i < $rule['remaining']; $i++) {
                $subjectPool->push([
                    'subject_id' => $rule['subject']->id,
                    'priority' => $rule['priority'],
                    'can_repeat_same_day' => $rule['can_repeat_same_day'],
                ]);
            }
        }

        // Shuffle for variety
        $subjectPool = $subjectPool->shuffle();

        // Get all unfilled lesson slots
        $availableSlots = $slots->where('is_teachable', true)
            ->whereNull('subject_id')
            ->sortBy('sequence_order');

        foreach ($availableSlots as $slot) {
            // Find compatible subject
            $compatibleSubject = $subjectPool->first(function ($item) use ($slot, $slots) {
                // Priority matching
                $priorityMatch = $this->priorityMatches($item['priority'], $slot->priority_band);

                // Check if already used today (if can't repeat)
                if (!$item['can_repeat_same_day']) {
                    $usedToday = $slots->where('day_of_week', $slot->day_of_week)
                        ->where('subject_id', $item['subject_id'])
                        ->isNotEmpty();

                    if ($usedToday) return false;
                }

                return $priorityMatch;
            });

            if ($compatibleSubject) {
                $slot->update(['subject_id' => $compatibleSubject['subject_id']]);
                $subjectPool = $subjectPool->reject(function ($item) use ($compatibleSubject) {
                    return $item === $compatibleSubject;
                })->values();
            }
        }
    }

    protected function priorityMatches(string $subjectPriority, ?string $slotPriorityBand): bool
    {
        // High priority subjects can only go in morning_high or neutral slots
        if ($subjectPriority === 'high') {
            return in_array($slotPriorityBand, ['morning_high', 'neutral']);
        }

        // Neutral subjects can go anywhere
        if ($subjectPriority === 'neutral') {
            return true;
        }

        // Low priority subjects can go in neutral or afternoon_low
        if ($subjectPriority === 'low') {
            return in_array($slotPriorityBand, ['neutral', 'afternoon_low']);
        }

        return true;
    }

    protected function assignTeachers(Collection $slots)
    {
        $lessonSlots = $slots->where('is_teachable', true)->whereNotNull('subject_id');

        foreach ($lessonSlots as $slot) {
            // Get teachers assigned to this grade for this subject
            $teachers = $this->grade->teachers()
                ->whereHas('subjects', function ($query) use ($slot) {
                    $query->where('subjects.id', $slot->subject_id);
                })
                ->get();

            if ($teachers->count() === 1) {
                // Auto-assign if only one teacher
                $slot->update(['teacher_id' => $teachers->first()->id]);
            } elseif ($teachers->count() > 1) {
                // Random pick (can be improved with load balancing)
                $slot->update(['teacher_id' => $teachers->random()->id]);
            }
            // If no teachers, leave empty for manual assignment
        }
    }
}
