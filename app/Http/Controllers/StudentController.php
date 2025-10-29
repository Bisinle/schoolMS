<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Guardian;
use App\Models\Grade;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class StudentController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Student::class);

        $students = Student::with(['guardian.user', 'grade'])
            ->when($request->search, function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('admission_number', 'like', "%{$search}%");
            })
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Students/Index', [
            'students' => $students,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Student::class);

        $guardians = Guardian::with('user')->get()->map(function ($guardian) {
            return [
                'id' => $guardian->id,
                'name' => $guardian->user->name,
            ];
        });

        $grades = Grade::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'level']);

        return Inertia::render('Students/Create', [
            'guardians' => $guardians,
            'grades' => $grades,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Student::class);

        $validated = $request->validate([
            'admission_number' => 'required|string|unique:students,admission_number',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'required|in:male,female',
            'date_of_birth' => 'required|date',
            'guardian_id' => 'required|exists:guardians,id',
            'grade_id' => 'required|exists:grades,id',
            'enrollment_date' => 'required|date',
            'status' => 'required|in:active,inactive',
        ]);

        Student::create($validated);

        return redirect()->route('students.index')
            ->with('success', 'Student created successfully.');
    }

    public function show(Student $student)
    {
        $this->authorize('view', $student);

        $student->load(['guardian.user', 'grade']);

        return Inertia::render('Students/Show', [
            'student' => $student,
        ]);
    }

    public function edit(Student $student)
    {
        $this->authorize('update', $student);

        $guardians = Guardian::with('user')->get()->map(function ($guardian) {
            return [
                'id' => $guardian->id,
                'name' => $guardian->user->name,
            ];
        });

        $grades = Grade::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'level']);

        return Inertia::render('Students/Edit', [
            'student' => $student,
            'guardians' => $guardians,
            'grades' => $grades,
        ]);
    }

    public function update(Request $request, Student $student)
    {
        $this->authorize('update', $student);

        $validated = $request->validate([
            'admission_number' => 'required|string|unique:students,admission_number,' . $student->id,
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'required|in:male,female',
            'date_of_birth' => 'required|date',
            'guardian_id' => 'required|exists:guardians,id',
            'grade_id' => 'required|exists:grades,id',
            'enrollment_date' => 'required|date',
            'status' => 'required|in:active,inactive',
        ]);

        $student->update($validated);

        return redirect()->route('students.index')
            ->with('success', 'Student updated successfully.');
    }

    public function destroy(Student $student)
    {
        $this->authorize('delete', $student);

        $student->delete();

        return redirect()->route('students.index')
            ->with('success', 'Student deleted successfully.');
    }
}