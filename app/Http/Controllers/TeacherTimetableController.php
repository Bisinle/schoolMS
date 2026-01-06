<?php

namespace App\Http\Controllers;

use App\Models\TimetableSlot;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Carbon\Carbon;

/**
 * Teacher Timetable Controller
 * 
 * Handles timetable views for teachers with strict data partitioning:
 * - Query-level filtering (not UI-level)
 * - Loads slots only, not full templates
 * - Scoped by teacher_id + school_id + published status
 * - Teachers see ONLY their assigned lessons
 */
class TeacherTimetableController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display the teacher's personal timetable
     * 
     * Data Partitioning Rules:
     * 1. Only published timetables
     * 2. Only slots assigned to this teacher
     * 3. Only from teacher's school
     * 4. Grouped by day/period for display
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Ensure user is a teacher
        if (!$user->isTeacher() || !$user->teacher) {
            abort(403, 'Access denied. Teachers only.');
        }

        $teacher = $user->teacher;
        $schoolId = $user->school_id;

        // Query-level filtering: Load ONLY this teacher's slots from published templates
        // Support both traditional (period_id) and blueprint-generated (sequence_order) timetables
        $slots = TimetableSlot::query()
            ->where('teacher_id', $teacher->id)
            ->where('school_id', $schoolId)
            ->where(function ($query) {
                // Include teachable lesson slots
                $query->where(function ($q) {
                    $q->where('is_teachable', true)
                      ->where('slot_type', 'lesson');
                })
                // Also include traditional lesson slots
                ->orWhere('slot_type', TimetableSlot::TYPE_LESSON);
            })
            ->whereHas('template', function ($query) {
                $query->where('status', 'published');
            })
            ->with([
                'subject:id,name,code,category,school_id',
                'period:id,name,start_time,end_time,order,school_id',
                'room:id,name,code,capacity,school_id',
                'template.grade:id,name,school_id',
                'template.academicTerm:id,name,school_id',
                'teacher.user:id,name',
            ])
            ->get()
            ->sortBy(function ($slot) {
                // Sort by day of week (convert to number) and then by start time
                $dayOrder = [
                    'monday' => 1,
                    'tuesday' => 2,
                    'wednesday' => 3,
                    'thursday' => 4,
                    'friday' => 5,
                    'saturday' => 6,
                    'sunday' => 7,
                ];
                $dayNum = $dayOrder[$slot->day_of_week] ?? 99;
                $startTime = $slot->start_time ?? ($slot->period ? $slot->period->start_time : '99:99');
                return $dayNum . '-' . $startTime;
            })
            ->values();

        // Group slots by grade and day for easy display
        $timetableData = $this->groupSlotsByGradeAndDay($slots);

        // Get teacher's teaching statistics
        $stats = $this->getTeacherStats($teacher, $schoolId);

        // Get today's lessons
        $today = strtolower(Carbon::now()->format('l'));
        $todayLessons = $slots->where('day_of_week', $today)->values();

        // Get upcoming lessons (next 3 days)
        $upcomingDays = [];
        for ($i = 1; $i <= 3; $i++) {
            $upcomingDays[] = strtolower(Carbon::now()->addDays($i)->format('l'));
        }
        $upcomingLessons = $slots->whereIn('day_of_week', $upcomingDays)
            ->groupBy('day_of_week');

        return Inertia::render('Teacher/MyTimetable', [
            'timetable' => $timetableData,
            'stats' => $stats,
            'teacher' => [
                'id' => $teacher->id,
                'name' => $user->name,
                'employee_number' => $teacher->employee_number,
                'subject_specialization' => $teacher->subject_specialization,
            ],
            'todayLessons' => $todayLessons,
            'upcomingLessons' => $upcomingLessons,
            'currentDay' => $today,
        ]);
    }

    /**
     * Group slots by grade and day for easy display
     *
     * @param \Illuminate\Support\Collection $slots
     * @return array
     */
    private function groupSlotsByGradeAndDay($slots)
    {
        $grouped = [];

        foreach ($slots as $slot) {
            // Skip slots with missing required relationships
            if (!$slot->subject || !$slot->template || !$slot->template->grade) {
                continue;
            }

            $gradeName = $slot->template->grade->name;
            $day = $slot->day_of_week;

            if (!isset($grouped[$gradeName])) {
                $grouped[$gradeName] = [];
            }

            if (!isset($grouped[$gradeName][$day])) {
                $grouped[$gradeName][$day] = [];
            }

            $grouped[$gradeName][$day][] = [
                'id' => $slot->id,
                'day' => $slot->day_of_week,
                'start_time' => $slot->start_time ?? ($slot->period ? $slot->period->start_time : null),
                'end_time' => $slot->end_time ?? ($slot->period ? $slot->period->end_time : null),
                'duration_minutes' => $slot->duration_minutes,
                'sequence_order' => $slot->sequence_order,
                'period' => $slot->period ? [
                    'id' => $slot->period->id,
                    'name' => $slot->period->name,
                    'start_time' => $slot->period->start_time,
                    'end_time' => $slot->period->end_time,
                ] : null,
                'subject' => [
                    'id' => $slot->subject->id,
                    'name' => $slot->subject->name,
                    'code' => $slot->subject->code,
                    'category' => $slot->subject->category,
                ],
                'grade' => [
                    'id' => $slot->template->grade->id,
                    'name' => $slot->template->grade->name,
                ],
                'room' => $slot->room ? [
                    'id' => $slot->room->id,
                    'room_number' => $slot->room->name, // Using 'name' column from rooms table
                    'capacity' => $slot->room->capacity,
                ] : null,
            ];
        }

        return $grouped;
    }

    /**
     * Get teacher's teaching statistics
     *
     * @param Teacher $teacher
     * @param int $schoolId
     * @return array
     */
    private function getTeacherStats(Teacher $teacher, int $schoolId)
    {
        // Count total lessons per week (only published templates)
        // Support both traditional and blueprint-generated timetables
        $totalLessons = TimetableSlot::where('teacher_id', $teacher->id)
            ->where('school_id', $schoolId)
            ->where(function ($query) {
                $query->where(function ($q) {
                    $q->where('is_teachable', true)
                      ->where('slot_type', 'lesson');
                })
                ->orWhere('slot_type', TimetableSlot::TYPE_LESSON);
            })
            ->whereHas('template', function ($query) {
                $query->where('status', 'published');
            })
            ->count();

        // Count unique subjects taught
        $uniqueSubjects = TimetableSlot::where('teacher_id', $teacher->id)
            ->where('school_id', $schoolId)
            ->where(function ($query) {
                $query->where(function ($q) {
                    $q->where('is_teachable', true)
                      ->where('slot_type', 'lesson');
                })
                ->orWhere('slot_type', TimetableSlot::TYPE_LESSON);
            })
            ->whereHas('template', function ($query) {
                $query->where('status', 'published');
            })
            ->distinct('subject_id')
            ->count('subject_id');

        // Count unique grades taught
        $uniqueGrades = TimetableSlot::where('teacher_id', $teacher->id)
            ->where('school_id', $schoolId)
            ->whereHas('template', function ($query) {
                $query->where('status', 'published');
            })
            ->with('template.grade')
            ->get()
            ->pluck('template.grade.id')
            ->unique()
            ->count();

        return [
            'total_lessons_per_week' => $totalLessons,
            'subjects_teaching' => $uniqueSubjects,
            'grades_teaching' => $uniqueGrades,
        ];
    }
}

