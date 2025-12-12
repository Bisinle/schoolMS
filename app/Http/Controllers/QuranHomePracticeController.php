<?php

namespace App\Http\Controllers;

use App\Models\QuranHomePractice;
use App\Models\Student;
use App\Services\QuranApiService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuranHomePracticeController extends Controller
{
    protected $quranApiService;

    public function __construct(QuranApiService $quranApiService)
    {
        $this->quranApiService = $quranApiService;
    }

    /**
     * Display a listing of home practice logs.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = QuranHomePractice::with(['student.grade', 'guardian.user'])
            ->where('school_id', $user->school_id)
            ->latest('practice_date');

        // Filter by guardian if user is a guardian
        if ($user->role === 'guardian') {
            $query->where('guardian_id', $user->guardian->id);
        }

        // Apply filters
        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('practice_type')) {
            $query->where('practice_type', $request->practice_type);
        }

        if ($request->filled('date_from')) {
            $query->where('practice_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('practice_date', '<=', $request->date_to);
        }

        $practices = $query->paginate(20);

        // Get students for filter dropdown
        $students = $user->role === 'guardian'
            ? $user->guardian->students
            : Student::where('school_id', $user->school_id)->get();

        return Inertia::render('Quran/HomePractice/Index', [
            'practices' => $practices,
            'students' => $students,
            'filters' => $request->only(['student_id', 'practice_type', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show the form for creating a new practice log.
     */
    public function create()
    {
        $user = auth()->user();

        // Guardians can only log practice for their children
        $students = $user->role === 'guardian'
            ? $user->guardian->students
            : Student::where('school_id', $user->school_id)->get();

        $surahs = $this->quranApiService->getAllSurahs();

        return Inertia::render('Quran/HomePractice/Create', [
            'students' => $students,
            'surahs' => $surahs,
        ]);
    }

    /**
     * Store a newly created practice log.
     */
    public function store(Request $request)
    {
        $validated = $request->validate(QuranHomePractice::validationRules());

        $user = auth()->user();

        // Ensure guardian can only log for their children
        if ($user->role === 'guardian') {
            $student = Student::findOrFail($validated['student_id']);
            if ($student->guardian_id !== $user->guardian->id) {
                abort(403, 'You can only log practice for your own children.');
            }
            $validated['guardian_id'] = $user->guardian->id;
        } else {
            // Admin/Teacher logging on behalf of a guardian
            $student = Student::findOrFail($validated['student_id']);
            $validated['guardian_id'] = $student->guardian_id;
        }

        $validated['school_id'] = $user->school_id;

        QuranHomePractice::create($validated);

        return redirect()->route('quran-home-practice.index')
            ->with('success', 'Home practice logged successfully!');
    }

    /**
     * Display the specified practice log.
     */
    public function show(QuranHomePractice $quranHomePractice)
    {
        $user = auth()->user();

        // Authorization check
        if ($user->role === 'guardian' && $quranHomePractice->guardian_id !== $user->guardian->id) {
            abort(403, 'Unauthorized access.');
        }

        $quranHomePractice->load(['student.grade', 'guardian.user']);

        return Inertia::render('Quran/HomePractice/Show', [
            'practice' => $quranHomePractice,
        ]);
    }

    /**
     * Show the form for editing the specified practice log.
     */
    public function edit(QuranHomePractice $quranHomePractice)
    {
        $user = auth()->user();

        // Authorization check
        if ($user->role === 'guardian' && $quranHomePractice->guardian_id !== $user->guardian->id) {
            abort(403, 'Unauthorized access.');
        }

        $students = $user->role === 'guardian'
            ? $user->guardian->students
            : Student::where('school_id', $user->school_id)->get();

        $surahs = $this->quranApiService->getAllSurahs();

        return Inertia::render('Quran/HomePractice/Edit', [
            'practice' => $quranHomePractice,
            'students' => $students,
            'surahs' => $surahs,
        ]);
    }

    /**
     * Update the specified practice log.
     */
    public function update(Request $request, QuranHomePractice $quranHomePractice)
    {
        $user = auth()->user();

        // Authorization check
        if ($user->role === 'guardian' && $quranHomePractice->guardian_id !== $user->guardian->id) {
            abort(403, 'Unauthorized access.');
        }

        $validated = $request->validate(QuranHomePractice::validationRules());

        // Ensure guardian can only update for their children
        if ($user->role === 'guardian') {
            $student = Student::findOrFail($validated['student_id']);
            if ($student->guardian_id !== $user->guardian->id) {
                abort(403, 'You can only update practice for your own children.');
            }
        }

        $quranHomePractice->update($validated);

        return redirect()->route('quran-home-practice.index')
            ->with('success', 'Home practice updated successfully!');
    }

    /**
     * Remove the specified practice log.
     */
    public function destroy(QuranHomePractice $quranHomePractice)
    {
        $user = auth()->user();

        // Authorization check
        if ($user->role === 'guardian' && $quranHomePractice->guardian_id !== $user->guardian->id) {
            abort(403, 'Unauthorized access.');
        }

        $quranHomePractice->delete();

        return redirect()->route('quran-home-practice.index')
            ->with('success', 'Home practice deleted successfully!');
    }

    /**
     * Get practice statistics for a student.
     */
    public function studentStats(Request $request, $studentId)
    {
        $user = auth()->user();
        $student = Student::findOrFail($studentId);

        // Authorization check
        if ($user->role === 'guardian' && $student->guardian_id !== $user->guardian->id) {
            abort(403, 'Unauthorized access.');
        }

        $period = $request->get('period', 'week'); // week, month, year

        $query = QuranHomePractice::where('student_id', $studentId);

        if ($period === 'week') {
            $query->thisWeek();
        } elseif ($period === 'month') {
            $query->thisMonth();
        }

        $practices = $query->get();

        $stats = [
            'total_sessions' => $practices->count(),
            'total_minutes' => $practices->sum('duration_minutes'),
            'total_hours' => round($practices->sum('duration_minutes') / 60, 1),
            'avg_duration' => $practices->count() > 0 ? round($practices->avg('duration_minutes'), 0) : 0,
            'by_type' => [
                'memorize' => $practices->where('practice_type', 'memorize')->count(),
                'revise' => $practices->where('practice_type', 'revise')->count(),
                'read' => $practices->where('practice_type', 'read')->count(),
            ],
        ];

        return response()->json($stats);
    }
}
