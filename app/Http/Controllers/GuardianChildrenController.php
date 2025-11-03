<?php

namespace App\Http\Controllers;

use App\Models\ExamResult;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GuardianChildrenController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if (!$user->isGuardian()) {
            abort(403, 'Unauthorized access.');
        }

        $guardian = $user->guardian;
        $students = $guardian->students()->where('status', 'active')->get();
        
        $currentYear = now()->year;
        $currentTerm = $this->getCurrentTerm();
        
        $studentsData = $students->map(function ($student) use ($currentYear, $currentTerm) {
            // Get recent exam results (last 10 exams)
            $recentExams = ExamResult::where('student_id', $student->id)
                ->with(['exam.subject'])
                ->whereHas('exam', function ($query) use ($currentYear) {
                    $query->where('academic_year', $currentYear);
                })
                ->orderBy('created_at', 'desc')
                ->take(10)
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

            // Calculate overall average for current year
            $allResults = ExamResult::where('student_id', $student->id)
                ->whereHas('exam', function ($query) use ($currentYear) {
                    $query->where('academic_year', $currentYear);
                })
                ->get();
            
            $overallAverage = $allResults->count() > 0 ? round($allResults->avg('marks'), 2) : null;

            // Calculate current term average
            $termResults = ExamResult::where('student_id', $student->id)
                ->whereHas('exam', function ($query) use ($currentYear, $currentTerm) {
                    $query->where('academic_year', $currentYear)
                          ->where('term', $currentTerm);
                })
                ->get();
            
            $termAverage = $termResults->count() > 0 ? round($termResults->avg('marks'), 2) : null;

            // Get subject-wise performance
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

            // Separate academic and islamic subjects
            $academicSubjects = $subjectPerformance->where('category', 'academic')->values();
            $islamicSubjects = $subjectPerformance->where('category', 'islamic')->values();

            // Calculate category averages
            $academicAverage = $academicSubjects->count() > 0 ? round($academicSubjects->avg('average'), 2) : null;
            $islamicAverage = $islamicSubjects->count() > 0 ? round($islamicSubjects->avg('average'), 2) : null;

            return [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'admission_number' => $student->admission_number,
                'class_name' => $student->grade->name ?? 'N/A',
                'gender' => $student->gender,
                'status' => $student->status,
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

        return Inertia::render('Guardians/Children', [
            'students' => $studentsData,
            'currentYear' => $currentYear,
            'currentTerm' => $currentTerm,
        ]);
    }

    private function getCurrentTerm()
    {
        $month = now()->month;
        if ($month >= 1 && $month <= 4) return '1';
        elseif ($month >= 5 && $month <= 8) return '2';
        else return '3';
    }

    private function calculateGrade($marks)
    {
        if ($marks >= 90) return 'EE';
        if ($marks >= 75) return 'ME';
        if ($marks >= 50) return 'AE';
        return 'BE';
    }
}