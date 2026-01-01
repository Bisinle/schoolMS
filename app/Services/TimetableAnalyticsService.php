<?php

namespace App\Services;

use App\Models\Grade;
use App\Models\Teacher;
use App\Models\TimetableTemplate;
use App\Models\TimetableSlot;
use App\Models\TimetableConflict;
use App\Models\TeacherAvailability;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Service for aggregating timetable analytics across the school
 * 
 * Phase 4: Reporting, Analytics & System Cleanup
 * Purpose: Provide dashboard-level analytics for curriculum compliance,
 *          teacher utilization, conflicts, and slot coverage
 */
class TimetableAnalyticsService
{
    protected TimetableComplianceService $complianceService;
    protected TimetableConflictDetector $conflictDetector;

    public function __construct(
        TimetableComplianceService $complianceService,
        TimetableConflictDetector $conflictDetector
    ) {
        $this->complianceService = $complianceService;
        $this->conflictDetector = $conflictDetector;
    }

    /**
     * Get comprehensive timetable analytics for admin dashboard
     *
     * @param int $schoolId
     * @return array
     */
    public function getDashboardAnalytics(int $schoolId): array
    {
        return [
            'curriculum_compliance' => $this->getCurriculumComplianceOverview($schoolId),
            'teacher_utilization' => $this->getTeacherUtilizationOverview($schoolId),
            'conflict_summary' => $this->getConflictSummaryOverview($schoolId),
            'slot_coverage' => $this->getSlotCoverageAnalytics($schoolId),
            'quick_stats' => $this->getTimetableQuickStats($schoolId),
        ];
    }

    /**
     * Get curriculum compliance overview for all grades
     *
     * @param int $schoolId
     * @return array
     */
    public function getCurriculumComplianceOverview(int $schoolId): array
    {
        $grades = Grade::where('school_id', $schoolId)
            ->where('status', 'active')
            ->with(['timetableTemplates' => function ($query) {
                $query->where('is_active', true)->where('status', 'published');
            }])
            ->get();

        $totalGrades = $grades->count();
        $gradesWithTimetables = $grades->filter(fn($g) => $g->timetableTemplates->isNotEmpty())->count();
        $compliantGrades = 0;
        $underScheduledSubjects = 0;
        $overScheduledSubjects = 0;

        $gradeDetails = $grades->map(function ($grade) use (&$compliantGrades, &$underScheduledSubjects, &$overScheduledSubjects) {
            $template = $grade->timetableTemplates->first();
            
            if (!$template) {
                return [
                    'grade_id' => $grade->id,
                    'grade_name' => $grade->name,
                    'has_timetable' => false,
                    'compliance_status' => 'no_timetable',
                    'compliance_percentage' => 0,
                ];
            }

            $report = $this->complianceService->getTemplateComplianceReport($template);
            $summary = $report['summary'];

            if ($summary['is_fully_compliant']) {
                $compliantGrades++;
            }

            $underScheduledSubjects += $summary['under_count'];
            $overScheduledSubjects += $summary['over_count'];

            return [
                'grade_id' => $grade->id,
                'grade_name' => $grade->name,
                'has_timetable' => true,
                'compliance_status' => $summary['is_fully_compliant'] ? 'compliant' : 'non_compliant',
                'compliance_percentage' => $summary['overall_percentage'],
                'under_scheduled' => $summary['under_count'],
                'over_scheduled' => $summary['over_count'],
            ];
        });

        return [
            'total_grades' => $totalGrades,
            'grades_with_timetables' => $gradesWithTimetables,
            'compliant_grades' => $compliantGrades,
            'non_compliant_grades' => $gradesWithTimetables - $compliantGrades,
            'grades_without_timetables' => $totalGrades - $gradesWithTimetables,
            'total_under_scheduled_subjects' => $underScheduledSubjects,
            'total_over_scheduled_subjects' => $overScheduledSubjects,
            'overall_compliance_rate' => $gradesWithTimetables > 0 
                ? round(($compliantGrades / $gradesWithTimetables) * 100, 1) 
                : 0,
            'grade_details' => $gradeDetails->values(),
        ];
    }

    /**
     * Get teacher utilization overview
     *
     * @param int $schoolId
     * @return array
     */
    public function getTeacherUtilizationOverview(int $schoolId): array
    {
        $teachers = Teacher::where('school_id', $schoolId)
            ->whereHas('user', fn($q) => $q->where('is_active', true))
            ->with(['timetableSlots' => function ($query) {
                $query->whereHas('timetableTemplate', fn($q) => $q->where('is_active', true))
                    ->where('slot_type', TimetableSlot::TYPE_LESSON);
            }, 'grades'])
            ->get();

        $totalTeachers = $teachers->count();
        $assignedTeachers = $teachers->filter(fn($t) => $t->timetableSlots->isNotEmpty())->count();
        $unassignedTeachers = $totalTeachers - $assignedTeachers;

        $utilizationData = $teachers->map(function ($teacher) {
            $lessonsCount = $teacher->timetableSlots->count();
            $gradesCount = $teacher->grades->count();
            $isClassTeacher = $teacher->grades()->wherePivot('is_class_teacher', true)->exists();

            // Calculate utilization level
            $utilizationLevel = 'idle';
            if ($lessonsCount === 0) {
                $utilizationLevel = 'idle';
            } elseif ($lessonsCount < 10) {
                $utilizationLevel = 'under_utilized';
            } elseif ($lessonsCount <= 25) {
                $utilizationLevel = 'optimal';
            } else {
                $utilizationLevel = 'over_utilized';
            }

            return [
                'teacher_id' => $teacher->id,
                'teacher_name' => $teacher->user->name,
                'total_lessons' => $lessonsCount,
                'grades_assigned' => $gradesCount,
                'is_class_teacher' => $isClassTeacher,
                'utilization_level' => $utilizationLevel,
            ];
        });

        return [
            'total_teachers' => $totalTeachers,
            'assigned_teachers' => $assignedTeachers,
            'unassigned_teachers' => $unassignedTeachers,
            'idle_teachers' => $utilizationData->where('utilization_level', 'idle')->count(),
            'under_utilized_teachers' => $utilizationData->where('utilization_level', 'under_utilized')->count(),
            'optimally_utilized_teachers' => $utilizationData->where('utilization_level', 'optimal')->count(),
            'over_utilized_teachers' => $utilizationData->where('utilization_level', 'over_utilized')->count(),
            'average_lessons_per_teacher' => $assignedTeachers > 0 
                ? round($utilizationData->sum('total_lessons') / $assignedTeachers, 1) 
                : 0,
            'teacher_details' => $utilizationData->sortByDesc('total_lessons')->take(10)->values(),
        ];
    }

    /**
     * Get conflict summary overview
     *
     * @param int $schoolId
     * @return array
     */
    public function getConflictSummaryOverview(int $schoolId): array
    {
        $unresolvedConflicts = TimetableConflict::where('school_id', $schoolId)
            ->unresolved()
            ->with(['timetableTemplate.grade'])
            ->get();

        $conflictsByType = $unresolvedConflicts->groupBy('conflict_type')->map->count();
        $conflictsBySeverity = $unresolvedConflicts->groupBy('severity')->map->count();

        $criticalConflicts = $unresolvedConflicts->where('severity', 'error')->count();
        $warningConflicts = $unresolvedConflicts->where('severity', 'warning')->count();

        // Get recent conflicts (last 7 days)
        $recentConflicts = TimetableConflict::where('school_id', $schoolId)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        // Get conflicts by grade
        $conflictsByGrade = $unresolvedConflicts->groupBy(function ($conflict) {
            return $conflict->timetableTemplate->grade->name ?? 'Unknown';
        })->map->count();

        return [
            'total_unresolved' => $unresolvedConflicts->count(),
            'critical_conflicts' => $criticalConflicts,
            'warning_conflicts' => $warningConflicts,
            'recent_conflicts_7_days' => $recentConflicts,
            'conflicts_by_type' => $conflictsByType->toArray(),
            'conflicts_by_severity' => $conflictsBySeverity->toArray(),
            'conflicts_by_grade' => $conflictsByGrade->toArray(),
            'needs_attention' => $criticalConflicts > 0,
        ];
    }

    /**
     * Get slot coverage analytics
     *
     * @param int $schoolId
     * @return array
     */
    public function getSlotCoverageAnalytics(int $schoolId): array
    {
        $activeSlots = TimetableSlot::where('school_id', $schoolId)
            ->whereHas('timetableTemplate', fn($q) => $q->where('is_active', true))
            ->get();

        $totalSlots = $activeSlots->count();
        $slotsByType = $activeSlots->groupBy('slot_type')->map->count();

        $lessonSlots = $activeSlots->where('slot_type', TimetableSlot::TYPE_LESSON)->count();
        $breakSlots = $activeSlots->whereIn('slot_type', TimetableSlot::NON_ACADEMIC_TYPES)->count();
        $activitySlots = $activeSlots->where('slot_type', TimetableSlot::TYPE_ACTIVITY)->count();
        $otherSlots = $totalSlots - $lessonSlots - $breakSlots - $activitySlots;

        // Slots by day of week
        $slotsByDay = $activeSlots->groupBy('day_of_week')->map->count();

        // Slots by time period (morning, mid-morning, afternoon)
        $slotsByTimePeriod = $activeSlots->groupBy(function ($slot) {
            if (!$slot->period) return 'unknown';

            $startTime = $slot->period->start_time;
            $hour = (int) substr($startTime, 0, 2);

            if ($hour < 10) return 'morning';
            if ($hour < 13) return 'mid_morning';
            return 'afternoon';
        })->map->count();

        // Calculate academic vs non-academic ratio
        $academicSlots = $lessonSlots + $activitySlots;
        $nonAcademicSlots = $breakSlots + $otherSlots;
        $academicRatio = $totalSlots > 0 ? round(($academicSlots / $totalSlots) * 100, 1) : 0;

        return [
            'total_slots' => $totalSlots,
            'lesson_slots' => $lessonSlots,
            'break_slots' => $breakSlots,
            'activity_slots' => $activitySlots,
            'other_slots' => $otherSlots,
            'academic_slots' => $academicSlots,
            'non_academic_slots' => $nonAcademicSlots,
            'academic_ratio' => $academicRatio,
            'slots_by_type' => $slotsByType->toArray(),
            'slots_by_day' => $slotsByDay->toArray(),
            'slots_by_time_period' => $slotsByTimePeriod->toArray(),
        ];
    }

    /**
     * Get quick timetable statistics
     *
     * @param int $schoolId
     * @return array
     */
    public function getTimetableQuickStats(int $schoolId): array
    {
        $activeTemplates = TimetableTemplate::where('school_id', $schoolId)
            ->where('is_active', true)
            ->where('status', 'published')
            ->count();

        $draftTemplates = TimetableTemplate::where('school_id', $schoolId)
            ->where('status', 'draft')
            ->count();

        $totalRooms = DB::table('rooms')->where('school_id', $schoolId)->count();

        $teachersWithAvailability = TeacherAvailability::where('school_id', $schoolId)
            ->distinct('teacher_id')
            ->count('teacher_id');

        $substitutions = TimetableSlot::where('school_id', $schoolId)
            ->where('is_substitution', true)
            ->whereHas('timetableTemplate', fn($q) => $q->where('is_active', true))
            ->count();

        return [
            'active_timetables' => $activeTemplates,
            'draft_timetables' => $draftTemplates,
            'total_rooms' => $totalRooms,
            'teachers_with_availability_set' => $teachersWithAvailability,
            'active_substitutions' => $substitutions,
        ];
    }

    /**
     * Get detailed teacher workload report
     *
     * @param int $schoolId
     * @param int|null $teacherId
     * @return array
     */
    public function getTeacherWorkloadReport(int $schoolId, ?int $teacherId = null): array
    {
        $query = Teacher::where('school_id', $schoolId)
            ->whereHas('user', fn($q) => $q->where('is_active', true))
            ->with([
                'timetableSlots' => function ($query) {
                    $query->whereHas('timetableTemplate', fn($q) => $q->where('is_active', true))
                        ->with(['subject', 'period', 'timetableTemplate.grade']);
                },
                'grades',
                'availability'
            ]);

        if ($teacherId) {
            $query->where('id', $teacherId);
        }

        $teachers = $query->get();

        return $teachers->map(function ($teacher) {
            $slots = $teacher->timetableSlots;
            $slotsByDay = $slots->groupBy('day_of_week');
            $slotsByGrade = $slots->groupBy(fn($s) => $s->timetableTemplate->grade->name ?? 'Unknown');
            $slotsBySubject = $slots->groupBy(fn($s) => $s->subject->name ?? 'Unknown');

            return [
                'teacher_id' => $teacher->id,
                'teacher_name' => $teacher->user->name,
                'employee_number' => $teacher->employee_number,
                'total_lessons' => $slots->count(),
                'grades_assigned' => $teacher->grades->count(),
                'is_class_teacher' => $teacher->grades()->wherePivot('is_class_teacher', true)->exists(),
                'class_teacher_for' => $teacher->grades()->wherePivot('is_class_teacher', true)->first()?->name,
                'lessons_by_day' => $slotsByDay->map->count()->toArray(),
                'lessons_by_grade' => $slotsByGrade->map->count()->toArray(),
                'lessons_by_subject' => $slotsBySubject->map->count()->toArray(),
                'has_availability_set' => $teacher->availability->isNotEmpty(),
                'availability_count' => $teacher->availability->count(),
            ];
        })->values()->toArray();
    }
}
