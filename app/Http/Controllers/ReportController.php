<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Grade;
use App\Models\Exam;
use App\Models\ReportComment;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $user = $request->user();

        // For guardians, show only their children
        if ($user->isGuardian()) {
            $students = $user->guardian->students()
                ->with('grade', 'guardian.user')
                ->where('status', 'active')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get();

            // Convert to array for consistency
            return Inertia::render('Reports/Index', [
                'students' => [
                    'data' => $students,
                    'total' => $students->count(),
                    'per_page' => $students->count(),
                    'current_page' => 1,
                ],
                'grades' => [],
                'filters' => [],
                'isGuardian' => true,
                'currentYear' => now()->year,
            ]);
        }

        // For admin and teachers, show all or assigned students
        $query = Student::with('grade', 'guardian.user');

        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            $query->whereIn('grade_id', $teacherGradeIds);
        }

        $students = $query
            ->where('status', 'active')
            ->when($request->search, function ($q, $search) {
                $q->where(function($query) use ($search) {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('admission_number', 'like', "%{$search}%");
                });
            })
            ->when($request->grade_id, function ($q, $gradeId) {
                $q->where('grade_id', $gradeId);
            })
            ->when($request->gender, function ($q, $gender) {
                $q->where('gender', $gender);
            })
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate(20)
            ->withQueryString();

        $grades = $user->isTeacher() 
            ? $user->teacher->grades 
            : Grade::where('status', 'active')->orderBy('name')->get();

        return Inertia::render('Reports/Index', [
            'students' => $students,
            'grades' => $grades,
            'filters' => $request->only(['search', 'grade_id', 'gender']),
            'isGuardian' => false,
            'currentYear' => now()->year,
        ]);
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'term' => 'required|in:1,2,3',
            'academic_year' => 'required|integer|min:2020|max:2100',
        ]);

        $student = Student::with(['grade.subjects', 'guardian.user'])->findOrFail($validated['student_id']);
        
        // Authorization check
        $user = $request->user();
        if ($user->isGuardian()) {
            $childrenIds = $user->guardian->students->pluck('id')->toArray();
            if (!in_array($student->id, $childrenIds)) {
                abort(403, 'Unauthorized access to student report.');
            }
        }

        $term = $validated['term'];
        $academicYear = $validated['academic_year'];

        // Generate report data
        $reportData = $this->generateReportData($student, $term, $academicYear);

        // Check if user can edit comments
        $isClassTeacher = false;
        if ($user->isTeacher()) {
            $isClassTeacher = $user->teacher->grades()
                ->where('grades.id', $student->grade_id)
                ->wherePivot('is_class_teacher', true)
                ->exists();
        }

        return Inertia::render('Reports/ReportCard', [
            'student' => $student,
            'term' => $term,
            'academicYear' => $academicYear,
            'reportData' => $reportData,
            'canEditTeacherComment' => $user->isAdmin() || $isClassTeacher,
            'canEditHeadteacherComment' => $user->isAdmin(),
            'isGuardian' => $user->isGuardian(),
        ]);
    }

    private function generateReportData($student, $term, $academicYear)
    {
        // Get subjects assigned to this grade
        $subjects = $student->grade->subjects()
            ->where('status', 'active')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        // Organize results by subject
        $academicSubjects = [];
        $islamicSubjects = [];

        foreach ($subjects as $subject) {
            if ($term == '3') {
                // Term 3: Show Term 1 Average, Term 2 Average, Term 3 End Result
                
                // Get Term 1 exams and calculate average
                $term1Exams = Exam::where('grade_id', $student->grade_id)
                    ->where('subject_id', $subject->id)
                    ->where('term', '1')
                    ->where('academic_year', $academicYear)
                    ->with(['results' => function ($query) use ($student) {
                        $query->where('student_id', $student->id);
                    }])
                    ->get();

                $term1Marks = [];
                foreach ($term1Exams as $exam) {
                    if ($exam->results->isNotEmpty()) {
                        $term1Marks[] = $exam->results->first()->marks;
                    }
                }
                $term1Average = count($term1Marks) > 0 ? round(array_sum($term1Marks) / count($term1Marks), 2) : null;

                // Get Term 2 exams and calculate average
                $term2Exams = Exam::where('grade_id', $student->grade_id)
                    ->where('subject_id', $subject->id)
                    ->where('term', '2')
                    ->where('academic_year', $academicYear)
                    ->with(['results' => function ($query) use ($student) {
                        $query->where('student_id', $student->id);
                    }])
                    ->get();

                $term2Marks = [];
                foreach ($term2Exams as $exam) {
                    if ($exam->results->isNotEmpty()) {
                        $term2Marks[] = $exam->results->first()->marks;
                    }
                }
                $term2Average = count($term2Marks) > 0 ? round(array_sum($term2Marks) / count($term2Marks), 2) : null;

                // Get Term 3 End-Term exam result
                $term3Exam = Exam::where('grade_id', $student->grade_id)
                    ->where('subject_id', $subject->id)
                    ->where('term', '3')
                    ->where('academic_year', $academicYear)
                    ->where('exam_type', 'end_term')
                    ->with(['results' => function ($query) use ($student) {
                        $query->where('student_id', $student->id);
                    }])
                    ->first();

                $term3Result = $term3Exam && $term3Exam->results->isNotEmpty() 
                    ? $term3Exam->results->first()->marks 
                    : null;

                // Calculate overall average for this subject
                $marks = array_filter([$term1Average, $term2Average, $term3Result], function ($mark) {
                    return !is_null($mark);
                });

                $average = count($marks) > 0 ? round(array_sum($marks) / count($marks), 2) : null;

                $subjectData = [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'term1_average' => $term1Average,
                    'term2_average' => $term2Average,
                    'term3_result' => $term3Result,
                    'average' => $average,
                    'rubric' => $this->getRubric($average),
                ];

            } else {
                // Term 1 & 2: Show Opening, Midterm, End-Term
                
                $openingExam = Exam::where('grade_id', $student->grade_id)
                    ->where('subject_id', $subject->id)
                    ->where('term', $term)
                    ->where('academic_year', $academicYear)
                    ->where('exam_type', 'opening')
                    ->with(['results' => function ($query) use ($student) {
                        $query->where('student_id', $student->id);
                    }])
                    ->first();

                $midtermExam = Exam::where('grade_id', $student->grade_id)
                    ->where('subject_id', $subject->id)
                    ->where('term', $term)
                    ->where('academic_year', $academicYear)
                    ->where('exam_type', 'midterm')
                    ->with(['results' => function ($query) use ($student) {
                        $query->where('student_id', $student->id);
                    }])
                    ->first();

                $endTermExam = Exam::where('grade_id', $student->grade_id)
                    ->where('subject_id', $subject->id)
                    ->where('term', $term)
                    ->where('academic_year', $academicYear)
                    ->where('exam_type', 'end_term')
                    ->with(['results' => function ($query) use ($student) {
                        $query->where('student_id', $student->id);
                    }])
                    ->first();

                // Get marks from results
                $openingMarks = $openingExam && $openingExam->results->isNotEmpty() 
                    ? $openingExam->results->first()->marks 
                    : null;
                
                $midtermMarks = $midtermExam && $midtermExam->results->isNotEmpty() 
                    ? $midtermExam->results->first()->marks 
                    : null;
                
                $endTermMarks = $endTermExam && $endTermExam->results->isNotEmpty() 
                    ? $endTermExam->results->first()->marks 
                    : null;

                // Calculate average
                $marks = array_filter([$openingMarks, $midtermMarks, $endTermMarks], function ($mark) {
                    return !is_null($mark);
                });

                $average = count($marks) > 0 ? round(array_sum($marks) / count($marks), 2) : null;

                $subjectData = [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'opening' => $openingMarks,
                    'midterm' => $midtermMarks,
                    'end_term' => $endTermMarks,
                    'average' => $average,
                    'rubric' => $this->getRubric($average),
                ];
            }

            if ($subject->category === 'academic') {
                $academicSubjects[] = $subjectData;
            } else {
                $islamicSubjects[] = $subjectData;
            }
        }

        // Calculate academic average
        $academicAverages = array_column($academicSubjects, 'average');
        $academicAverages = array_filter($academicAverages, function ($avg) {
            return !is_null($avg);
        });
        $academicAverage = count($academicAverages) > 0 ? round(array_sum($academicAverages) / count($academicAverages), 2) : null;

        // Calculate islamic average
        $islamicAverages = array_column($islamicSubjects, 'average');
        $islamicAverages = array_filter($islamicAverages, function ($avg) {
            return !is_null($avg);
        });
        $islamicAverage = count($islamicAverages) > 0 ? round(array_sum($islamicAverages) / count($islamicAverages), 2) : null;

        // Calculate overall average
        $allAverages = array_merge($academicAverages, $islamicAverages);
        $overallAverage = count($allAverages) > 0 ? round(array_sum($allAverages) / count($allAverages), 2) : null;

        // Get comments
        $comments = ReportComment::where('student_id', $student->id)
            ->where('term', $term)
            ->where('academic_year', $academicYear)
            ->first();

        return [
            'academic_subjects' => $academicSubjects,
            'islamic_subjects' => $islamicSubjects,
            'academic_average' => $academicAverage,
            'academic_rubric' => $this->getRubric($academicAverage),
            'islamic_average' => $islamicAverage,
            'islamic_rubric' => $this->getRubric($islamicAverage),
            'overall_average' => $overallAverage,
            'overall_rubric' => $this->getRubric($overallAverage),
            'comments' => $comments,
            'is_term3' => $term == '3',
        ];
    }

    private function getRubric($marks)
    {
        if (is_null($marks)) {
            return null;
        }

        if ($marks >= 90) {
            return 'EE';
        } elseif ($marks >= 75) {
            return 'ME';
        } elseif ($marks >= 50) {
            return 'AE';
        } else {
            return 'BE';
        }
    }

    public function saveComment(Request $request, Student $student)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'term' => 'required|in:1,2,3',
            'academic_year' => 'required|integer',
            'comment_type' => 'required|in:teacher,headteacher',
            'comment' => 'required|string|max:1000',
        ]);

        // Check permissions
        if ($validated['comment_type'] === 'teacher') {
            if (!$user->isAdmin()) {
                $isClassTeacher = $user->teacher->grades()
                    ->where('grades.id', $student->grade_id)
                    ->wherePivot('is_class_teacher', true)
                    ->exists();

                if (!$isClassTeacher) {
                    abort(403, 'Only class teachers can add teacher comments.');
                }
            }
        }

        if ($validated['comment_type'] === 'headteacher' && !$user->isAdmin()) {
            abort(403, 'Only administrators can add headteacher comments.');
        }

        ReportComment::updateOrCreate(
            [
                'student_id' => $student->id,
                'term' => $validated['term'],
                'academic_year' => $validated['academic_year'],
            ],
            [
                $validated['comment_type'] . '_comment' => $validated['comment'],
            ]
        );

        return back()->with('success', ucfirst($validated['comment_type']) . ' comment saved successfully.');
    }

    public function lockComment(Request $request, Student $student)
    {
        $user = $request->user();

        $validated = $request->validate([
            'term' => 'required|in:1,2,3',
            'academic_year' => 'required|integer',
            'comment_type' => 'required|in:teacher,headteacher',
        ]);

        $reportComment = ReportComment::where('student_id', $student->id)
            ->where('term', $validated['term'])
            ->where('academic_year', $validated['academic_year'])
            ->firstOrFail();

        // Check permissions
        if ($validated['comment_type'] === 'teacher') {
            if (!$user->isAdmin()) {
                $isClassTeacher = $user->teacher->grades()
                    ->where('grades.id', $student->grade_id)
                    ->wherePivot('is_class_teacher', true)
                    ->exists();

                if (!$isClassTeacher) {
                    abort(403);
                }
            }

            $reportComment->update([
                'teacher_comment_locked_at' => now(),
                'teacher_locked_by' => $user->id,
            ]);
        } else {
            if (!$user->isAdmin()) {
                abort(403);
            }

            $reportComment->update([
                'headteacher_comment_locked_at' => now(),
                'headteacher_locked_by' => $user->id,
            ]);
        }

        return back()->with('success', ucfirst($validated['comment_type']) . ' comment locked successfully.');
    }
}