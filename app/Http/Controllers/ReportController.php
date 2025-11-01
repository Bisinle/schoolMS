<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Grade;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\ReportComment;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class ReportController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $user = $request->user();

        // For guardians, show only their children
        if ($user->isGuardian()) {
            $students = $user->guardian->students()
                ->with('grade')
                ->get();

            return Inertia::render('Reports/Index', [
                'students' => $students,
                'isGuardian' => true,
            ]);
        }

        // For admin and teachers, show all or assigned students
        $query = Student::with('grade', 'guardian.user');

        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            $query->whereIn('grade_id', $teacherGradeIds);
        }

        $students = $query
            ->when($request->search, function ($q, $search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('admission_number', 'like', "%{$search}%");
            })
            ->when($request->grade_id, function ($q, $gradeId) {
                $q->where('grade_id', $gradeId);
            })
            ->paginate(20)
            ->withQueryString();

        $grades = $user->isTeacher() 
            ? $user->teacher->grades 
            : Grade::where('status', 'active')->get();

        return Inertia::render('Reports/Index', [
            'students' => $students,
            'grades' => $grades,
            'filters' => $request->only(['search', 'grade_id']),
            'isGuardian' => false,
        ]);
    }

    public function studentReport(Request $request, Student $student)
    {
        $user = $request->user();

        // Authorization check
        if ($user->isGuardian()) {
            $childrenIds = $user->guardian->students->pluck('id')->toArray();
            if (!in_array($student->id, $childrenIds)) {
                abort(403, 'Unauthorized access to student report.');
            }
        }

        $term = $request->input('term', '1');
        $academicYear = $request->input('academic_year', now()->year);

        $student->load(['grade', 'guardian.user']);

        // Get report data
        $reportData = $this->generateReportData($student, $term, $academicYear);

        return Inertia::render('Reports/StudentReport', [
            'student' => $student,
            'term' => $term,
            'academicYear' => $academicYear,
            'reportData' => $reportData,
            'canEdit' => $user->isAdmin() || $user->isTeacher(),
        ]);
    }

    private function generateReportData($student, $term, $academicYear)
    {
        // Get all exams for this student's grade, term, and year
        $exams = Exam::where('grade_id', $student->grade_id)
            ->where('term', $term)
            ->where('academic_year', $academicYear)
            ->with(['subject', 'results' => function ($query) use ($student) {
                $query->where('student_id', $student->id);
            }])
            ->get();

        // Get subjects assigned to this grade
        $subjects = $student->grade->subjects()
            ->where('status', 'active')
            ->get();

        // Organize results by subject and exam type
        $academicSubjects = [];
        $islamicSubjects = [];

        foreach ($subjects as $subject) {
            $subjectExams = $exams->where('subject_id', $subject->id);

            $openingMarks = $subjectExams->where('exam_type', 'opening')->first()?->results->first()?->marks;
            $midtermMarks = $subjectExams->where('exam_type', 'midterm')->first()?->results->first()?->marks;
            $endTermMarks = $subjectExams->where('exam_type', 'end_term')->first()?->results->first()?->marks;

            // Calculate average based on term
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

            if ($subject->category === 'academic') {
                $academicSubjects[] = $subjectData;
            } else {
                $islamicSubjects[] = $subjectData;
            }
        }

        // Calculate overall average
        $allAverages = array_merge(
            array_column($academicSubjects, 'average'),
            array_column($islamicSubjects, 'average')
        );
        $allAverages = array_filter($allAverages, function ($avg) {
            return !is_null($avg);
        });
        $overallAverage = count($allAverages) > 0 ? round(array_sum($allAverages) / count($allAverages), 2) : null;

        // Get comments
        $comments = ReportComment::where('student_id', $student->id)
            ->where('term', $term)
            ->where('academic_year', $academicYear)
            ->first();

        return [
            'academic_subjects' => $academicSubjects,
            'islamic_subjects' => $islamicSubjects,
            'overall_average' => $overallAverage,
            'overall_rubric' => $this->getRubric($overallAverage),
            'comments' => $comments,
        ];
    }

    private function getRubric($marks)
    {
        if (is_null($marks)) {
            return null;
        }

        if ($marks >= 90) {
            return 'Exceeding Expectation';
        } elseif ($marks >= 75) {
            return 'Meeting Expectation';
        } elseif ($marks >= 50) {
            return 'Approaching Expectation';
        } else {
            return 'Below Expectation';
        }
    }

    public function generatePdf(Request $request, Student $student)
    {
        // TODO: Implement PDF generation
        // This will be implemented later with DomPDF
        return back()->with('info', 'PDF generation coming soon!');
    }
}