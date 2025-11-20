<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Guardian;
use App\Models\Document;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // Get statistics
        $totalSchools = School::count();
        $activeSchools = School::where('is_active', true)->count();
        $suspendedSchools = School::where('status', 'suspended')->count();
        $trialSchools = School::where('status', 'trial')->count();

        // Total users across all schools
        $totalUsers = User::whereNotNull('school_id')->count();

        // Total students across all schools (bypass global scope for super admin)
        $totalStudents = Student::withoutGlobalScopes()->count();

        // Total teachers across all schools (bypass global scope)
        $totalTeachers = Teacher::withoutGlobalScopes()->count();

        // Total guardians across all schools (bypass global scope)
        $totalGuardians = Guardian::withoutGlobalScopes()->count();

        // Total documents across all schools (bypass global scope)
        $totalDocuments = Document::withoutGlobalScopes()->count();

        // Total grades across all schools (bypass global scope)
        $totalGrades = Grade::withoutGlobalScopes()->count();

        // Total subjects across all schools (bypass global scope)
        $totalSubjects = Subject::withoutGlobalScopes()->count();
        
        // Recently active schools (schools with recent activity)
        $recentlyActiveSchools = School::select('schools.*')
            ->join('activity_logs', 'schools.id', '=', 'activity_logs.school_id')
            ->where('activity_logs.created_at', '>=', now()->subDays(7))
            ->groupBy('schools.id')
            ->orderByRaw('MAX(activity_logs.created_at) DESC')
            ->limit(5)
            ->get();
        
        // Latest activities across all schools
        $latestActivities = ActivityLog::with(['user:id,name,email,school_id', 'school:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
        
        // Schools by status
        $schoolsByStatus = School::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');
        
        // Monthly growth (schools created per month)
        $monthlyGrowth = School::select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('count(*) as count')
            )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();
        
        // Top schools by student count
        $topSchools = School::orderBy('current_student_count', 'desc')
            ->limit(5)
            ->get(['id', 'name', 'current_student_count', 'status', 'is_active']);

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => [
                'totalSchools' => $totalSchools,
                'activeSchools' => $activeSchools,
                'suspendedSchools' => $suspendedSchools,
                'trialSchools' => $trialSchools,
                'totalUsers' => $totalUsers,
                'totalStudents' => $totalStudents,
                'totalTeachers' => $totalTeachers,
                'totalGuardians' => $totalGuardians,
                'totalDocuments' => $totalDocuments,
                'totalGrades' => $totalGrades,
                'totalSubjects' => $totalSubjects,
            ],
            'recentlyActiveSchools' => $recentlyActiveSchools,
            'latestActivities' => $latestActivities,
            'schoolsByStatus' => $schoolsByStatus,
            'monthlyGrowth' => $monthlyGrowth,
            'topSchools' => $topSchools,
        ]);
    }
}

