<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Guardian;
use App\Models\Teacher;
use App\Models\User;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Document;
use App\Models\QuranTracking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            $data = array_merge($data, $this->getAdminDashboardData());
        } elseif ($user->isTeacher()) {
            $data = array_merge($data, $this->getTeacherDashboardData($user));
        } elseif ($user->isGuardian()) {
            $data = array_merge($data, $this->getGuardianDashboardData($user));
        }

        return Inertia::render('Dashboard', $data);
    }

    private function getAdminDashboardData()
    {
        // Keep existing admin dashboard code exactly as is
        $totalStudents = Student::count();
        $activeStudents = Student::where('status', 'active')->count();
        $totalGuardians = Guardian::count();
        $totalTeachers = Teacher::count();
        $totalGrades = Grade::where('status', 'active')->count();
        $totalSubjects = Subject::where('status', 'active')->count();

        // Document stats
        $now = now();
        $in30Days = now()->addDays(30);
        $documentStats = [
            'total' => Document::count(),
            'pending' => Document::where('status', 'pending')->count(),
            'verified' => Document::where('status', 'verified')->count(),
            'rejected' => Document::where('status', 'rejected')->count(),
            'expiringSoon' => Document::whereNotNull('expiry_date')
                ->whereBetween('expiry_date', [$now, $in30Days])
                ->count(),
            // 'expiring_soon' => Document::whereNotNull('expiry_date')
            //     ->whereRaw('DATEDIFF(expiry_date, CURDATE()) <= 30')
            //     ->whereRaw('DATEDIFF(expiry_date, CURDATE()) > 0')
            //     ->count(),
            
        ];

        $studentsByGrade = Grade::withCount('students')
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function ($grade) {
                return [
                    'name' => $grade->name,
                    'count' => $grade->students_count,
                    'capacity' => $grade->capacity,
                    'percentage' => $grade->capacity > 0 ? round(($grade->students_count / $grade->capacity) * 100, 1) : 0
                ];
            });

        $studentsByGender = Student::select('gender', DB::raw('count(*) as count'))
            ->where('status', 'active')
            ->groupBy('gender')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->gender => $item->count];
            });

        $recentEnrollments = Student::where('enrollment_date', '>=', now()->subDays(30))->count();

        $currentYear = now()->year;
        $totalExams = Exam::where('academic_year', $currentYear)->count();
        $examsThisTerm = Exam::where('academic_year', $currentYear)
            ->where('term', $this->getCurrentTerm())
            ->count();

        $examsWithCompletion = Exam::where('academic_year', $currentYear)
            ->with(['grade', 'subject'])
            ->withCount('results')
            ->get()
            ->map(function ($exam) {
                $studentsInGrade = $exam->grade->students()->count();
                return [
                    'id' => $exam->id,
                    'name' => $exam->name,
                    'grade' => $exam->grade->name,
                    'subject' => $exam->subject->name,
                    'completion_rate' => $studentsInGrade > 0 ? round(($exam->results_count / $studentsInGrade) * 100, 1) : 0,
                    'students_marked' => $exam->results_count,
                    'total_students' => $studentsInGrade
                ];
            });

        $topStudents = $this->getTopPerformingStudents(5);
        $recentStudents = Student::with(['guardian.user', 'grade'])->latest()->take(8)->get();

        $teachersByGrade = Grade::withCount('teachers')
            ->where('status', 'active')
            ->get()
            ->map(function ($grade) {
                $classTeacher = $grade->teachers()->wherePivot('is_class_teacher', true)->first();
                return [
                    'grade' => $grade->name,
                    'teachers_count' => $grade->teachers_count,
                    'class_teacher' => $classTeacher ? $classTeacher->user->name : 'Not Assigned'
                ];
            });

        $subjectsByCategory = Subject::select('category', DB::raw('count(*) as count'))
            ->where('status', 'active')
            ->groupBy('category')
            ->get()
            ->mapWithKeys(function ($item) {
                return [ucfirst($item->category) => $item->count];
            });

        $quickStats = [
            'students_without_guardian' => Student::whereNull('guardian_id')->count(),
            'students_without_grade' => Student::whereNull('grade_id')->count(),
            'grades_without_class_teacher' => Grade::whereDoesntHave('teachers', function ($query) {
                $query->where('grade_teacher.is_class_teacher', true);
            })->count(),
            'pending_exam_results' => $examsWithCompletion->where('completion_rate', '<', 100)->count(),
        ];

        // Quran tracking stats (only for madrasah schools)
        $quranStats = null;
        if (auth()->user()->school && auth()->user()->school->school_type === 'madrasah') {
            $quranStats = [
                'total_sessions' => QuranTracking::count(),
                'total_pages_memorized' => QuranTracking::where('reading_type', 'new_learning')->sum('pages_memorized'),
                'total_surahs_memorized' => QuranTracking::where('reading_type', 'new_learning')->sum('surahs_memorized'),
                'total_juz_memorized' => QuranTracking::where('reading_type', 'new_learning')->sum('juz_memorized'),
                'sessions_this_month' => QuranTracking::whereMonth('date', now()->month)
                    ->whereYear('date', now()->year)
                    ->count(),
                'students_tracked' => QuranTracking::distinct('student_id')->count('student_id'),
            ];
        }

        return [
            'stats' => [
                'totalStudents' => $totalStudents,
                'activeStudents' => $activeStudents,
                'totalGuardians' => $totalGuardians,
                'totalTeachers' => $totalTeachers,
                'totalGrades' => $totalGrades,
                'totalSubjects' => $totalSubjects,
                'recentEnrollments' => $recentEnrollments,
                'totalExams' => $totalExams,
                'examsThisTerm' => $examsThisTerm,
            ],
            'studentsByGrade' => $studentsByGrade,
            'studentsByGender' => $studentsByGender,
            'recentStudents' => $recentStudents,
            'topStudents' => $topStudents,
            'examsWithCompletion' => $examsWithCompletion->take(5),
            'teachersByGrade' => $teachersByGrade,
            'subjectsByCategory' => $subjectsByCategory,
            'quickStats' => $quickStats,
            'currentTerm' => $this->getCurrentTerm(),
            'currentYear' => $currentYear,
            'documentStats' => $documentStats,
            'quranStats' => $quranStats,
        ];
    }

    private function getTeacherDashboardData($user)
    {
        $teacher = $user->teacher;
        
        if (!$teacher) {
            return ['stats' => [], 'message' => 'Teacher profile not found.'];
        }

        // Get teacher's documents
        $teacherDocuments = Document::where('documentable_type', 'App\\Models\\Teacher')
            ->where('documentable_id', $teacher->id)
            ->get();

        $documentStats = [
            'total' => $teacherDocuments->count(),
            'pending' => $teacherDocuments->where('status', 'pending')->count(),
            'verified' => $teacherDocuments->where('status', 'verified')->count(),
            'rejected' => $teacherDocuments->where('status', 'rejected')->count(),
        ];
    
        $currentYear = now()->year;
        $currentTerm = $this->getCurrentTerm();
        $assignedGrades = $teacher->grades()->with(['students' => function($query) {
            $query->where('status', 'active');
        }])->get();
        
        $isClassTeacher = $teacher->grades()->wherePivot('is_class_teacher', true)->exists();
        $classTeacherGrade = $teacher->grades()->wherePivot('is_class_teacher', true)->first();
    
        // Total students across all assigned grades
        $studentsInAssignedGrades = $assignedGrades->sum(function ($grade) {
            return $grade->students->count();
        });
    
        // Get all exams created by this teacher
        $myExams = Exam::where('created_by', $user->id)
            ->where('academic_year', $currentYear)
            ->with(['grade.students', 'subject'])
            ->withCount('results')
            ->get();
    
        $examsThisTerm = $myExams->where('term', $currentTerm)->count();
    
        // Exams needing attention (incomplete marking)
        $examsNeedingAttention = $myExams->filter(function ($exam) {
            $studentsInGrade = $exam->grade->students()->where('status', 'active')->count();
            return $studentsInGrade > 0 && $exam->results_count < $studentsInGrade;
        })->map(function ($exam) {
            $stats = $exam->getCompletionStats();
            return [
                'id' => $exam->id,
                'name' => $exam->name,
                'subject' => $exam->subject,
                'grade' => $exam->grade,
                'term' => $exam->term,
                'exam_type' => $exam->exam_type,
                'exam_date' => $exam->exam_date->format('M d, Y'),
                'results_count' => $exam->results_count,
                'total_students' => $stats['total_students'],
                'completion_rate' => $stats['completion_rate'],
                'days_since_exam' => now()->diffInDays($exam->exam_date),
            ];
        })->sortByDesc('days_since_exam')->take(6)->values();
    
        // Recent students from assigned grades
        $recentStudents = Student::whereIn('grade_id', $assignedGrades->pluck('id'))
            ->with(['guardian.user', 'grade'])
            ->where('status', 'active')
            ->latest()
            ->take(10)
            ->get();
    
        // Top performing students in assigned grades
        $topStudents = $this->getTopPerformingStudents(10, $assignedGrades->pluck('id')->toArray());
    
        // Grade breakdown with detailed stats
        $myGrades = $assignedGrades->map(function ($grade) use ($teacher, $currentTerm, $currentYear) {
            $isClassTeacher = $grade->pivot->is_class_teacher ?? false;
            $activeStudents = $grade->students->where('status', 'active');
            $studentsCount = $activeStudents->count();
            
            // Get attendance rate for this grade (last 30 days)
            $attendanceRate = 0;
            if ($studentsCount > 0) {
                $totalRate = 0;
                foreach ($activeStudents as $student) {
                    $stats = $student->getAttendanceStats(
                        now()->subDays(30)->toDateString(),
                        now()->toDateString()
                    );
                    $totalRate += $stats['attendance_rate'];
                }
                $attendanceRate = round($totalRate / $studentsCount, 1);
            }
    
            // Get average performance for this grade
            $gradeAverage = ExamResult::whereHas('exam', function($query) use ($grade, $currentYear, $currentTerm) {
                $query->where('grade_id', $grade->id)
                      ->where('academic_year', $currentYear)
                      ->where('term', $currentTerm);
            })->avg('marks');
    
            return [
                'id' => $grade->id,
                'name' => $grade->name,
                'level' => $grade->level,
                'students_count' => $studentsCount,
                'capacity' => $grade->capacity,
                'is_class_teacher' => $isClassTeacher,
                'percentage' => $grade->capacity > 0 ? round(($studentsCount / $grade->capacity) * 100, 1) : 0,
                'attendance_rate' => $attendanceRate,
                'average_performance' => $gradeAverage ? round($gradeAverage, 1) : null,
                'performance_grade' => $gradeAverage ? $this->calculateGrade($gradeAverage) : null,
            ];
        });
    
        // Upcoming exams (next 14 days)
        $upcomingExams = Exam::where('created_by', $user->id)
            ->where('exam_date', '>=', now())
            ->where('exam_date', '<=', now()->addDays(14))
            ->with(['grade', 'subject'])
            ->orderBy('exam_date')
            ->take(5)
            ->get()
            ->map(function($exam) {
                return [
                    'id' => $exam->id,
                    'name' => $exam->name,
                    'subject' => $exam->subject->name,
                    'grade' => $exam->grade->name,
                    'exam_type' => $exam->exam_type,
                    'exam_date' => $exam->exam_date->format('M d, Y'),
                    'days_until' => now()->diffInDays($exam->exam_date, false),
                    'term' => $exam->term,
                ];
            });
    
        // Recent exam activity
        $recentExamActivity = ExamResult::whereHas('exam', function($query) use ($user) {
            $query->where('created_by', $user->id);
        })
        ->with(['exam.subject', 'student'])
        ->latest()
        ->take(5)
        ->get()
        ->map(function($result) {
            return [
                'student_name' => $result->student->full_name,
                'subject' => $result->exam->subject->name,
                'marks' => round($result->marks, 1),
                'grade' => $this->calculateGrade($result->marks),
                'exam_name' => $result->exam->name,
                'marked_at' => $result->created_at->diffForHumans(),
            ];
        });
    
        // Attendance summary for assigned grades (last 7 days)
        $recentAttendance = DB::table('attendances')
            ->join('students', 'attendances.student_id', '=', 'students.id')
            ->whereIn('students.grade_id', $assignedGrades->pluck('id'))
            ->where('attendances.attendance_date', '>=', now()->subDays(7))
            ->select('attendances.status', DB::raw('count(*) as count'))
            ->groupBy('attendances.status')
            ->get()
            ->mapWithKeys(function($item) {
                return [$item->status => $item->count];
            });
    
        $totalAttendanceRecords = $recentAttendance->sum();
        $attendanceSummary = [
            'present' => $recentAttendance['present'] ?? 0,
            'absent' => $recentAttendance['absent'] ?? 0,
            'late' => $recentAttendance['late'] ?? 0,
            'excused' => $recentAttendance['excused'] ?? 0,
            'total' => $totalAttendanceRecords,
            'present_rate' => $totalAttendanceRecords > 0 ? round((($recentAttendance['present'] ?? 0) / $totalAttendanceRecords) * 100, 1) : 0,
        ];
    
        // Students needing attention (low performers or poor attendance)
        $studentsNeedingAttention = Student::whereIn('grade_id', $assignedGrades->pluck('id'))
            ->where('status', 'active')
            ->with('grade')
            ->get()
            ->map(function($student) use ($currentYear, $currentTerm) {
                // Get attendance stats (last 30 days)
                $attendanceStats = $student->getAttendanceStats(
                    now()->subDays(30)->toDateString(),
                    now()->toDateString()
                );
                
                // Get term average
                $termAverage = ExamResult::where('student_id', $student->id)
                    ->whereHas('exam', function($query) use ($currentYear, $currentTerm) {
                        $query->where('academic_year', $currentYear)
                              ->where('term', $currentTerm);
                    })
                    ->avg('marks');
    
                $needsAttention = false;
                $reasons = [];
    
                if ($attendanceStats['attendance_rate'] < 75) {
                    $needsAttention = true;
                    $reasons[] = 'Low attendance (' . $attendanceStats['attendance_rate'] . '%)';
                }
    
                if ($termAverage && $termAverage < 50) {
                    $needsAttention = true;
                    $reasons[] = 'Low performance (' . round($termAverage, 1) . '%)';
                }
    
                if ($needsAttention) {
                    return [
                        'id' => $student->id,
                        'name' => $student->full_name,
                        'admission_number' => $student->admission_number,
                        'grade' => $student->grade->name,
                        'attendance_rate' => $attendanceStats['attendance_rate'],
                        'term_average' => $termAverage ? round($termAverage, 1) : null,
                        'reasons' => $reasons,
                    ];
                }
                return null;
            })
            ->filter()
            ->take(5)
            ->values();
    
        return [
            'stats' => [
                'assignedGrades' => $assignedGrades->count(),
                'totalStudents' => $studentsInAssignedGrades,
                'myExams' => $myExams->count(),
                'examsThisTerm' => $examsThisTerm,
                'pendingResults' => $examsNeedingAttention->count(),
                'upcomingExams' => $upcomingExams->count(),
                'studentsNeedingAttention' => $studentsNeedingAttention->count(),
            ],
            'isClassTeacher' => $isClassTeacher,
            'classTeacherGrade' => $classTeacherGrade ? $classTeacherGrade->name : null,
            'myGrades' => $myGrades,
            'recentStudents' => $recentStudents,
            'topStudents' => $topStudents,
            'examsNeedingAttention' => $examsNeedingAttention,
            'upcomingExams' => $upcomingExams,
            'recentExamActivity' => $recentExamActivity,
            'attendanceSummary' => $attendanceSummary,
            'studentsNeedingAttention' => $studentsNeedingAttention,
            'currentTerm' => $currentTerm,
            'currentYear' => $currentYear,
            'documentStats' => $documentStats,
        ];
    }

    private function getGuardianDashboardData($user)
    {
        $guardian = $user->guardian;

        if (!$guardian) {
            return ['message' => 'Guardian profile not found.'];
        }

        // Get guardian's and children's documents
        $studentIds = $guardian->students()->pluck('id');

        $guardianDocs = Document::where(function($query) use ($guardian, $studentIds) {
            $query->where(function($q) use ($guardian) {
                $q->where('documentable_type', 'App\\Models\\Guardian')
                  ->where('documentable_id', $guardian->id);
            })->orWhere(function($q) use ($studentIds) {
                $q->where('documentable_type', 'App\\Models\\Student')
                  ->whereIn('documentable_id', $studentIds);
            });
        })->get();

        $documentStats = [
            'total' => $guardianDocs->count(),
            'pending' => $guardianDocs->where('status', 'pending')->count(),
            'verified' => $guardianDocs->where('status', 'verified')->count(),
            'rejected' => $guardianDocs->where('status', 'rejected')->count(),
            'my_docs' => $guardianDocs->where('documentable_type', 'App\\Models\\Guardian')->count(),
            'children_docs' => $guardianDocs->where('documentable_type', 'App\\Models\\Student')->count(),
        ];

        // Quran tracking data (only for madrasah schools)
        $quranTrackingData = null;
        if ($user->school && $user->school->school_type === 'madrasah' && $studentIds->isNotEmpty()) {
            $quranTrackingData = QuranTracking::whereIn('student_id', $studentIds)
                ->with(['student', 'teacher'])
                ->orderBy('date', 'desc')
                ->take(20) // Last 20 sessions across all children
                ->get()
                ->map(function ($tracking) {
                    return [
                        'id' => $tracking->id,
                        'student_name' => $tracking->student->name,
                        'student_id' => $tracking->student_id,
                        'teacher_name' => $tracking->teacher->name ?? 'N/A',
                        'date' => $tracking->date->format('M d, Y'),
                        'reading_type' => $tracking->reading_type_label,
                        'surah_range' => $tracking->surah_range,
                        'pages_memorized' => $tracking->pages_memorized,
                        'surahs_memorized' => $tracking->surahs_memorized,
                        'juz_memorized' => $tracking->juz_memorized,
                        'difficulty' => $tracking->difficulty_label,
                        'notes' => $tracking->notes,
                    ];
                });

            // Summary stats for all children
            $quranStats = [
                'total_sessions' => QuranTracking::whereIn('student_id', $studentIds)->count(),
                'total_pages' => QuranTracking::whereIn('student_id', $studentIds)
                    ->where('reading_type', 'new_learning')
                    ->sum('pages_memorized'),
                'total_surahs' => QuranTracking::whereIn('student_id', $studentIds)
                    ->where('reading_type', 'new_learning')
                    ->sum('surahs_memorized'),
                'total_juz' => QuranTracking::whereIn('student_id', $studentIds)
                    ->where('reading_type', 'new_learning')
                    ->sum('juz_memorized'),
                'this_month' => QuranTracking::whereIn('student_id', $studentIds)
                    ->whereMonth('date', now()->month)
                    ->whereYear('date', now()->year)
                    ->count(),
            ];
        } else {
            $quranStats = null;
        }

        $students = $guardian->students()->where('status', 'active')->get();
        
        $startDate = now()->startOfMonth()->toDateString();
        $endDate = now()->toDateString();
        
        $currentYear = now()->year;
        $currentTerm = $this->getCurrentTerm();
        
        $studentsData = $students->map(function ($student) use ($startDate, $endDate, $currentYear, $currentTerm) {
            $attendanceStats = $student->getAttendanceStats($startDate, $endDate);
            
            $recentExams = ExamResult::where('student_id', $student->id)
                ->with(['exam.subject'])
                ->whereHas('exam', function ($query) use ($currentYear) {
                    $query->where('academic_year', $currentYear);
                })
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(function ($result) {
                    return [
                        'subject' => $result->exam->subject->name,
                        'marks' => round($result->marks, 2),
                        'grade' => $this->calculateGrade($result->marks),
                        'exam_type' => $result->exam->exam_type,
                        'term' => $result->exam->term,
                        'exam_name' => $result->exam->name,
                        'date' => $result->exam->exam_date,
                    ];
                });

            $allResults = ExamResult::where('student_id', $student->id)
                ->whereHas('exam', function ($query) use ($currentYear) {
                    $query->where('academic_year', $currentYear);
                })
                ->get();
            
            $overallAverage = $allResults->count() > 0 ? round($allResults->avg('marks'), 2) : null;

            $termResults = ExamResult::where('student_id', $student->id)
                ->whereHas('exam', function ($query) use ($currentYear, $currentTerm) {
                    $query->where('academic_year', $currentYear)
                          ->where('term', $currentTerm);
                })
                ->get();
            
            $termAverage = $termResults->count() > 0 ? round($termResults->avg('marks'), 2) : null;

            $subjectPerformance = ExamResult::where('student_id', $student->id)
                ->whereHas('exam', function ($query) use ($currentYear, $currentTerm) {
                    $query->where('academic_year', $currentYear)
                          ->where('term', $currentTerm);
                })
                ->with('exam.subject')
                ->get()
                ->groupBy('exam.subject_id')
                ->map(function ($results, $subjectId) {
                    $subject = $results->first()->exam->subject;
                    $average = round($results->avg('marks'), 2);
                    return [
                        'subject_id' => $subject->id,
                        'subject_name' => $subject->name,
                        'category' => $subject->category,
                        'average' => $average,
                        'grade' => $this->calculateGrade($average),
                        'exams_count' => $results->count(),
                    ];
                })
                ->values();

            $academicSubjects = $subjectPerformance->where('category', 'academic')->values();
            $islamicSubjects = $subjectPerformance->where('category', 'islamic')->values();

            $academicAverage = $academicSubjects->count() > 0 ? round($academicSubjects->avg('average'), 2) : null;
            $islamicAverage = $islamicSubjects->count() > 0 ? round($islamicSubjects->avg('average'), 2) : null;

            return [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'admission_number' => $student->admission_number,
                'class_name' => $student->grade->name ?? 'N/A',
                'gender' => $student->gender,
                'date_of_birth' => $student->date_of_birth->format('Y-m-d'),
                'age' => $student->date_of_birth->age,
                'status' => $student->status,
                'grade_id' => $student->grade_id,
                'grade_code' => $student->grade->code ?? null,
                'attendance_stats' => $attendanceStats,
                'recent_exams' => $recentExams,
                'overall_average' => $overallAverage,
                'overall_grade' => $overallAverage ? $this->calculateGrade($overallAverage) : null,
                'term_average' => $termAverage,
                'term_grade' => $termAverage ? $this->calculateGrade($termAverage) : null,
                'academic_subjects' => $academicSubjects,
                'islamic_subjects' => $islamicSubjects,
                'academic_average' => $academicAverage,
                'academic_grade' => $academicAverage ? $this->calculateGrade($academicAverage) : null,
                'islamic_average' => $islamicAverage,
                'islamic_grade' => $islamicAverage ? $this->calculateGrade($islamicAverage) : null,
                'total_exams_this_term' => $termResults->count(),
                'total_exams_this_year' => $allResults->count(),
            ];
        });
        
        return [
            'students' => $studentsData,
            'guardianInfo' => [
                'id' => $guardian->id,
                'phone_number' => $guardian->phone_number,
                'address' => $guardian->address,
                'occupation' => $guardian->occupation,
                'relationship' => $guardian->relationship,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'currentMonth' => now()->format('F Y'),
            'currentYear' => $currentYear,
            'currentTerm' => $currentTerm,
            'totalChildren' => $students->count(),
            'documentStats' => $documentStats,
            'quranTrackingData' => $quranTrackingData ?? null,
            'quranStats' => $quranStats ?? null,
        ];
    }

    private function getTopPerformingStudents($limit = 5, $gradeIds = null)
    {
        $currentYear = now()->year;
        
        $query = Student::select('students.*')
            ->join('exam_results', 'students.id', '=', 'exam_results.student_id')
            ->join('exams', 'exam_results.exam_id', '=', 'exams.id')
            ->where('exams.academic_year', $currentYear)
            ->with(['grade'])
            ->groupBy('students.id')
            ->selectRaw('AVG(exam_results.marks) as average_marks')
            ->orderByDesc('average_marks')
            ->take($limit);

        if ($gradeIds) {
            $query->whereIn('students.grade_id', $gradeIds);
        }

        return $query->get()->map(function ($student) {
            return [
                'id' => $student->id,
                'name' => $student->first_name . ' ' . $student->last_name,
                'admission_number' => $student->admission_number,
                'grade' => $student->grade->name ?? 'N/A',
                'average' => round($student->average_marks, 2),
                'grade_rubric' => $this->calculateGrade($student->average_marks),
            ];
        });
    }

    private function getCurrentTerm()
    {
        $month = now()->month;
        
        if ($month >= 1 && $month <= 4) {
            return '1';
        } elseif ($month >= 5 && $month <= 8) {
            return '2';
        } else {
            return '3';
        }
    }

    private function calculateGrade($marks)
    {
        if ($marks >= 90) return 'EE';
        if ($marks >= 75) return 'ME';
        if ($marks >= 50) return 'AE';
        return 'BE';
    }
}