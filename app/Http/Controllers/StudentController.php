<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Guardian;
use App\Models\Grade;
use App\Models\Stream;
use App\Services\UniqueIdentifierService;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
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
            $teacherStreamIds = $user->teacher->streams->pluck('id')->toArray();
            $query = Student::whereIn('stream_id', $teacherStreamIds);
        } else {
            $query = Student::query();
        }

        // Apply filters
        $query->with(['stream.grade', 'guardian.user'])
            ->when($request->search, function ($q, $search) {
                $q->where(function($query) use ($search) {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('admission_number', 'like', "%{$search}%");
                });
            })
            ->when($request->stream_id, function ($q, $streamId) {
                $q->where('stream_id', $streamId);
            })
            ->when($request->grade_id, function ($q, $gradeId) {
                $q->whereHas('stream', function ($query) use ($gradeId) {
                    $query->where('grade_id', $gradeId);
                });
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

        // Get grades and streams for filter dropdowns
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

        return Inertia::render('Students/Index', [
            'students' => $students,
            'grades' => $grades,
            'streams' => $streams,
            'filters' => $request->only(['search', 'grade_id', 'stream_id', 'gender', 'status']),
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
                    'guardian_number' => $guardian->guardian_number ?? 'N/A',
                    'name' => $guardian->user->name ?? 'Unknown',
                    'phone' => $guardian->phone_number ?? 'N/A',
                    'relationship' => ucfirst($guardian->relationship ?? 'N/A'),
                ];
            });

        // Get all active grades with their streams
        $grades = Grade::where('status', 'active')
            ->with('streams')
            ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        // Get all active streams
        $streams = Stream::with('grade')
            ->whereHas('grade', function ($q) {
                $q->where('status', 'active');
            })
            ->orderBy('name')
            ->get();

        return Inertia::render('Students/Create', [
            'guardians' => $guardians,
            'grades' => $grades,
            'streams' => $streams,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Student::class);

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'required|in:male,female',
            'date_of_birth' => 'required|date|before:today',
            'stream_id' => 'required|exists:streams,id',
            'guardian_id' => 'required|exists:guardians,id',
            'enrollment_date' => 'required|date',
            'status' => 'required|in:active,inactive',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            $validated['profile_picture'] = $request->file('profile_picture')
                ->store('students/profiles', 'public');
        }

        // Auto-generate admission number
        $validated['admission_number'] = UniqueIdentifierService::generateAdmissionNumber(
            $request->user()->school_id
        );

        // Get stream and grade name for class_name field
        $stream = Stream::with('grade')->find($validated['stream_id']);
        $validated['class_name'] = $stream->grade->name . ' - ' . $stream->name;

        Student::create($validated);

        return redirect()->route('students.index')
            ->with('success', 'Student registered successfully.');
    }

    public function show(Student $student)
    {
        $this->authorize('view', $student);

        $student->load(['stream.grade', 'guardian.user', 'attendances' => function($query) {
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

        $student->load(['stream.grade', 'guardian.user']);

        $guardians = Guardian::with('user')
            ->get()
            ->map(function ($guardian) {
                return [
                    'id' => $guardian->id,
                    'guardian_number' => $guardian->guardian_number ?? 'N/A',
                    'name' => $guardian->user->name ?? 'Unknown',
                    'phone' => $guardian->phone_number ?? 'N/A',
                    'relationship' => ucfirst($guardian->relationship ?? 'N/A'),
                ];
            });

        // Get all active grades with their streams
        $grades = Grade::where('status', 'active')
            ->with('streams')
            ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        // Get all active streams
        $streams = Stream::with('grade')
            ->whereHas('grade', function ($q) {
                $q->where('status', 'active');
            })
            ->orderBy('name')
            ->get();

        return Inertia::render('Students/Edit', [
            'student' => $student,
            'guardians' => $guardians,
            'grades' => $grades,
            'streams' => $streams,
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
            'stream_id' => 'required|exists:streams,id',
            'guardian_id' => 'required|exists:guardians,id',
            'enrollment_date' => 'required|date',
            'status' => 'required|in:active,inactive',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            // Delete old profile picture if exists
            if ($student->profile_picture && Storage::disk('public')->exists($student->profile_picture)) {
                Storage::disk('public')->delete($student->profile_picture);
            }

            $validated['profile_picture'] = $request->file('profile_picture')
                ->store('students/profiles', 'public');
        }

        // Update stream and grade name for class_name field
        $stream = Stream::with('grade')->find($validated['stream_id']);
        $validated['class_name'] = $stream->grade->name . ' - ' . $stream->name;

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
