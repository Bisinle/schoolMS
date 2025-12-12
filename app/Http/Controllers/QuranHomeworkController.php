<?php

namespace App\Http\Controllers;

use App\Models\QuranHomework;
use App\Models\Student;
use App\Services\QuranApiService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuranHomeworkController extends Controller
{
    protected $quranApi;

    public function __construct(QuranApiService $quranApi)
    {
        $this->quranApi = $quranApi;
    }

    /**
     * Display a listing of homework assignments.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Build homework query
        $homeworkQuery = QuranHomework::with(['student.grade', 'teacher'])
            ->where('school_id', $user->school_id);

        // Filter by teacher if user is a teacher
        if ($user->isTeacher()) {
            $homeworkQuery->where('teacher_id', $user->id);
        }

        // Apply filters
        $homeworkQuery->when($request->filled('status'), function ($q) use ($request) {
            if ($request->status === 'pending') {
                $q->pending();
            } elseif ($request->status === 'completed') {
                $q->completed();
            } elseif ($request->status === 'overdue') {
                $q->overdue();
            }
        })
        ->when($request->filled('student_id'), function ($q) use ($request) {
            $q->where('student_id', $request->student_id);
        })
        ->when($request->filled('homework_type'), function ($q) use ($request) {
            $q->where('homework_type', $request->homework_type);
        });

        $homework = $homeworkQuery->orderBy('due_date', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Get students for filter dropdown
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            $students = Student::whereIn('grade_id', $teacherGradeIds)
                ->where('status', 'active')
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'admission_number']);
        } else {
            $students = Student::where('school_id', $user->school_id)
                ->where('status', 'active')
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'admission_number']);
        }

        return Inertia::render('Quran/Homework/Index', [
            'homework' => $homework,
            'students' => $students,
            'filters' => $request->only(['status', 'student_id', 'homework_type']),
        ]);
    }

    /**
     * Show the form for creating a new homework assignment.
     */
    public function create(Request $request)
    {
        $user = $request->user();

        // Get students
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            $students = Student::whereIn('grade_id', $teacherGradeIds)
                ->where('status', 'active')
                ->with('grade')
                ->orderBy('first_name')
                ->get();
        } else {
            $students = Student::where('school_id', $user->school_id)
                ->where('status', 'active')
                ->with('grade')
                ->orderBy('first_name')
                ->get();
        }

        // Get all surahs from API
        $surahs = $this->quranApi->getSurahs();

        $preSelectedStudentId = $request->query('student_id');

        return Inertia::render('Quran/Homework/Create', [
            'students' => $students,
            'surahs' => $surahs,
            'preSelectedStudentId' => $preSelectedStudentId,
        ]);
    }

    /**
     * Store a newly created homework assignment.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'assigned_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:assigned_date',
            'homework_type' => 'required|in:memorize,revise,read',
            'surah_from' => 'required|integer|min:1|max:114',
            'verse_from' => 'required|integer|min:1',
            'surah_to' => 'required|integer|min:1|max:114',
            'verse_to' => 'required|integer|min:1',
            'page_from' => 'nullable|integer|min:1|max:604',
            'page_to' => 'nullable|integer|min:1|max:604',
            'teacher_instructions' => 'nullable|string|max:1000',
        ]);

        // Validate verse range using API
        $validation = $this->quranApi->validateMultiSurahRange(
            $validated['surah_from'],
            $validated['surah_to'],
            $validated['verse_from'],
            $validated['verse_to']
        );

        if (!$validation['valid']) {
            return back()->withErrors(['verse_range' => $validation['error']])->withInput();
        }

        $validated['teacher_id'] = auth()->id();
        $validated['school_id'] = auth()->user()->school_id;

        QuranHomework::create($validated);

        return redirect()->route('quran-homework.index')
            ->with('success', 'Homework assigned successfully!');
    }

    /**
     * Display the specified homework assignment.
     */
    public function show(QuranHomework $quranHomework)
    {
        $quranHomework->load(['student.grade', 'teacher']);

        // Get surah names from API
        $surahFrom = $this->quranApi->getSurah($quranHomework->surah_from);
        $surahTo = $this->quranApi->getSurah($quranHomework->surah_to);

        return Inertia::render('Quran/Homework/Show', [
            'homework' => $quranHomework,
            'surahFrom' => $surahFrom,
            'surahTo' => $surahTo,
        ]);
    }

    /**
     * Show the form for editing the specified homework assignment.
     */
    public function edit(QuranHomework $quranHomework)
    {
        $user = auth()->user();

        // Get students
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            $students = Student::whereIn('grade_id', $teacherGradeIds)
                ->where('status', 'active')
                ->with('grade')
                ->orderBy('first_name')
                ->get();
        } else {
            $students = Student::where('school_id', $user->school_id)
                ->where('status', 'active')
                ->with('grade')
                ->orderBy('first_name')
                ->get();
        }

        // Get all surahs from API
        $surahs = $this->quranApi->getSurahs();

        $quranHomework->load('student');

        return Inertia::render('Quran/Homework/Edit', [
            'homework' => $quranHomework,
            'students' => $students,
            'surahs' => $surahs,
        ]);
    }

    /**
     * Update the specified homework assignment.
     */
    public function update(Request $request, QuranHomework $quranHomework)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'assigned_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:assigned_date',
            'homework_type' => 'required|in:memorize,revise,read',
            'surah_from' => 'required|integer|min:1|max:114',
            'verse_from' => 'required|integer|min:1',
            'surah_to' => 'required|integer|min:1|max:114',
            'verse_to' => 'required|integer|min:1',
            'page_from' => 'nullable|integer|min:1|max:604',
            'page_to' => 'nullable|integer|min:1|max:604',
            'teacher_instructions' => 'nullable|string|max:1000',
        ]);

        // Validate verse range using API
        $validation = $this->quranApi->validateMultiSurahRange(
            $validated['surah_from'],
            $validated['surah_to'],
            $validated['verse_from'],
            $validated['verse_to']
        );

        if (!$validation['valid']) {
            return back()->withErrors(['verse_range' => $validation['error']])->withInput();
        }

        $quranHomework->update($validated);

        return redirect()->route('quran-homework.index')
            ->with('success', 'Homework updated successfully!');
    }

    /**
     * Remove the specified homework assignment.
     */
    public function destroy(QuranHomework $quranHomework)
    {
        $quranHomework->delete();

        return redirect()->route('quran-homework.index')
            ->with('success', 'Homework deleted successfully!');
    }

    /**
     * Mark homework as complete.
     */
    public function markComplete(Request $request, QuranHomework $quranHomework)
    {
        $validated = $request->validate([
            'completion_notes' => 'nullable|string|max:1000',
        ]);

        $quranHomework->markAsComplete($validated['completion_notes'] ?? null);

        return back()->with('success', 'Homework marked as complete!');
    }

    /**
     * Get pending homework for a specific student (for guardian view).
     */
    public function studentHomework(Student $student)
    {
        $homework = QuranHomework::where('student_id', $student->id)
            ->with('teacher')
            ->orderBy('due_date', 'asc')
            ->get();

        return Inertia::render('Quran/Homework/StudentView', [
            'student' => $student->load('grade'),
            'homework' => $homework,
        ]);
    }
}

