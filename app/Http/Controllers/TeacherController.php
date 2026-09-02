<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use App\Services\UniqueIdentifierService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TeacherController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Teacher::class);

        // Note: School scoping is handled automatically by the SchoolScope global scope
        $teachers = Teacher::with(['user', 'grades', 'subject'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })
                    ->orWhere('employee_number', 'like', "%{$search}%");
            })
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Teachers/Index', [
            'teachers' => $teachers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Teacher::class);

        $grades = Grade::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'level']);

        $subjects = Subject::where('status', 'active')
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'name', 'category']);

        return Inertia::render('Teachers/Create', [
            'grades' => $grades,
            'subjects' => $subjects,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Teacher::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                // Global: users.email is a system-wide unique column (login
                // resolves by email alone, with no school selector), not
                // scoped per school.
                Rule::unique('users', 'email'),
            ],
            'password' => 'required|string|min:8',
            'phone_number' => 'required|string|max:20',
            'address' => 'nullable|string',
            'qualification' => 'nullable|string|max:255',
            'subject_id' => 'required|exists:subjects,id',
            'subject_ids' => 'required|array|min:1',
            'subject_ids.*' => 'exists:subjects,id',
            'date_of_joining' => 'nullable|date',
            'status' => 'required|in:active,inactive',
            'grade_ids' => 'nullable|array',
            'grade_ids.*' => 'exists:grades,id',
            'class_teacher_grade_id' => 'nullable|exists:grades,id',
        ]);

        try {
            $user = User::create([
                'school_id' => auth()->user()->school_id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'teacher',
                'created_by' => auth()->id(),
            ]);
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => 'This email is already registered to another account.',
            ]);
        }

        // Auto-generate employee number
        $employeeNumber = UniqueIdentifierService::generateEmployeeNumber(auth()->user()->school_id);

        $teacher = Teacher::create([
            'user_id' => $user->id,
            'employee_number' => $employeeNumber,
            'phone_number' => $validated['phone_number'],
            'address' => $validated['address'],
            'qualification' => $validated['qualification'],
            'subject_id' => $validated['subject_id'],
            'date_of_joining' => $validated['date_of_joining'],
            'status' => $validated['status'],
        ]);

        // Attach subject specializations
        if (! empty($validated['subject_ids'])) {
            $teacher->subjects()->sync($validated['subject_ids']);
        }

        // Attach grades
        if (! empty($validated['grade_ids'])) {
            foreach ($validated['grade_ids'] as $gradeId) {
                $isClassTeacher = $gradeId == $validated['class_teacher_grade_id'];
                $teacher->grades()->attach($gradeId, ['is_class_teacher' => $isClassTeacher]);
            }
        }

        return redirect()->route('teachers.index')
            ->with('success', 'Teacher created successfully.');
    }

    public function show(Teacher $teacher)
    {
        $this->authorize('view', $teacher);

        $teacher->load(['user', 'grades.students', 'subject', 'subjects']);

        return Inertia::render('Teachers/Show', [
            'teacher' => $teacher,
        ]);
    }

    public function edit(Teacher $teacher)
    {
        $this->authorize('update', $teacher);

        $teacher->load(['user', 'grades', 'subject', 'subjects']);

        $grades = Grade::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'level']);

        $subjects = Subject::where('status', 'active')
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'name', 'category']);

        $assignedGradeIds = $teacher->grades->pluck('id')->toArray();
        $assignedSubjectIds = $teacher->subjects->pluck('id')->toArray();
        // $classTeacherGradeId = $teacher->grades->where('pivot.is_class_teacher', true)->first()?->id;
        $classTeacherGradeId = $teacher->grades->filter(fn ($grade) => $grade->pivot && $grade->pivot->is_class_teacher)
            ->first()?->id;

        return Inertia::render('Teachers/Edit', [
            'teacher' => $teacher,
            'grades' => $grades,
            'subjects' => $subjects,
            'assignedGradeIds' => $assignedGradeIds,
            'assignedSubjectIds' => $assignedSubjectIds,
            'classTeacherGradeId' => $classTeacherGradeId,
        ]);
    }

    public function update(Request $request, Teacher $teacher)
    {
        $this->authorize('update', $teacher);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($teacher->user_id),
            ],
            'phone_number' => 'required|string|max:20',
            'address' => 'nullable|string',
            'qualification' => 'nullable|string|max:255',
            'subject_id' => 'required|exists:subjects,id',
            'subject_ids' => 'required|array|min:1',
            'subject_ids.*' => 'exists:subjects,id',
            'date_of_joining' => 'nullable|date',
            'status' => 'required|in:active,inactive',
            'grade_ids' => 'nullable|array',
            'grade_ids.*' => 'exists:grades,id',
            'class_teacher_grade_id' => 'nullable|exists:grades,id',
        ]);

        try {
            $teacher->user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => 'This email is already registered to another account.',
            ]);
        }

        $teacher->update([
            'phone_number' => $validated['phone_number'],
            'address' => $validated['address'],
            'qualification' => $validated['qualification'],
            'subject_id' => $validated['subject_id'],
            'date_of_joining' => $validated['date_of_joining'],
            'status' => $validated['status'],
        ]);

        // Sync subject specializations
        if (! empty($validated['subject_ids'])) {
            $teacher->subjects()->sync($validated['subject_ids']);
        }

        // Sync grades
        $teacher->grades()->detach();
        if (! empty($validated['grade_ids'])) {
            foreach ($validated['grade_ids'] as $gradeId) {
                $isClassTeacher = $gradeId == $validated['class_teacher_grade_id'];
                $teacher->grades()->attach($gradeId, ['is_class_teacher' => $isClassTeacher]);
            }
        }

        return redirect()->route('teachers.index')
            ->with('success', 'Teacher updated successfully.');
    }

    public function destroy(Teacher $teacher)
    {
        $this->authorize('delete', $teacher);

        $timetableSlotCount = $teacher->timetableSlots()->count();
        $availabilityCount = $teacher->availability()->count();

        if ($timetableSlotCount > 0 || $availabilityCount > 0) {
            return back()->with('error', "This teacher has {$timetableSlotCount} timetable slot(s) and {$availabilityCount} availability record(s) assigned. Reassign or remove them from the timetable before deleting this teacher.");
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($teacher) {
            $user = $teacher->user;
            $teacher->delete();
            $user?->delete();
        });

        return redirect()->route('teachers.index')
            ->with('success', 'Teacher deleted successfully.');
    }
}
