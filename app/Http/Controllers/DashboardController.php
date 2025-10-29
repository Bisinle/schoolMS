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
                $data['students'] = $guardian->students;
                $data['guardianInfo'] = $guardian;
            }
        }

        return Inertia::render('Dashboard', $data);
    }
}