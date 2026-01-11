<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Grade;
use App\Models\Stream;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class ExamController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Exam::class);

        $user = $request->user();
        $query = Exam::with(['stream.grade', 'subject', 'creator']);

        // Filter by teacher's assigned streams
        if ($user->isTeacher()) {
            $teacherStreamIds = $user->teacher->streams->pluck('id')->toArray();
            $query->whereIn('stream_id', $teacherStreamIds);
        }

        $exams = $query
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->when($request->stream_id, function ($q, $streamId) {
                $q->where('stream_id', $streamId);
            })
            ->when($request->grade_id, function ($q, $gradeId) {
                $q->whereHas('stream', function ($query) use ($gradeId) {
                    $query->where('grade_id', $gradeId);
                });
            })
            ->when($request->term, function ($q, $term) {
                $q->where('term', $term);
            })
            ->when($request->academic_year, function ($q, $year) {
                $q->where('academic_year', $year);
            })
            ->orderBy('academic_year', 'desc')
            ->orderBy('term', 'desc')
            ->orderBy('exam_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Get available grades and streams for filters
        $grades = Grade::where('status', 'active')
            ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        $streams = $user->isTeacher()
            ? $user->teacher->streams
            : Stream::with('grade')
                ->whereHas('grade', function ($q) {
                    $q->where('status', 'active');
                })
                ->orderBy('name')
                ->get();

        return Inertia::render('Exams/Index', [
            'exams' => $exams,
            'grades' => $grades,
            'streams' => $streams,
            'filters' => $request->only(['search', 'grade_id', 'stream_id', 'term', 'academic_year']),
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', Exam::class);

        $user = $request->user();

        // Get available grades with streams
        $grades = Grade::where('status', 'active')
            ->with('streams')
            ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        // Get available streams
        $streams = $user->isTeacher()
            ? $user->teacher->streams
            : Stream::with('grade')
                ->whereHas('grade', function ($q) {
                    $q->where('status', 'active');
                })
                ->orderBy('name')
                ->get();

        return Inertia::render('Exams/Create', [
            'grades' => $grades,
            'streams' => $streams,
            'currentYear' => now()->year,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Exam::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'exam_type' => 'required|in:opening,midterm,end_term',
            'term' => 'required|in:1,2,3',
            'academic_year' => 'required|integer|min:2020|max:2100',
            'exam_date' => 'required|date',
            'stream_id' => 'required|exists:streams,id',
            'subject_id' => 'required|exists:subjects,id',
        ]);

        // Validate term 3 only allows end_term
        if ($validated['term'] == '3' && $validated['exam_type'] != 'end_term') {
            return back()->withErrors([
                'exam_type' => 'Term 3 can only have End-Term exams.'
            ]);
        }

        // Check for duplicate exam
        $exists = Exam::where('stream_id', $validated['stream_id'])
            ->where('subject_id', $validated['subject_id'])
            ->where('term', $validated['term'])
            ->where('exam_type', $validated['exam_type'])
            ->where('academic_year', $validated['academic_year'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'exam_type' => 'This exam already exists for this stream, subject, term, and year.'
            ]);
        }

        $validated['created_by'] = $request->user()->id;

        Exam::create($validated);

        return redirect()->route('exams.index')
            ->with('success', 'Exam scheduled successfully.');
    }

    public function show(Exam $exam)
    {
        $this->authorize('view', $exam);

        $exam->load([
            'stream.grade',
            'subject',
            'creator',
            'results.student'
        ]);

        return Inertia::render('Exams/Show', [
            'exam' => $exam,
            'resultsCount' => $exam->results()->count(),
            'totalStudents' => $exam->stream->students()->count(),
        ]);
    }

    public function edit(Exam $exam)
    {
        $this->authorize('update', $exam);

        $user = request()->user();

        // Get available grades with streams
        $grades = Grade::where('status', 'active')
            ->with('streams')
            ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        // Get available streams
        $streams = $user->isTeacher()
            ? $user->teacher->streams
            : Stream::with('grade')
                ->whereHas('grade', function ($q) {
                    $q->where('status', 'active');
                })
                ->orderBy('name')
                ->get();

        // Get subjects for selected stream
        $subjects = Subject::where('status', 'active')
            ->whereHas('streams', function ($query) use ($exam) {
                $query->where('streams.id', $exam->stream_id);
            })
            ->get();

        return Inertia::render('Exams/Edit', [
            'exam' => $exam,
            'grades' => $grades,
            'streams' => $streams,
            'subjects' => $subjects,
        ]);
    }

    public function update(Request $request, Exam $exam)
    {
        $this->authorize('update', $exam);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'exam_type' => 'required|in:opening,midterm,end_term',
            'term' => 'required|in:1,2,3',
            'academic_year' => 'required|integer|min:2020|max:2100',
            'exam_date' => 'required|date',
            'stream_id' => 'required|exists:streams,id',
            'subject_id' => 'required|exists:subjects,id',
        ]);

        // Validate term 3 only allows end_term
        if ($validated['term'] == '3' && $validated['exam_type'] != 'end_term') {
            return back()->withErrors([
                'exam_type' => 'Term 3 can only have End-Term exams.'
            ]);
        }

        // Check for duplicate exam (excluding current exam)
        $exists = Exam::where('stream_id', $validated['stream_id'])
            ->where('subject_id', $validated['subject_id'])
            ->where('term', $validated['term'])
            ->where('exam_type', $validated['exam_type'])
            ->where('academic_year', $validated['academic_year'])
            ->where('id', '!=', $exam->id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'exam_type' => 'This exam already exists for this stream, subject, term, and year.'
            ]);
        }

        // Warn if exam has results
        if ($exam->hasResults()) {
            session()->flash('warning', 'This exam has existing results. Changes will affect all reports.');
        }

        $exam->update($validated);

        return redirect()->route('exams.index')
            ->with('success', 'Exam updated successfully.');
    }

    public function destroy(Exam $exam)
    {
        $this->authorize('delete', $exam);

        // Check if exam has results
        if ($exam->hasResults()) {
            return back()->withErrors([
                'error' => 'Cannot delete exam with existing results. Delete results first.'
            ]);
        }

        $exam->delete();

        return redirect()->route('exams.index')
            ->with('success', 'Exam deleted successfully.');
    }
}