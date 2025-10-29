<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class GradeController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Grade::class);

        $query = Grade::withCount('students')->with(['teachers.user']);

        // If teacher, show only assigned grades
        if ($request->user()->isTeacher()) {
            $query->whereHas('teachers', function ($q) use ($request) {
                $q->where('teacher_id', $request->user()->teacher->id);
            });
        }

        $grades = $query->when($request->search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('level', 'like', "%{$search}%");
            })
            ->orderBy('level')
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Grades/Index', [
            'grades' => $grades,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Grade::class);

        // Get all active teachers for assignment
        $teachers = Teacher::with('user')
            ->where('status', 'active')
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user->name,
                    'email' => $teacher->user->email,
                    'employee_number' => $teacher->employee_number,
                    'subject_specialization' => $teacher->subject_specialization,
                ];
            });

        return Inertia::render('Grades/Create', [
            'teachers' => $teachers,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Grade::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:grades,name',
            'level' => 'required|in:ECD,Lower Primary,Upper Primary,Junior Secondary',
            'capacity' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'teacher_ids' => 'nullable|array',
            'teacher_ids.*' => 'exists:teachers,id',
            'class_teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $grade = Grade::create([
            'name' => $validated['name'],
            'level' => $validated['level'],
            'capacity' => $validated['capacity'],
            'description' => $validated['description'],
            'status' => $validated['status'],
        ]);

        // Assign teachers to the grade
        if (!empty($validated['teacher_ids'])) {
            foreach ($validated['teacher_ids'] as $teacherId) {
                $isClassTeacher = $teacherId == $validated['class_teacher_id'];
                $grade->teachers()->attach($teacherId, ['is_class_teacher' => $isClassTeacher]);
            }
        }

        return redirect()->route('grades.index')
            ->with('success', 'Grade created successfully.');
    }

    public function show(Grade $grade)
    {
        $this->authorize('view', $grade);

        $grade->load(['students.guardian.user', 'teachers.user']);

        // Get all active teachers for assignment
        $availableTeachers = Teacher::with('user')
            ->where('status', 'active')
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user->name,
                    'email' => $teacher->user->email,
                    'employee_number' => $teacher->employee_number,
                    'subject_specialization' => $teacher->subject_specialization,
                ];
            });

        return Inertia::render('Grades/Show', [
            'grade' => $grade,
            'studentCount' => $grade->students()->count(),
            'availableSpots' => $grade->capacity - $grade->students()->count(),
            'availableTeachers' => $availableTeachers,
        ]);
    }

    public function edit(Grade $grade)
    {
        $this->authorize('update', $grade);

        $grade->load(['teachers']);

        // Get all active teachers for assignment
        $teachers = Teacher::with('user')
            ->where('status', 'active')
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user->name,
                    'email' => $teacher->user->email,
                    'employee_number' => $teacher->employee_number,
                    'subject_specialization' => $teacher->subject_specialization,
                ];
            });

        $assignedTeacherIds = $grade->teachers->pluck('id')->toArray();
        $classTeacherId = $grade->teachers->where('pivot.is_class_teacher', true)->first()?->id;

        return Inertia::render('Grades/Edit', [
            'grade' => $grade,
            'teachers' => $teachers,
            'assignedTeacherIds' => $assignedTeacherIds,
            'classTeacherId' => $classTeacherId,
        ]);
    }

    public function update(Request $request, Grade $grade)
    {
        $this->authorize('update', $grade);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:grades,name,' . $grade->id,
            'level' => 'required|in:ECD,Lower Primary,Upper Primary,Junior Secondary',
            'capacity' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'teacher_ids' => 'nullable|array',
            'teacher_ids.*' => 'exists:teachers,id',
            'class_teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $grade->update([
            'name' => $validated['name'],
            'level' => $validated['level'],
            'capacity' => $validated['capacity'],
            'description' => $validated['description'],
            'status' => $validated['status'],
        ]);

        // Sync teachers - detach all and re-attach with proper pivot values
        $grade->teachers()->detach();
        if (!empty($validated['teacher_ids'])) {
            foreach ($validated['teacher_ids'] as $teacherId) {
                $isClassTeacher = $teacherId == $validated['class_teacher_id'];
                $grade->teachers()->attach($teacherId, ['is_class_teacher' => $isClassTeacher]);
            }
        }

        return redirect()->route('grades.index')
            ->with('success', 'Grade updated successfully.');
    }

    public function destroy(Grade $grade)
    {
        $this->authorize('delete', $grade);

        // Check if grade has students
        if ($grade->students()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete grade with enrolled students.']);
        }

        $grade->delete();

        return redirect()->route('grades.index')
            ->with('success', 'Grade deleted successfully.');
    }

    // Assign teacher to grade
    public function assignTeacher(Request $request, Grade $grade)
    {
        $this->authorize('update', $grade);

        $validated = $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'is_class_teacher' => 'boolean',
        ]);

        // Check if teacher is already assigned
        if ($grade->teachers()->where('teacher_id', $validated['teacher_id'])->exists()) {
            return back()->withErrors(['error' => 'Teacher is already assigned to this grade.']);
        }

        // If setting as class teacher, remove class teacher status from others
        if ($validated['is_class_teacher'] ?? false) {
            $grade->teachers()->updateExistingPivot(
                $grade->teachers->pluck('id')->toArray(),
                ['is_class_teacher' => false]
            );
        }

        $grade->teachers()->attach($validated['teacher_id'], [
            'is_class_teacher' => $validated['is_class_teacher'] ?? false
        ]);

        return back()->with('success', 'Teacher assigned successfully.');
    }

    // Remove teacher from grade
    public function removeTeacher(Request $request, Grade $grade, Teacher $teacher)
    {
        $this->authorize('update', $grade);

        $grade->teachers()->detach($teacher->id);

        return back()->with('success', 'Teacher removed successfully.');
    }

    // Update teacher assignment (change class teacher status)
    public function updateTeacherAssignment(Request $request, Grade $grade, Teacher $teacher)
    {
        $this->authorize('update', $grade);

        $validated = $request->validate([
            'is_class_teacher' => 'required|boolean',
        ]);

        // If setting as class teacher, remove class teacher status from others
        if ($validated['is_class_teacher']) {
            $grade->teachers()->updateExistingPivot(
                $grade->teachers->pluck('id')->toArray(),
                ['is_class_teacher' => false]
            );
        }

        $grade->teachers()->updateExistingPivot($teacher->id, [
            'is_class_teacher' => $validated['is_class_teacher']
        ]);

        return back()->with('success', 'Teacher assignment updated successfully.');
    }
}