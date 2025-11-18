<?php

namespace App\Http\Controllers\Api;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Guardian;
use App\Models\Grade;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TenantStatsController extends Controller
{
    /**
     * Get statistics for the specified tenant
     */
    public function index(Request $request, $tenantId): JsonResponse
    {
        try {
            // Find the tenant
            $tenant = Tenant::find($tenantId);

            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant not found',
                ], 404);
            }

            // Initialize tenancy
            tenancy()->initialize($tenant);

            Log::info('Fetching stats for tenant', ['tenant_id' => $tenantId]);
            // Get basic counts
            $totalStudents = Student::count();
            $activeStudents = Student::where('status', 'active')->count();
            $totalTeachers = Teacher::count();
            $activeTeachers = Teacher::where('status', 'active')->count();
            $totalGuardians = Guardian::count();
            $totalGrades = Grade::count();
            $activeGrades = Grade::where('status', 'active')->count();
            
            // Get user counts by role
            $totalUsers = User::count();
            $adminCount = User::where('role', 'admin')->count();
            $teacherUserCount = User::where('role', 'teacher')->count();
            $guardianUserCount = User::where('role', 'guardian')->count();
            
            // Get recent enrollments (last 30 days)
            $recentEnrollments = Student::where('enrollment_date', '>=', now()->subDays(30))->count();
            
            // Calculate database size (approximate)
            $databaseName = DB::connection()->getDatabaseName();
            $dbSize = DB::select("
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                FROM information_schema.TABLES 
                WHERE table_schema = ?
            ", [$databaseName]);
            
            $storageMb = $dbSize[0]->size_mb ?? 0;
            
            // Get gender distribution
            $maleStudents = Student::where('gender', 'male')->count();
            $femaleStudents = Student::where('gender', 'female')->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'students' => [
                        'total' => $totalStudents,
                        'active' => $activeStudents,
                        'inactive' => $totalStudents - $activeStudents,
                        'recent_enrollments' => $recentEnrollments,
                        'male' => $maleStudents,
                        'female' => $femaleStudents,
                    ],
                    'teachers' => [
                        'total' => $totalTeachers,
                        'active' => $activeTeachers,
                        'inactive' => $totalTeachers - $activeTeachers,
                    ],
                    'guardians' => [
                        'total' => $totalGuardians,
                    ],
                    'grades' => [
                        'total' => $totalGrades,
                        'active' => $activeGrades,
                    ],
                    'users' => [
                        'total' => $totalUsers,
                        'admins' => $adminCount,
                        'teachers' => $teacherUserCount,
                        'guardians' => $guardianUserCount,
                    ],
                    'system' => [
                        'storage_mb' => $storageMb,
                        'database_name' => $databaseName,
                    ],
                    'generated_at' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch tenant stats', [
                'tenant_id' => $tenantId ?? 'unknown',
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage(),
            ], 500);
        } finally {
            // End tenancy
            tenancy()->end();
        }
    }
}

