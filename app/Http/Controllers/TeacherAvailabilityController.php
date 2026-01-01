<?php

namespace App\Http\Controllers;

use App\Models\TeacherAvailability;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class TeacherAvailabilityController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of teacher availability records.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $schoolId = $user->school_id;

        $query = TeacherAvailability::with(['teacher.user'])
            ->whereHas('teacher.user', function ($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            });

        // If teacher, only show their own availability
        if ($user->role === 'teacher') {
            $query->where('teacher_id', $user->teacher->id);
        }

        // Filters
        if ($request->teacher_id) {
            $query->where('teacher_id', $request->teacher_id);
        }

        if ($request->day_of_week) {
            $query->where('day_of_week', $request->day_of_week);
        }

        if ($request->availability_type) {
            $query->where('availability_type', $request->availability_type);
        }

        $availabilities = $query->orderBy('day_of_week')
            ->orderBy('start_time')
            ->paginate(20)
            ->withQueryString();

        $teachers = Teacher::whereHas('user', function ($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            })
            ->with('user')
            ->get();

        return Inertia::render('Timetables/Availability/Index', [
            'availabilities' => $availabilities,
            'teachers' => $teachers,
            'filters' => $request->only(['teacher_id', 'day_of_week', 'availability_type']),
            'daysOfWeek' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            'availabilityTypes' => ['available', 'unavailable', 'preferred'],
        ]);
    }

    /**
     * Show the form for creating a new availability record.
     */
    public function create()
    {
        $user = auth()->user();
        $schoolId = $user->school_id;

        $teachers = Teacher::whereHas('user', function ($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            })
            ->with('user')
            ->get();

        return Inertia::render('Timetables/Availability/Create', [
            'teachers' => $teachers,
            'daysOfWeek' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            'availabilityTypes' => ['available', 'unavailable', 'preferred'],
            'currentTeacherId' => $user->role === 'teacher' ? $user->teacher->id : null,
        ]);
    }

    /**
     * Store a newly created availability record.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'availability_type' => 'required|in:available,unavailable,preferred',
            'reason' => 'nullable|string',
            'is_recurring' => 'boolean',
        ]);

        // Teachers can only create their own availability
        if ($user->role === 'teacher' && $validated['teacher_id'] != $user->teacher->id) {
            abort(403, 'You can only manage your own availability.');
        }

        TeacherAvailability::create($validated);

        return redirect()->route('timetables.availability.index')
            ->with('success', 'Teacher availability created successfully.');
    }

    /**
     * Display the specified availability record.
     */
    public function show(TeacherAvailability $availability)
    {
        $user = auth()->user();

        // Teachers can only view their own availability
        if ($user->role === 'teacher' && $availability->teacher_id != $user->teacher->id) {
            abort(403, 'Unauthorized access.');
        }

        $availability->load(['teacher.user']);

        return Inertia::render('Timetables/Availability/Show', [
            'availability' => $availability,
        ]);
    }

    /**
     * Show the form for editing the specified availability record.
     */
    public function edit(TeacherAvailability $availability)
    {
        $user = auth()->user();

        // Teachers can only edit their own availability
        if ($user->role === 'teacher' && $availability->teacher_id != $user->teacher->id) {
            abort(403, 'Unauthorized access.');
        }

        $availability->load(['teacher.user']);

        $schoolId = $user->school_id;
        $teachers = Teacher::whereHas('user', function ($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            })
            ->with('user')
            ->get();

        return Inertia::render('Timetables/Availability/Edit', [
            'availability' => $availability,
            'teachers' => $teachers,
            'daysOfWeek' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            'availabilityTypes' => ['available', 'unavailable', 'preferred'],
        ]);
    }

    /**
     * Update the specified availability record.
     */
    public function update(Request $request, TeacherAvailability $availability)
    {
        $user = auth()->user();

        // Teachers can only update their own availability
        if ($user->role === 'teacher' && $availability->teacher_id != $user->teacher->id) {
            abort(403, 'Unauthorized access.');
        }

        $validated = $request->validate([
            'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'availability_type' => 'required|in:available,unavailable,preferred',
            'reason' => 'nullable|string',
            'is_recurring' => 'boolean',
        ]);

        $availability->update($validated);

        return redirect()->route('timetables.availability.index')
            ->with('success', 'Teacher availability updated successfully.');
    }

    /**
     * Remove the specified availability record.
     */
    public function destroy(TeacherAvailability $availability)
    {
        $user = auth()->user();

        // Teachers can only delete their own availability
        if ($user->role === 'teacher' && $availability->teacher_id != $user->teacher->id) {
            abort(403, 'Unauthorized access.');
        }

        $availability->delete();

        return redirect()->route('timetables.availability.index')
            ->with('success', 'Teacher availability deleted successfully.');
    }
}
