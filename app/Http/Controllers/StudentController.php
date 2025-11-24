<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Guardian;
use App\Models\Grade;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StudentController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Student::class);

        $user = $request->user();

        // Build query based on user role
        if ($user->isGuardian()) {
            $query = $user->guardian->students();
        } elseif ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            $query = Student::whereIn('grade_id', $teacherGradeIds);
        } else {
            $query = Student::query();
        }

        // Apply filters
        $query->with(['grade', 'guardian.user'])
            ->when($request->search, function ($q, $search) {
                $q->where(function($query) use ($search) {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('admission_number', 'like', "%{$search}%");
                });
            })
            ->when($request->grade_id, function ($q, $gradeId) {
                $q->where('grade_id', $gradeId);
            })
            ->when($request->gender, function ($q, $gender) {
                $q->where('gender', $gender);
            })
            ->when($request->status, function ($q, $status) {
                $q->where('status', $status);
            });

        $students = $query->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate(20)
            ->withQueryString();

        // Get grades for filter dropdown (including Unassigned)
        $grades = $user->isTeacher()
            ? $user->teacher->grades
            : Grade::where('status', 'active')
                ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
                ->orderBy('level')
                ->orderBy('name')
                ->get();

        return Inertia::render('Students/Index', [
            'students' => $students,
            'grades' => $grades,
            'filters' => $request->only(['search', 'grade_id', 'gender', 'status']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Student::class);

        $guardians = Guardian::with('user')
            ->get()
            ->map(function ($guardian) {
                return [
                    'id' => $guardian->id,
                    'name' => $guardian->user->name ?? 'Unknown',
                    'phone' => $guardian->phone_number ?? 'N/A',
                    'relationship' => ucfirst($guardian->relationship ?? 'N/A'),
                ];
            });

        // Get all active grades (including Unassigned)
        $grades = Grade::where('status', 'active')
            ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
            ->orderBy('level')
            ->orderBy('name')
            ->get();

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
            'date_of_birth' => 'required|date|before:today',
            'grade_id' => 'required|exists:grades,id',
            'guardian_id' => 'required|exists:guardians,id',
            'enrollment_date' => 'required|date',
            'status' => 'required|in:active,inactive',
        ]);

        // Get grade name for class_name field
        $grade = Grade::find($validated['grade_id']);
        $validated['class_name'] = $grade->name;

        Student::create($validated);

        return redirect()->route('students.index')
            ->with('success', 'Student registered successfully.');
    }

    public function show(Student $student)
    {
        $this->authorize('view', $student);

        $student->load(['grade', 'guardian.user', 'attendances' => function($query) {
            $query->latest()->limit(10);
        }]);

        return Inertia::render('Students/Show', [
            'student' => $student,
            'attendanceStats' => $student->getAttendanceStats(),
        ]);
    }

    public function edit(Student $student)
    {
        $this->authorize('update', $student);

        $student->load(['grade', 'guardian.user']);

        $guardians = Guardian::with('user')
            ->get()
            ->map(function ($guardian) {
                return [
                    'id' => $guardian->id,
                    'name' => $guardian->user->name ?? 'Unknown',
                    'phone' => $guardian->phone_number ?? 'N/A',
                    'relationship' => ucfirst($guardian->relationship ?? 'N/A'),
                ];
            });

        // Get all active grades (including Unassigned)
        $grades = Grade::where('status', 'active')
            ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
            ->orderBy('level')
            ->orderBy('name')
            ->get();

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
            // 'admission_number' => [
            //     'required',
            //     'string',
            //     Rule::unique('students', 'admission_number')->ignore($student->id),
           // ],
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'required|in:male,female',
            'date_of_birth' => 'required|date|before:today',
            'grade_id' => 'required|exists:grades,id',
            'guardian_id' => 'required|exists:guardians,id',
            'enrollment_date' => 'required|date',
            'status' => 'required|in:active,inactive',
        ]);

        // Update grade name for class_name field
        $grade = Grade::find($validated['grade_id']);
        $validated['class_name'] = $grade->name;

        $student->update($validated);

        return redirect()->route('students.index')
            ->with('success', 'Student information updated successfully.');
    }

    public function destroy(Student $student)
    {
        $this->authorize('delete', $student);

        $student->delete();

        return redirect()->route('students.index')
            ->with('success', 'Student deleted successfully.');
    }
}
