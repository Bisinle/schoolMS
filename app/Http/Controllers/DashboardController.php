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
                $query->wherePivot('is_class_teacher', true);
            })->count(),
            'pending_exam_results' => $examsWithCompletion->where('completion_rate', '<', 100)->count(),
        ];

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
        ];
    }

    private function getTeacherDashboardData($user)
    {
        // Keep existing teacher dashboard code exactly as is
        $teacher = $user->teacher;
        
        if (!$teacher) {
            return ['stats' => [], 'message' => 'Teacher profile not found.'];
        }

        $assignedGrades = $teacher->grades()->with('students')->get();
        $isClassTeacher = $teacher->grades()->wherePivot('is_class_teacher', true)->exists();
        $classTeacherGrade = $teacher->grades()->wherePivot('is_class_teacher', true)->first();

        $studentsInAssignedGrades = $assignedGrades->sum(function ($grade) {
            return $grade->students->count();
        });

        $currentYear = now()->year;
        $myExams = Exam::where('created_by', $user->id)
            ->where('academic_year', $currentYear)
            ->with(['grade', 'subject'])
            ->withCount('results')
            ->get();

        $examsThisTerm = $myExams->where('term', $this->getCurrentTerm())->count();

        $examsNeedingAttention = $myExams->filter(function ($exam) {
            $studentsInGrade = $exam->grade->students()->count();
            return $studentsInGrade > 0 && $exam->results_count < $studentsInGrade;
        })->take(5);

        $recentStudents = Student::whereIn('grade_id', $assignedGrades->pluck('id'))
            ->with(['guardian.user', 'grade'])
            ->latest()
            ->take(8)
            ->get();

        $topStudents = $this->getTopPerformingStudents(5, $assignedGrades->pluck('id')->toArray());

        $myGrades = $assignedGrades->map(function ($grade) use ($teacher) {
            $isClassTeacher = $grade->pivot->is_class_teacher;
            return [
                'id' => $grade->id,
                'name' => $grade->name,
                'level' => $grade->level,
                'students_count' => $grade->students->count(),
                'capacity' => $grade->capacity,
                'is_class_teacher' => $isClassTeacher,
                'percentage' => $grade->capacity > 0 ? round(($grade->students->count() / $grade->capacity) * 100, 1) : 0
            ];
        });

        return [
            'stats' => [
                'assignedGrades' => $assignedGrades->count(),
                'totalStudents' => $studentsInAssignedGrades,
                'myExams' => $myExams->count(),
                'examsThisTerm' => $examsThisTerm,
                'pendingResults' => $examsNeedingAttention->count(),
            ],
            'isClassTeacher' => $isClassTeacher,
            'classTeacherGrade' => $classTeacherGrade ? $classTeacherGrade->name : null,
            'myGrades' => $myGrades,
            'recentStudents' => $recentStudents,
            'topStudents' => $topStudents,
            'examsNeedingAttention' => $examsNeedingAttention->values(),
            'currentTerm' => $this->getCurrentTerm(),
            'currentYear' => $currentYear,
        ];
    }

    private function getGuardianDashboardData($user)
    {
        $guardian = $user->guardian;
        
        if (!$guardian) {
            return ['message' => 'Guardian profile not found.'];
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