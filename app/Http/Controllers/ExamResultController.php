<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class ExamResultController extends Controller
{
    use AuthorizesRequests;

    public function index(Exam $exam)
    {
        $this->authorize('view', $exam);

        $exam->load(['grade', 'subject']);

        // Get all students in the grade
        $students = Student::where('grade_id', $exam->grade_id)
            ->where('status', 'active')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        // Get existing results for this exam
        $existingResults = ExamResult::where('exam_id', $exam->id)
            ->with('student')
            ->get()
            ->keyBy('student_id');

        // Merge students with their results
        $studentsWithResults = $students->map(function ($student) use ($existingResults) {
            $result = $existingResults->get($student->id);
            return [
                'id' => $student->id,
                'admission_number' => $student->admission_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'full_name' => $student->full_name,
                'result_id' => $result?->id,
                'marks' => $result?->marks,
            ];
        });

        return Inertia::render('ExamResults/Index', [
            'exam' => $exam,
            'students' => $studentsWithResults,
        ]);
    }

    public function store(Request $request, Exam $exam)
    {
        $this->authorize('create', ExamResult::class);

        $validated = $request->validate([
            'results' => 'required|array',
            'results.*.student_id' => 'required|exists:students,id',
            'results.*.marks' => 'required|numeric|min:0|max:100',
        ]);

        foreach ($validated['results'] as $resultData) {
            ExamResult::updateOrCreate(
                [
                    'exam_id' => $exam->id,
                    'student_id' => $resultData['student_id'],
                ],
                [
                    'marks' => $resultData['marks'],
                ]
            );
        }

        return back()->with('success', 'Exam results saved successfully.');
    }

    public function update(Request $request, ExamResult $examResult)
    {
        $this->authorize('update', $examResult);

        $validated = $request->validate([
            'marks' => 'required|numeric|min:0|max:100',
        ]);

        $examResult->update($validated);

        return back()->with('success', 'Result updated successfully.');
    }
}