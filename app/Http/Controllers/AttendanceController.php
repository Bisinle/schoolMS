<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display attendance dashboard
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Attendance::class);

        $user = $request->user();
        $selectedDate = $request->input('date', now()->toDateString());
        $selectedGradeId = $request->input('grade_id');

        // Get grades based on user role (including Unassigned)
        if ($user->isTeacher()) {
            $grades = $user->teacher->grades;
        } else {
            $grades = Grade::where('status', 'active')
                ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
                ->orderBy('level')
                ->orderBy('name')
                ->get();
        }

        // If no grade selected, select first available grade
        if (!$selectedGradeId && $grades->isNotEmpty()) {
            $selectedGradeId = $grades->first()->id;
        }

        // Get attendance data if grade is selected
        $attendanceData = null;
        if ($selectedGradeId) {
            $attendanceData = $this->getAttendanceData($selectedGradeId, $selectedDate);
        }

        return Inertia::render('Attendance/Index', [
            'grades' => $grades,
            'selectedGradeId' => $selectedGradeId,
            'selectedDate' => $selectedDate,
            'attendanceData' => $attendanceData,
            'canMarkAttendance' => $user->isAdmin() || $user->isTeacher(),
        ]);
    }

    /**
     * Mark attendance for a grade
     */
    public function mark(Request $request)
    {
        $this->authorize('create', Attendance::class);

        $validated = $request->validate([
            'grade_id' => 'required|exists:grades,id',
            'attendance_date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:students,id',
            'attendances.*.status' => 'required|in:present,absent,late,excused',
            'attendances.*.remarks' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        // Verify teacher can mark attendance for this grade
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            if (!in_array($validated['grade_id'], $teacherGradeIds)) {
                return back()->withErrors(['error' => 'You are not authorized to mark attendance for this grade.']);
            }
        }

        // Mark attendance for each student
        foreach ($validated['attendances'] as $attendanceData) {
            Attendance::updateOrCreate(
                [
                    'student_id' => $attendanceData['student_id'],
                    'attendance_date' => $validated['attendance_date'],
                ],
                [
                    'grade_id' => $validated['grade_id'],
                    'marked_by' => $user->id,
                    'status' => $attendanceData['status'],
                    'remarks' => $attendanceData['remarks'] ?? null,
                ]
            );
        }

        return back()->with('success', 'Attendance marked successfully.');
    }

    /**
     * View attendance reports
     */
    public function reports(Request $request)
    {
        $this->authorize('viewAny', Attendance::class);

        $user = $request->user();
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());
        $gradeId = $request->input('grade_id');

        // Get grades based on user role (including Unassigned)
        if ($user->isTeacher()) {
            $grades = $user->teacher->grades;
        } else {
            $grades = Grade::where('status', 'active')
                ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
                ->orderBy('level')
                ->orderBy('name')
                ->get();
        }

        $reportData = null;
        if ($gradeId) {
            $reportData = $this->getAttendanceReport($gradeId, $startDate, $endDate);
        }

        return Inertia::render('Attendance/Reports', [
            'grades' => $grades,
            'selectedGradeId' => $gradeId,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'reportData' => $reportData,
        ]);
    }

    /**
     * View student attendance history
     */
    public function studentHistory(Request $request, Student $student)
    {
        // Check authorization
        $user = $request->user();
        
        if ($user->isGuardian()) {
            $childrenIds = $user->guardian->students->pluck('id')->toArray();
            if (!in_array($student->id, $childrenIds)) {
                abort(403, 'Unauthorized access to student attendance.');
            }
        } elseif ($user->isTeacher()) {
            $this->authorize('viewAny', Attendance::class);
        } else {
            $this->authorize('viewAny', Attendance::class);
        }

        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $student->load(['grade', 'guardian.user']);

        $attendances = Attendance::forStudent($student->id)
            ->forDateRange($startDate, $endDate)
            ->with(['markedBy'])
            ->orderBy('attendance_date', 'desc')
            ->paginate(20)
            ->withQueryString();

        $stats = $student->getAttendanceStats($startDate, $endDate);

        return Inertia::render('Attendance/StudentHistory', [
            'student' => $student,
            'attendances' => $attendances,
            'stats' => $stats,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

    /**
     * Helper: Get attendance data for a specific grade and date
     */
    private function getAttendanceData($gradeId, $date)
    {
        $grade = Grade::with(['students' => function ($query) {
            $query->where('status', 'active')
                  ->orderBy('first_name')
                  ->orderBy('last_name');
        }])->findOrFail($gradeId);

        $students = $grade->students;

        // Get existing attendance records for this date
        $existingAttendance = Attendance::forGrade($gradeId)
            ->forDate($date)
            ->get()
            ->keyBy('student_id');

        // Build attendance data
        $attendanceRecords = $students->map(function ($student) use ($existingAttendance) {
            $attendance = $existingAttendance->get($student->id);
            
            return [
                'student_id' => $student->id,
                'student_name' => $student->first_name . ' ' . $student->last_name,
                'admission_number' => $student->admission_number,
                'status' => $attendance->status ?? 'present',
                'remarks' => $attendance->remarks ?? '',
                'already_marked' => $attendance !== null,
            ];
        });

        return [
            'grade' => [
                'id' => $grade->id,
                'name' => $grade->name,
                'level' => $grade->level,
            ],
            'students' => $attendanceRecords,
            'total_students' => $students->count(),
            'marked_count' => $existingAttendance->count(),
        ];
    }

    /**
     * Helper: Get attendance report for a grade
     */
    private function getAttendanceReport($gradeId, $startDate, $endDate)
    {
        $grade = Grade::with(['students' => function ($query) {
            $query->where('status', 'active')
                  ->orderBy('first_name')
                  ->orderBy('last_name');
        }])->findOrFail($gradeId);

        $students = $grade->students;

        $reportData = $students->map(function ($student) use ($startDate, $endDate) {
            $stats = $student->getAttendanceStats($startDate, $endDate);
            
            return [
                'student_id' => $student->id,
                'student_name' => $student->first_name . ' ' . $student->last_name,
                'admission_number' => $student->admission_number,
                'total_days' => $stats['total'],
                'present' => $stats['present'],
                'absent' => $stats['absent'],
                'late' => $stats['late'],
                'excused' => $stats['excused'],
                'attendance_rate' => $stats['attendance_rate'],
            ];
        });

        // Calculate grade summary
        $totalDays = $reportData->sum('total_days');
        $totalPresent = $reportData->sum('present');
        $gradeAttendanceRate = $totalDays > 0 ? round(($totalPresent / $totalDays) * 100, 1) : 0;

        return [
            'grade' => [
                'id' => $grade->id,
                'name' => $grade->name,
                'level' => $grade->level,
            ],
            'students' => $reportData,
            'summary' => [
                'total_students' => $students->count(),
                'total_days' => $totalDays,
                'total_present' => $totalPresent,
                'grade_attendance_rate' => $gradeAttendanceRate,
            ],
        ];
    }
}