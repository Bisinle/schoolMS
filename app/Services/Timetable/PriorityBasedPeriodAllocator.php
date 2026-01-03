<?php

namespace App\Services\Timetable;

use App\Models\Subject;
use App\Models\TimetablePeriod;
use App\Models\Grade;
use Illuminate\Support\Collection;

/**
 * Priority-Based Period Allocator
 * 
 * Intelligently matches subjects to periods based on priority bands.
 * Ensures high-priority subjects (Math, Science) get morning slots,
 * and low-priority subjects (Arts, PE) get afternoon slots.
 */
class PriorityBasedPeriodAllocator
{
    /**
     * Get periods grouped by priority band for a school
     * 
     * @param int $schoolId
     * @param string|null $gradeLevel Optional grade level filter
     * @return array Array of periods grouped by priority band
     */
    public function getPeriodsByPriorityBand(int $schoolId, ?string $gradeLevel = null): array
    {
        $query = TimetablePeriod::where('school_id', $schoolId)
            ->whereNotNull('priority_band')
            ->orderBy('order');

        if ($gradeLevel) {
            $query->where('grade_level', $gradeLevel);
        }

        $periods = $query->get();

        return [
            'morning_high' => $periods->where('priority_band', 'morning_high')->values(),
            'neutral' => $periods->where('priority_band', 'neutral')->values(),
            'afternoon_low' => $periods->where('priority_band', 'afternoon_low')->values(),
        ];
    }

    /**
     * Get subjects grouped by priority for a grade
     * 
     * @param Grade $grade
     * @return array Array of subjects grouped by priority
     */
    public function getSubjectsByPriority(Grade $grade): array
    {
        $subjects = $grade->subjects()->get();

        return [
            'high' => $subjects->filter(fn($s) => $s->pivot->priority === 'high')->values(),
            'neutral' => $subjects->filter(fn($s) => $s->pivot->priority === 'neutral')->values(),
            'low' => $subjects->filter(fn($s) => $s->pivot->priority === 'low')->values(),
        ];
    }

    /**
     * Get optimal periods for a subject in a grade
     * Returns periods that match the subject's priority band
     * 
     * @param Subject $subject
     * @param Grade $grade
     * @param Collection $availablePeriods
     * @return Collection Filtered periods matching subject priority
     */
    public function getOptimalPeriodsForSubject(
        Subject $subject,
        Grade $grade,
        Collection $availablePeriods
    ): Collection {
        $subjectPriority = $subject->getPriorityForGrade($grade->id);
        
        if (!$subjectPriority) {
            return $availablePeriods; // No priority set, any period is fine
        }

        $targetBand = Subject::mapPriorityToBand($subjectPriority);

        // Filter periods that match the priority band
        $matchingPeriods = $availablePeriods->filter(function ($period) use ($targetBand) {
            return $period->priority_band === $targetBand;
        });

        // If no matching periods available, fall back to neutral periods
        if ($matchingPeriods->isEmpty()) {
            $matchingPeriods = $availablePeriods->filter(function ($period) {
                return $period->priority_band === 'neutral';
            });
        }

        // If still no periods, return all available (last resort)
        return $matchingPeriods->isEmpty() ? $availablePeriods : $matchingPeriods;
    }

    /**
     * Check if a subject-period pairing is optimal
     * 
     * @param Subject $subject
     * @param TimetablePeriod $period
     * @param int $gradeId
     * @return array ['is_optimal' => bool, 'reason' => string]
     */
    public function isPairingOptimal(Subject $subject, TimetablePeriod $period, int $gradeId): array
    {
        $subjectPriority = $subject->getPriorityForGrade($gradeId);
        
        if (!$subjectPriority || !$period->priority_band) {
            return [
                'is_optimal' => true,
                'reason' => 'No priority constraints',
                'match_quality' => 'neutral',
            ];
        }

        $targetBand = Subject::mapPriorityToBand($subjectPriority);
        $isMatch = $targetBand === $period->priority_band;

        if ($isMatch) {
            return [
                'is_optimal' => true,
                'reason' => 'Perfect match: ' . Subject::getSubjectPriorityLabel($subjectPriority) . ' in ' . Subject::getPriorityBandLabel($period->priority_band),
                'match_quality' => 'perfect',
            ];
        }

        // Check if it's in neutral band (acceptable)
        if ($period->priority_band === 'neutral') {
            return [
                'is_optimal' => true,
                'reason' => 'Acceptable: Scheduled in neutral period',
                'match_quality' => 'acceptable',
            ];
        }

        // Mismatch
        return [
            'is_optimal' => false,
            'reason' => 'Suboptimal: ' . Subject::getSubjectPriorityLabel($subjectPriority) . ' scheduled in ' . Subject::getPriorityBandLabel($period->priority_band),
            'match_quality' => 'poor',
        ];
    }

    /**
     * Get allocation statistics for a timetable template
     * Shows how well subjects are matched to their optimal periods
     *
     * @param \App\Models\TimetableTemplate $template
     * @return array Statistics about priority matching
     */
    public function getTemplateAllocationStats($template): array
    {
        $slots = $template->slots()
            ->with(['subject', 'period'])
            ->whereNotNull('subject_id')
            ->get();

        $stats = [
            'total_slots' => $slots->count(),
            'perfect_matches' => 0,
            'acceptable_matches' => 0,
            'poor_matches' => 0,
            'no_priority_set' => 0,
            'match_percentage' => 0,
        ];

        foreach ($slots as $slot) {
            if (!$slot->subject) {
                continue;
            }

            // Get subject priority for this grade
            $subjectPriority = $slot->subject->getPriorityForGrade($template->grade_id);

            // Get period priority band (from period relationship or directly from slot)
            $periodBand = $slot->period ? $slot->period->priority_band : $slot->priority_band;

            // Skip if no priorities are set
            if (!$subjectPriority || !$periodBand) {
                $stats['no_priority_set']++;
                continue;
            }

            // Check if it's a perfect match
            $targetBand = \App\Models\Subject::mapPriorityToBand($subjectPriority);
            $isMatch = $targetBand === $periodBand;

            if ($isMatch) {
                $stats['perfect_matches']++;
            } elseif ($periodBand === 'neutral') {
                // Acceptable: scheduled in neutral period
                $stats['acceptable_matches']++;
            } else {
                // Poor: mismatched priority
                $stats['poor_matches']++;
            }
        }

        // Calculate match percentage (perfect + acceptable / total)
        if ($stats['total_slots'] > 0) {
            $stats['match_percentage'] = round(
                (($stats['perfect_matches'] + $stats['acceptable_matches']) / $stats['total_slots']) * 100,
                1
            );
        }

        return $stats;
    }

    /**
     * Get recommendations for improving period allocation
     *
     * @param \App\Models\TimetableTemplate $template
     * @return array List of recommendations
     */
    public function getRecommendations($template): array
    {
        $recommendations = [];
        $stats = $this->getTemplateAllocationStats($template);

        if ($stats['poor_matches'] > 0) {
            $recommendations[] = [
                'type' => 'warning',
                'message' => "{$stats['poor_matches']} subject(s) are scheduled in suboptimal time slots",
                'action' => 'Review and reschedule high-priority subjects to morning periods',
            ];
        }

        if ($stats['match_percentage'] < 70) {
            $recommendations[] = [
                'type' => 'info',
                'message' => "Only {$stats['match_percentage']}% of subjects are optimally scheduled",
                'action' => 'Consider using the auto-generation feature with priority matching',
            ];
        }

        if ($stats['match_percentage'] >= 90) {
            $recommendations[] = [
                'type' => 'success',
                'message' => "Excellent! {$stats['match_percentage']}% of subjects are optimally scheduled",
                'action' => null,
            ];
        }

        return $recommendations;
    }
}


