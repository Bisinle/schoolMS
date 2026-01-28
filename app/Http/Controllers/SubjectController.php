<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Grade;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class SubjectController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Subject::class);

        $subjects = Subject::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->when($request->category, function ($query, $category) {
                $query->where('category', $category);
            })
            ->withCount('grades')
            ->orderBy('category')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Subjects/Index', [
            'subjects' => $subjects,
            'filters' => $request->only(['search', 'category']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Subject::class);

        // Get all active grades (including Unassigned)
        $grades = Grade::where('status', 'active')
            ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        return Inertia::render('Subjects/Create', [
            'grades' => $grades,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Subject::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|in:academic,islamic,arts',
            'code' => 'nullable|string|max:50',
            'status' => 'required|in:active,inactive',
            'grade_ids' => 'nullable|array',
            'grade_ids.*' => 'exists:grades,id',
        ]);

        $schoolId = $request->user()->school_id;

        // Check for duplicate subject name in same category (within same school)
        $exists = Subject::where('name', $validated['name'])
            ->where('category', $validated['category'])
            ->where('school_id', $schoolId)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'name' => 'A subject with this name already exists in this category.'
            ]);
        }

        $subject = Subject::create([
            'name' => $validated['name'],
            'category' => $validated['category'],
            'code' => $validated['code'],
            'status' => $validated['status'],
        ]);

        // Attach grades if provided
        if (isset($validated['grade_ids']) && count($validated['grade_ids']) > 0) {
            $subject->grades()->attach($validated['grade_ids']);
        }

        return redirect()->route('subjects.index')
            ->with('success', 'Subject created successfully.');
    }

    public function show(Subject $subject)
    {
        $this->authorize('view', $subject);

        $subject->load(['grades' => function ($query) {
            $query->withCount('students')
                ->orderBy('level');
        }]);

        return Inertia::render('Subjects/Show', [
            'subject' => $subject,
        ]);
    }

    public function edit(Subject $subject)
    {
        $this->authorize('update', $subject);

        // Get all active grades (including Unassigned)
        $grades = Grade::where('status', 'active')
            ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        $subject->load('grades');

        return Inertia::render('Subjects/Edit', [
            'subject' => $subject,
            'grades' => $grades,
        ]);
    }

    public function update(Request $request, Subject $subject)
    {
        $this->authorize('update', $subject);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|in:academic,islamic,arts',
            'code' => 'nullable|string|max:50',
            'status' => 'required|in:active,inactive',
            'grade_ids' => 'nullable|array',
            'grade_ids.*' => 'exists:grades,id',
        ]);

        // Check for duplicate subject name in same category (excluding current subject, within same school)
        $exists = Subject::where('name', $validated['name'])
            ->where('category', $validated['category'])
            ->where('school_id', $subject->school_id)
            ->where('id', '!=', $subject->id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'name' => 'A subject with this name already exists in this category.'
            ]);
        }

        $subject->update([
            'name' => $validated['name'],
            'category' => $validated['category'],
            'code' => $validated['code'],
            'status' => $validated['status'],
        ]);

        // Sync grades (this will add new ones and remove unchecked ones)
        if (isset($validated['grade_ids'])) {
            $subject->grades()->sync($validated['grade_ids']);
        } else {
            $subject->grades()->detach(); // Remove all if none selected
        }

        return redirect()->route('subjects.index')
            ->with('success', 'Subject updated successfully.');
    }

    public function destroy(Subject $subject)
    {
        $this->authorize('delete', $subject);

        // Check if subject has exams
        $exams = $subject->exams()->with(['grade'])->get();

        if ($exams->isNotEmpty()) {
            $examsUsing = $exams->map(function ($exam) {
                return [
                    'id' => $exam->id,
                    'name' => $exam->name,
                    'grade' => $exam->grade->name ?? 'N/A',
                    'date' => $exam->exam_date ? $exam->exam_date->format('M d, Y') : 'Not scheduled',
                    'academic_year' => $exam->academic_year,
                    'term' => $exam->term,
                    'url' => route('exams.show', $exam->id),
                ];
            });

            return back()->with('error', [
                'message' => 'This subject cannot be deleted because it is being used in exams.',
                'type' => 'exams',
                'exams_using_subject' => $examsUsing,
                'subject_name' => $subject->name,
            ]);
        }

        // Check if subject is used in any timetable slots
        $timetableSlots = $subject->timetableSlots()
            ->with(['template.grade', 'template.academicTerm'])
            ->get();

        if ($timetableSlots->isNotEmpty()) {
            // Group slots by template
            $templatesUsing = $timetableSlots->groupBy('timetable_template_id')
                ->map(function ($slots) {
                    $template = $slots->first()->template;
                    return [
                        'id' => $template->id,
                        'name' => $template->name,
                        'grade' => $template->grade->name,
                        'term' => $template->academicTerm->name ?? 'N/A',
                        'status' => $template->status,
                        'slots_count' => $slots->count(),
                        'url' => route('timetables.templates.show', $template->id),
                    ];
                })
                ->values();

            return back()->with('error', [
                'message' => 'This subject cannot be deleted because it is being used in timetable schedules.',
                'type' => 'timetable_slots',
                'templates_using_subject' => $templatesUsing,
                'subject_name' => $subject->name,
            ]);
        }

        // Detach from all grades
        $subject->grades()->detach();

        $subject->delete();

        return redirect()->route('subjects.index')
            ->with('success', 'Subject deleted successfully.');
    }

    public function assignGrades(Request $request, Subject $subject)
    {
        $this->authorize('update', $subject);

        $validated = $request->validate([
            'grade_ids' => 'required|array',
            'grade_ids.*' => 'exists:grades,id',
        ]);

        $subject->grades()->sync($validated['grade_ids']);

        return back()->with('success', 'Grades assigned successfully.');
    }
}