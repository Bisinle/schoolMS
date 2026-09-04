<?php

namespace App\Services;

use App\Models\Grade;
use App\Models\Subject;
use App\Models\TimetableSlot;
use App\Models\TimetableTemplate;
use Illuminate\Support\Collection;

/**
 * Service for tracking timetable compliance with curriculum requirements
 *
 * Phase 2: Grade-Timetable Integration
 * Purpose: Centralize all session tracking and compliance logic
 */
class TimetableComplianceService
{
    /**
     * Get comprehensive compliance report for a timetable template
     */
    public function getTemplateComplianceReport(TimetableTemplate $template): array
    {
        $grade = $template->grade;
        $termId = $template->academic_term_id;

        return [
            'template_id' => $template->id,
            'template_name' => $template->name,
            'grade_id' => $grade->id,
            'grade_name' => $grade->name,
            'term_id' => $termId,
            'subjects' => $this->getSubjectComplianceDetails($grade, $termId),
            'summary' => $this->getComplianceSummary($grade, $termId),
            'teachers' => $this->getTeacherWorkloadSummary($template),
        ];
    }

    /**
     * Get detailed compliance for each subject
     */
    public function getSubjectComplianceDetails(Grade $grade, int $termId): Collection
    {
        return $grade->subjects->map(function ($subject) use ($grade, $termId) {
            $required = $subject->pivot->sessions_per_week;
            $actual = $grade->getActualSessionsForSubject($subject->id, $termId);
            $difference = $actual - $required;

            return [
                'subject_id' => $subject->id,
                'subject_name' => $subject->name,
                'subject_code' => $subject->code,
                'subject_category' => $subject->category,
                'required_sessions' => $required,
                'actual_sessions' => $actual,
                'difference' => $difference,
                'percentage' => $required > 0 ? round(($actual / $required) * 100, 1) : 0,
                'status' => $this->getComplianceStatus($actual, $required),
                'status_label' => $this->getComplianceStatusLabel($actual, $required),
                'status_color' => $this->getComplianceStatusColor($actual, $required),
            ];
        });
    }

    /**
     * Get overall compliance summary
     */
    public function getComplianceSummary(Grade $grade, int $termId): array
    {
        $subjects = $this->getSubjectComplianceDetails($grade, $termId);

        $complete = $subjects->where('status', 'complete')->count();
        $under = $subjects->where('status', 'under')->count();
        $over = $subjects->where('status', 'over')->count();
        $total = $subjects->count();

        $totalRequired = $subjects->sum('required_sessions');
        $totalActual = $subjects->sum('actual_sessions');

        return [
            'total_subjects' => $total,
            'complete_count' => $complete,
            'under_count' => $under,
            'over_count' => $over,
            'total_required_sessions' => $totalRequired,
            'total_actual_sessions' => $totalActual,
            'overall_percentage' => $totalRequired > 0 ? round(($totalActual / $totalRequired) * 100, 1) : 0,
            'is_fully_compliant' => $complete === $total,
        ];
    }

    /**
     * Get teacher workload summary for a template
     */
    public function getTeacherWorkloadSummary(TimetableTemplate $template): Collection
    {
        $grade = $template->grade;

        // A teacher can end up with no linked user (e.g. its user was
        // soft-deleted without the teacher row itself being cleaned up) -
        // skip those rather than crash the whole report.
        return $grade->teachers->filter(fn ($teacher) => $teacher->user !== null)
            ->map(function ($teacher) use ($template) {
                $slots = TimetableSlot::where('timetable_template_id', $template->id)
                    ->where('teacher_id', $teacher->id)
                    ->where('slot_type', TimetableSlot::TYPE_LESSON)
                    ->count();

                return [
                    'teacher_id' => $teacher->id,
                    'teacher_name' => $teacher->user->name,
                    'is_class_teacher' => $teacher->pivot->is_class_teacher,
                    'total_lessons' => $slots,
                ];
            })->sortByDesc('total_lessons')->values();
    }

    /**
     * Get compliance status
     */
    private function getComplianceStatus(int $actual, int $required): string
    {
        if ($actual === $required) {
            return 'complete';
        } elseif ($actual < $required) {
            return 'under';
        } else {
            return 'over';
        }
    }

    /**
     * Get human-readable status label
     */
    private function getComplianceStatusLabel(int $actual, int $required): string
    {
        $status = $this->getComplianceStatus($actual, $required);

        return match ($status) {
            'complete' => 'Complete',
            'under' => 'Under-scheduled',
            'over' => 'Over-scheduled',
        };
    }

    /**
     * Get status color for UI
     */
    private function getComplianceStatusColor(int $actual, int $required): string
    {
        $status = $this->getComplianceStatus($actual, $required);

        return match ($status) {
            'complete' => 'green',
            'under' => 'orange',
            'over' => 'red',
        };
    }
}
