<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\User;
use App\Models\Grade;
use App\Services\UniqueIdentifierService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TeacherController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Teacher::class);

        $teachers = Teacher::with(['user', 'grades'])
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

        return Inertia::render('Teachers/Create', [
            'grades' => $grades,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Teacher::class);

        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->where('school_id', $schoolId),
            ],
            'password' => 'required|string|min:8',
            'phone_number' => 'required|string|max:20',
            'address' => 'nullable|string',
            'qualification' => 'nullable|string|max:255',
            'subject_specialization' => 'nullable|string|max:255',
            'date_of_joining' => 'required|date',
            'status' => 'required|in:active,inactive',
            'grade_ids' => 'nullable|array',
            'grade_ids.*' => 'exists:grades,id',
            'class_teacher_grade_id' => 'nullable|exists:grades,id',
        ]);

        $user = User::create([
            'school_id' => auth()->user()->school_id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'teacher',
            'created_by' => auth()->id(),
        ]);

        // Auto-generate employee number
        $employeeNumber = UniqueIdentifierService::generateEmployeeNumber(auth()->user()->school_id);

        $teacher = Teacher::create([
            'user_id' => $user->id,
            'employee_number' => $employeeNumber,
            'phone_number' => $validated['phone_number'],
            'address' => $validated['address'],
            'qualification' => $validated['qualification'],
            'subject_specialization' => $validated['subject_specialization'],
            'date_of_joining' => $validated['date_of_joining'],
            'status' => $validated['status'],
        ]);

        // Attach grades
        if (!empty($validated['grade_ids'])) {
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

        $teacher->load(['user', 'grades.students']);

        return Inertia::render('Teachers/Show', [
            'teacher' => $teacher,
        ]);
    }

    public function edit(Teacher $teacher)
    {
        $this->authorize('update', $teacher);

        $teacher->load(['user', 'grades']);

        $grades = Grade::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'level']);

        $assignedGradeIds = $teacher->grades->pluck('id')->toArray();
        // $classTeacherGradeId = $teacher->grades->where('pivot.is_class_teacher', true)->first()?->id;
        $classTeacherGradeId = $teacher->grades ->filter(fn($grade) => $grade->pivot && $grade->pivot->is_class_teacher)
    ->first()?->id;

        return Inertia::render('Teachers/Edit', [
            'teacher' => $teacher,
            'grades' => $grades,
            'assignedGradeIds' => $assignedGradeIds,
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
                Rule::unique('users', 'email')
                    ->ignore($teacher->user_id)
                    ->where('school_id', $teacher->user->school_id),
            ],
            'phone_number' => 'required|string|max:20',
            'address' => 'nullable|string',
            'qualification' => 'nullable|string|max:255',
            'subject_specialization' => 'nullable|string|max:255',
            'date_of_joining' => 'required|date',
            'status' => 'required|in:active,inactive',
            'grade_ids' => 'nullable|array',
            'grade_ids.*' => 'exists:grades,id',
            'class_teacher_grade_id' => 'nullable|exists:grades,id',
        ]);

        $teacher->user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $teacher->update([
            'phone_number' => $validated['phone_number'],
            'address' => $validated['address'],
            'qualification' => $validated['qualification'],
            'subject_specialization' => $validated['subject_specialization'],
            'date_of_joining' => $validated['date_of_joining'],
            'status' => $validated['status'],
        ]);

        // Sync grades
        $teacher->grades()->detach();
        if (!empty($validated['grade_ids'])) {
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

        $user = $teacher->user;
        $teacher->delete();
        $user->delete();

        return redirect()->route('teachers.index')
            ->with('success', 'Teacher deleted successfully.');
    }
}