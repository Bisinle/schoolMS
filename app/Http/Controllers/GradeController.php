<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Teacher;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class GradeController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Grade::class);

        $user = $request->user();

        // Build query
        $query = $user->isTeacher()
            ? $user->teacher->grades()
            : Grade::query();

        // Apply search filter
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('code', 'like', "%{$request->search}%");
            });
        }

        // Apply level filter
        if ($request->level) {
            $query->where('level', $request->level);
        }

        $grades = $query->withCount('students', 'subjects')
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        return Inertia::render('Grades/Index', [
            'grades' => $grades,
            'filters' => $request->only(['search', 'level']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Grade::class);

        $subjects = Subject::where('status', 'active')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        $teachers = Teacher::with('user')
            ->whereHas('user', function ($query) {
                $query->where('role', 'teacher');
            })
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user->name,
                    'employee_number' => $teacher->employee_number,
                ];
            });

        return Inertia::render('Grades/Create', [
            'subjects' => $subjects,
            'teachers' => $teachers,
            'levels' => Grade::LEVELS,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Grade::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:grades,name',
            'code' => 'nullable|string|max:50|unique:grades,code',
            'level' => 'required|in:ECD,LOWER PRIMARY,UPPER PRIMARY,JUNIOR SECONDARY',
            'status' => 'required|in:active,inactive',
            'subject_ids' => 'nullable|array',
            'subject_ids.*' => 'exists:subjects,id',
            'teacher_ids' => 'nullable|array',
            'teacher_ids.*' => 'exists:teachers,id',
            'class_teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $grade = Grade::create([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'level' => $validated['level'],
            'status' => $validated['status'],
        ]);

        // Attach subjects if provided
        if (isset($validated['subject_ids']) && count($validated['subject_ids']) > 0) {
            $grade->subjects()->attach($validated['subject_ids']);
        }

        // Attach teachers if provided
        if (isset($validated['teacher_ids']) && count($validated['teacher_ids']) > 0) {
            $teacherData = [];
            foreach ($validated['teacher_ids'] as $teacherId) {
                $teacherData[$teacherId] = [
                    'is_class_teacher' => isset($validated['class_teacher_id']) && $validated['class_teacher_id'] == $teacherId
                ];
            }
            $grade->teachers()->attach($teacherData);
        }

        return redirect()->route('grades.index')
            ->with('success', 'Grade created successfully.');
    }

    public function show(Grade $grade)
    {
        $this->authorize('view', $grade);

        $grade->load([
            'students' => function ($query) {
                $query->where('status', 'active')
                    ->orderBy('first_name')
                    ->orderBy('last_name');
            },
            'teachers.user',
            'subjects' => function ($query) {
                $query->orderBy('category')
                    ->orderBy('name');
            }
        ]);

        // $availableTeachers = Teacher::whereDoesntHave('grades', function ($query) use ($grade) {
        //     $query->where('grades.id', $grade->id);
        // })->with('user')->get();

        $assignedTeacherIds = $grade->teachers->pluck('id');
        $availableTeachers = Teacher::with('user')
            ->whereNotIn('id', $assignedTeacherIds)
            ->get();

        return Inertia::render('Grades/Show', [
            'grade' => $grade,
            'availableTeachers' => $availableTeachers,
        ]);
    }

    public function edit(Grade $grade)
    {
        $this->authorize('update', $grade);

        $subjects = Subject::where('status', 'active')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        $teachers = Teacher::with('user')
            ->whereHas('user', function ($query) {
                $query->where('role', 'teacher');
            })
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->user->name,
                    'employee_number' => $teacher->employee_number,
                ];
            });

        $grade->load(['subjects', 'teachers']);

        // Get class teacher ID
        $classTeacher = $grade->teachers()->wherePivot('is_class_teacher', true)->first();

        return Inertia::render('Grades/Edit', [
            'grade' => $grade,
            'subjects' => $subjects,
            'teachers' => $teachers,
            'levels' => Grade::LEVELS,
            'classTeacherId' => $classTeacher ? $classTeacher->id : null,
        ]);
    }

    public function update(Request $request, Grade $grade)
    {
        $this->authorize('update', $grade);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:grades,name,' . $grade->id,
            'code' => 'nullable|string|max:50|unique:grades,code,' . $grade->id,
            'level' => 'required|in:ECD,LOWER PRIMARY,UPPER PRIMARY,JUNIOR SECONDARY',
            'status' => 'required|in:active,inactive',
            'subject_ids' => 'nullable|array',
            'subject_ids.*' => 'exists:subjects,id',
            'teacher_ids' => 'nullable|array',
            'teacher_ids.*' => 'exists:teachers,id',
            'class_teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $grade->update([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'level' => $validated['level'],
            'status' => $validated['status'],
        ]);

        // Sync subjects
        if (isset($validated['subject_ids'])) {
            $grade->subjects()->sync($validated['subject_ids']);
        } else {
            $grade->subjects()->detach();
        }

        // Sync teachers
        if (isset($validated['teacher_ids']) && count($validated['teacher_ids']) > 0) {
            $teacherData = [];
            foreach ($validated['teacher_ids'] as $teacherId) {
                $teacherData[$teacherId] = [
                    'is_class_teacher' => isset($validated['class_teacher_id']) && $validated['class_teacher_id'] == $teacherId
                ];
            }
            $grade->teachers()->sync($teacherData);
        } else {
            $grade->teachers()->detach();
        }

        return redirect()->route('grades.index')
            ->with('success', 'Grade updated successfully.');
    }

    public function destroy(Grade $grade)
    {
        $this->authorize('delete', $grade);

        // Check if grade has students
        if ($grade->students()->count() > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete grade with enrolled students. Please transfer students first.'
            ]);
        }

        // Detach all relationships
        $grade->teachers()->detach();
        $grade->subjects()->detach();

        $grade->delete();

        return redirect()->route('grades.index')
            ->with('success', 'Grade deleted successfully.');
    }

    // Teacher Assignment Methods
    public function assignTeacher(Request $request, Grade $grade)
    {
        $this->authorize('update', $grade);

        $validated = $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'is_class_teacher' => 'required|boolean',
        ]);

        // Check if teacher is already assigned
        if ($grade->teachers()->where('teacher_id', $validated['teacher_id'])->exists()) {
            return back()->withErrors([
                'teacher_id' => 'This teacher is already assigned to this grade.'
            ]);
        }

        // If marking as class teacher, remove class teacher status from others in this grade
        if ($validated['is_class_teacher']) {
            $grade->teachers()->updateExistingPivot(
                $grade->teachers()->pluck('teachers.id')->toArray(),
                ['is_class_teacher' => false]
            );
        }

        $grade->teachers()->attach($validated['teacher_id'], [
            'is_class_teacher' => $validated['is_class_teacher'],
        ]);

        return back()->with('success', 'Teacher assigned successfully.');
    }

    public function removeTeacher(Grade $grade, Teacher $teacher)
    {
        $this->authorize('update', $grade);

        $grade->teachers()->detach($teacher->id);

        return back()->with('success', 'Teacher removed successfully.');
    }

    public function updateTeacherAssignment(Request $request, Grade $grade, Teacher $teacher)
    {
        $this->authorize('update', $grade);

        $validated = $request->validate([
            'is_class_teacher' => 'required|boolean',
        ]);

        // If marking as class teacher, remove class teacher status from others in this grade
        if ($validated['is_class_teacher']) {
            $grade->teachers()->updateExistingPivot(
                $grade->teachers()->where('teachers.id', '!=', $teacher->id)->pluck('teachers.id')->toArray(),
                ['is_class_teacher' => false]
            );
        }

        $grade->teachers()->updateExistingPivot($teacher->id, [
            'is_class_teacher' => $validated['is_class_teacher'],
        ]);

        return back()->with('success', 'Teacher assignment updated successfully.');
    }
}
