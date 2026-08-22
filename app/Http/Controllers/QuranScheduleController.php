<?php

namespace App\Http\Controllers;

use App\Models\QuranSchedule;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuranScheduleController extends Controller
{
    /**
     * Display a listing of schedules.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = QuranSchedule::with(['student.grade', 'teacher'])
            ->where('school_id', $user->school_id)
            ->latest('start_date');

        // Filter by teacher if user is a teacher
        if ($user->role === 'teacher') {
            $query->where('teacher_id', $user->id);
        }

        // Apply filters
        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('schedule_type')) {
            $query->where('schedule_type', $request->schedule_type);
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $schedules = $query->paginate(20);

        // Get students for filter dropdown
        $students = Student::where('school_id', $user->school_id)->get();

        return Inertia::render('Quran/Schedule/Index', [
            'schedules' => $schedules,
            'students' => $students,
            'filters' => $request->only(['student_id', 'schedule_type', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new schedule.
     */
    public function create()
    {
        $user = auth()->user();
        $students = Student::where('school_id', $user->school_id)->get();

        return Inertia::render('Quran/Schedule/Create', [
            'students' => $students,
        ]);
    }

    /**
     * Store a newly created schedule.
     */
    public function store(Request $request)
    {
        $this->authorize('create', QuranSchedule::class);

        $validated = $request->validate(QuranSchedule::validationRules());

        $user = auth()->user();

        // Check if student already has an active schedule
        $existingActive = QuranSchedule::where('student_id', $validated['student_id'])
            ->where('is_active', true)
            ->first();

        if ($existingActive) {
            return back()->withErrors([
                'student_id' => 'This student already has an active schedule. Please deactivate it first.'
            ]);
        }

        $validated['teacher_id'] = $user->id;
        $validated['school_id'] = $user->school_id;
        $validated['is_active'] = true; // New schedules are active by default

        QuranSchedule::create($validated);

        return redirect()->route('quran-schedule.index')
            ->with('success', 'Schedule created successfully!');
    }

    /**
     * Display the specified schedule.
     */
    public function show(QuranSchedule $quranSchedule)
    {
        $this->authorize('view', $quranSchedule);

        $quranSchedule->load(['student.grade', 'teacher']);

        $homeworkRecords = $quranSchedule->homework()
            ->orderBy('assigned_date', 'desc')
            ->get();

        return Inertia::render('Quran/Schedule/Show', [
            'schedule' => $quranSchedule,
            'homeworkRecords' => $homeworkRecords,
        ]);
    }

    /**
     * Show the form for editing the specified schedule.
     */
    public function edit(QuranSchedule $quranSchedule)
    {
        $this->authorize('update', $quranSchedule);

        $user = auth()->user();

        $students = Student::where('school_id', $user->school_id)->get();

        return Inertia::render('Quran/Schedule/Edit', [
            'schedule' => $quranSchedule,
            'students' => $students,
        ]);
    }

    /**
     * Update the specified schedule.
     */
    public function update(Request $request, QuranSchedule $quranSchedule)
    {
        $this->authorize('update', $quranSchedule);

        $validated = $request->validate(QuranSchedule::validationRules());

        // If changing student, check for existing active schedule
        if ($validated['student_id'] != $quranSchedule->student_id) {
            $existingActive = QuranSchedule::where('student_id', $validated['student_id'])
                ->where('is_active', true)
                ->where('id', '!=', $quranSchedule->id)
                ->first();

            if ($existingActive) {
                return back()->withErrors([
                    'student_id' => 'This student already has an active schedule.'
                ]);
            }
        }

        $quranSchedule->update($validated);

        return redirect()->route('quran-schedule.index')
            ->with('success', 'Schedule updated successfully!');
    }

    /**
     * Deactivate the specified schedule.
     */
    public function deactivate(QuranSchedule $quranSchedule)
    {
        $this->authorize('update', $quranSchedule);

        $quranSchedule->deactivate();

        return redirect()->route('quran-schedule.index')
            ->with('success', 'Schedule deactivated successfully!');
    }

    /**
     * Activate the specified schedule.
     */
    public function activate(QuranSchedule $quranSchedule)
    {
        $this->authorize('update', $quranSchedule);

        $quranSchedule->activate();

        return redirect()->route('quran-schedule.index')
            ->with('success', 'Schedule activated successfully!');
    }

    /**
     * Remove the specified schedule.
     */
    public function destroy(QuranSchedule $quranSchedule)
    {
        $this->authorize('delete', $quranSchedule);

        $quranSchedule->delete();

        return redirect()->route('quran-schedule.index')
            ->with('success', 'Schedule deleted successfully!');
    }
}

