<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Guardian;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $data = [
            'role' => $user->role,
        ];

        if ($user->isAdmin()) {
            $data['stats'] = [
                'totalStudents' => Student::count(),
                'activeStudents' => Student::where('status', 'active')->count(),
                'totalGuardians' => Guardian::count(),
                'totalTeachers' => User::where('role', 'teacher')->count(),
            ];
            $data['recentStudents'] = Student::with('guardian.user')
                ->latest()
                ->take(5)
                ->get();
        } elseif ($user->isTeacher()) {
            $data['stats'] = [
                'totalStudents' => Student::count(),
                'activeStudents' => Student::where('status', 'active')->count(),
            ];
            $data['recentStudents'] = Student::with('guardian.user')
                ->latest()
                ->take(5)
                ->get();
        } elseif ($user->isGuardian()) {
            $guardian = $user->guardian;
            if ($guardian) {
                $students = $guardian->students;
                
                // Add attendance stats for each child (current month)
                $startDate = now()->startOfMonth()->toDateString();
                $endDate = now()->toDateString();
                
                $studentsWithAttendance = $students->map(function ($student) use ($startDate, $endDate) {
                    $stats = $student->getAttendanceStats($startDate, $endDate);
                    return array_merge($student->toArray(), [
                        'attendance_stats' => $stats
                    ]);
                });
                
                $data['students'] = $studentsWithAttendance;
                $data['guardianInfo'] = $guardian;
                $data['currentMonth'] = now()->format('F Y');
            }
        }

        return Inertia::render('Dashboard', $data);
    }
}