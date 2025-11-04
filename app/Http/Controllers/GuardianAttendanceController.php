<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class GuardianAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if (!$user->isGuardian()) {
            abort(403, 'Unauthorized access.');
        }

        $guardian = $user->guardian;
        $students = $guardian->students()->where('status', 'active')->get();
        
        $startDate = now()->startOfMonth()->toDateString();
        $endDate = now()->toDateString();
        $currentMonth = now()->format('F Y');
        
        $studentsData = $students->map(function ($student) use ($startDate, $endDate) {
            // Get attendance stats for current month
            $attendanceStats = $student->getAttendanceStats($startDate, $endDate);
            
            // Get detailed attendance records for current month
            $attendanceRecords = $student->attendances()
                ->whereBetween('attendance_date', [$startDate, $endDate])
                ->orderBy('attendance_date', 'desc')
                ->get()
                ->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'date' => $record->date,
                        'status' => $record->status,
                        'remarks' => $record->remarks,
                        'marked_by' => $record->markedBy->name ?? 'N/A',
                        'marked_at' => $record->created_at->format('Y-m-d H:i:s'),
                    ];
                });
            
            return [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'admission_number' => $student->admission_number,
                'class_name' => $student->grade->name ?? 'N/A',
                'attendance_stats' => $attendanceStats,
                'attendance_records' => $attendanceRecords,
            ];
        });

        return Inertia::render('Guardians/Attendance', [
            'students' => $studentsData,
            'currentMonth' => $currentMonth,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }
}