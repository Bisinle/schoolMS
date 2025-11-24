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
            'category' => 'required|in:academic,islamic',
            'code' => 'nullable|string|max:50',
            'status' => 'required|in:active,inactive',
            'grade_ids' => 'nullable|array',
            'grade_ids.*' => 'exists:grades,id',
        ]);

        // Check for duplicate subject name in same category
        $exists = Subject::where('name', $validated['name'])
            ->where('category', $validated['category'])
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
            'category' => 'required|in:academic,islamic',
            'code' => 'nullable|string|max:50',
            'status' => 'required|in:active,inactive',
            'grade_ids' => 'nullable|array',
            'grade_ids.*' => 'exists:grades,id',
        ]);

        // Check for duplicate subject name in same category (excluding current subject)
        $exists = Subject::where('name', $validated['name'])
            ->where('category', $validated['category'])
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
        if ($subject->exams()->exists()) {
            return back()->withErrors([
                'error' => 'Cannot delete subject with existing exams.'
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