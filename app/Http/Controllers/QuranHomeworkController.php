<?php

namespace App\Http\Controllers;

use App\External\QuranApiClient;
use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuranHomeworkController extends Controller
{
    protected $quranApi;

    public function __construct(QuranApiClient $quranApi)
    {
        $this->quranApi = $quranApi;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $query = QuranHomework::with(['student.grade', 'teacher', 'schedule'])
            ->where('school_id', $user->school_id);

        if ($user->isTeacher()) {
            $query->where('teacher_id', $user->id);
        }

        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('student_id'), fn ($q) => $q->where('student_id', $request->student_id))
            ->when($request->filled('reading_type'), fn ($q) => $q->where('reading_type', $request->reading_type));

        $homework = $query->orderBy('assigned_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Quran/Homework/Index', [
            'homework' => $homework,
            'students' => $this->studentsForUser($user),
            'filters' => $request->only(['status', 'student_id', 'reading_type']),
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        // Homework's From point is always derived from the student's active
        // Schedule (or the previous entry) — never freely chosen — so a
        // student without one isn't offered here.
        $students = $this->studentsForUser($user)
            ->filter(fn ($student) => $student->activeQuranSchedule !== null)
            ->values();

        return Inertia::render('Quran/Homework/Create', [
            'students' => $students,
            'surahs' => $this->quranApi->getSurahs(),
            'preSelectedStudentId' => $request->query('student_id'),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', QuranHomework::class);

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'reading_type' => 'required|in:new_learning,revision,subac',
            'surah_to' => 'required|integer|min:1|max:114',
            'verse_to' => 'required|integer|min:1',
            'page_from' => 'nullable|integer|min:1|max:604',
            'page_to' => 'nullable|integer|min:1|max:604',
            'notes' => 'nullable|string|max:1000',
        ]);

        $schedule = QuranSchedule::where('student_id', $validated['student_id'])
            ->where('is_active', true)
            ->first();

        if (! $schedule) {
            return back()->withErrors([
                'student_id' => 'This student has no active Quran schedule. Create one before assigning homework.',
            ])->withInput();
        }

        [$surahFrom, $verseFrom] = $this->deriveFromPoint($schedule);

        $validation = $this->quranApi->validateMultiSurahRange(
            $surahFrom,
            $validated['surah_to'],
            $verseFrom,
            $validated['verse_to']
        );

        if (! $validation['valid']) {
            return back()->withErrors(['verse_range' => $validation['error']])->withInput();
        }

        $homework = QuranHomework::create([
            'student_id' => $validated['student_id'],
            'teacher_id' => auth()->id(),
            'school_id' => auth()->user()->school_id,
            'quran_schedule_id' => $schedule->id,
            'assigned_date' => now(),
            'status' => 'pending',
            'reading_type' => $validated['reading_type'],
            'surah_from' => $surahFrom,
            'verse_from' => $verseFrom,
            'surah_to' => $validated['surah_to'],
            'verse_to' => $validated['verse_to'],
            'page_from' => $validated['page_from'] ?? null,
            'page_to' => $validated['page_to'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('quran-homework.show', $homework)
            ->with('success', 'Homework assigned successfully!');
    }

    /**
     * The rule that stops Homework drifting from its Schedule: the first
     * entry starts where the Schedule starts; every entry after that starts
     * where the previous one ended.
     */
    protected function deriveFromPoint(QuranSchedule $schedule): array
    {
        $previous = QuranHomework::where('quran_schedule_id', $schedule->id)
            ->orderByDesc('assigned_date')
            ->orderByDesc('id')
            ->first();

        if ($previous) {
            return [$previous->surah_to, $previous->verse_to];
        }

        return [$schedule->surah_from, $schedule->verse_from];
    }

    /**
     * Backs the Create screen's read-only "Starting from" display once a
     * student is selected, before the teacher enters where it ends.
     */
    public function nextFrom(Student $student)
    {
        $schedule = QuranSchedule::where('student_id', $student->id)
            ->where('is_active', true)
            ->first();

        if (! $schedule) {
            return response()->json(['error' => 'No active schedule for this student.'], 404);
        }

        [$surahFrom, $verseFrom] = $this->deriveFromPoint($schedule);

        return response()->json(['surah_from' => $surahFrom, 'verse_from' => $verseFrom]);
    }

    public function show(Request $request, QuranHomework $quranHomework)
    {
        $this->authorize('view', $quranHomework);

        $user = $request->user();
        if ($user->isGuardian()) {
            $guardian = $user->guardian;
            if (! $guardian || ! $guardian->students()->where('students.id', $quranHomework->student_id)->exists()) {
                abort(403, "You can only view your own children's Quran homework.");
            }
        }

        $quranHomework->load(['student', 'teacher', 'schedule', 'assessment']);

        $surahs = $this->quranApi->getSurahs();
        $surahsById = collect($surahs)->keyBy('id');

        if ($quranHomework->surah_from == $quranHomework->surah_to) {
            $surah = $surahsById->get($quranHomework->surah_from);
            $quranHomework->surah_name = $surah['name_simple'] ?? "Surah {$quranHomework->surah_from}";
            $quranHomework->surah_name_arabic = $surah['name_arabic'] ?? '';
        } else {
            $fromSurah = $surahsById->get($quranHomework->surah_from);
            $toSurah = $surahsById->get($quranHomework->surah_to);
            $quranHomework->surah_name = ($fromSurah['name_simple'] ?? "Surah {$quranHomework->surah_from}").
                                         ' - '.
                                         ($toSurah['name_simple'] ?? "Surah {$quranHomework->surah_to}");
            $quranHomework->surah_name_arabic = '';
        }

        $quranHomework->calculated_total_verses = $this->quranApi->calculateTotalVerses(
            $quranHomework->surah_from,
            $quranHomework->surah_to,
            $quranHomework->verse_from,
            $quranHomework->verse_to
        );

        $quranHomework->starting_verse_reference = "{$quranHomework->surah_from}:{$quranHomework->verse_from}";

        if ($quranHomework->page_from && $quranHomework->page_to) {
            $quranHomework->page_from_verses = $this->quranApi->getPageVerses($quranHomework->page_from);
            $quranHomework->page_to_verses = $quranHomework->page_to !== $quranHomework->page_from
                ? $this->quranApi->getPageVerses($quranHomework->page_to)
                : [];
        }

        return Inertia::render('Quran/Homework/Show', ['homework' => $quranHomework]);
    }

    public function edit(Request $request, QuranHomework $quranHomework)
    {
        $this->authorize('update', $quranHomework);

        $quranHomework->load(['student', 'schedule']);

        return Inertia::render('Quran/Homework/Edit', [
            'homework' => $quranHomework,
            'surahs' => $this->quranApi->getSurahs(),
        ]);
    }

    public function update(Request $request, QuranHomework $quranHomework)
    {
        $this->authorize('update', $quranHomework);

        $validated = $request->validate([
            'surah_to' => 'required|integer|min:1|max:114',
            'verse_to' => 'required|integer|min:1',
            'page_from' => 'nullable|integer|min:1|max:604',
            'page_to' => 'nullable|integer|min:1|max:604',
            'reading_type' => 'required|in:new_learning,revision,subac',
            'notes' => 'nullable|string|max:1000',
        ]);

        $validation = $this->quranApi->validateMultiSurahRange(
            $quranHomework->surah_from,
            $validated['surah_to'],
            $quranHomework->verse_from,
            $validated['verse_to']
        );

        if (! $validation['valid']) {
            return back()->withErrors(['verse_range' => $validation['error']])->withInput();
        }

        $quranHomework->update($validated);

        return redirect()->route('quran-homework.show', $quranHomework)
            ->with('success', 'Homework updated successfully!');
    }

    public function destroy(QuranHomework $quranHomework)
    {
        $this->authorize('delete', $quranHomework);

        $quranHomework->delete();

        return redirect()->route('quran-homework.index')
            ->with('success', 'Homework deleted successfully.');
    }

    /**
     * Grading — the redesigned "Tracking" step. Records an assessment
     * directly against the Homework entry that already exists; no new
     * record is created. Only reachable when work was actually done —
     * absent/not-prepared go through markUngraded() instead.
     */
    public function grade(Request $request, QuranHomework $quranHomework)
    {
        $this->authorize('update', $quranHomework);

        $validated = $request->validate([
            'quality_rating' => 'required|in:excellent,very_good,moderate,poor',
            'subac_participation' => 'nullable|boolean',
            'fluency_rating' => 'nullable|integer|min:1|max:5',
            'tajweed_rating' => 'nullable|integer|min:1|max:5',
            'mistakes_count' => 'nullable|integer|min:0',
            'assessment_notes' => 'nullable|string|max:1000',
        ]);

        $quranHomework->update([
            'status' => 'graded',
            'quality_rating' => $validated['quality_rating'],
            'subac_participation' => $validated['subac_participation'] ?? false,
        ]);

        if (($validated['fluency_rating'] ?? null) !== null || ($validated['tajweed_rating'] ?? null) !== null) {
            $quranHomework->assessment()->updateOrCreate([], [
                'fluency_rating' => $validated['fluency_rating'] ?? null,
                'tajweed_rating' => $validated['tajweed_rating'] ?? null,
                'mistakes_count' => $validated['mistakes_count'] ?? 0,
                'assessment_notes' => $validated['assessment_notes'] ?? null,
            ]);
        } elseif ($quranHomework->assessment) {
            // A re-grade that supplies neither rating must not leave a
            // stale assessment from a prior grading pass behind.
            $quranHomework->assessment()->delete();
        }

        return back()->with('success', 'Homework graded successfully!');
    }

    /**
     * Records a non-graded outcome — Absent (didn't attend, nothing to
     * assess) or Not Prepared (attended, but didn't do the work) — as a
     * first-class result, not a gap in the record. Either one still counts
     * against Schedule progress (as "not graded"), same as a missing entry
     * would, but is now an explicit, visible fact rather than silence.
     */
    public function markUngraded(Request $request, QuranHomework $quranHomework)
    {
        $this->authorize('update', $quranHomework);

        $validated = $request->validate([
            'status' => 'required|in:absent,not_prepared',
            'notes' => 'nullable|string|max:1000',
        ]);

        $quranHomework->assessment()->delete();

        $quranHomework->update([
            'status' => $validated['status'],
            'quality_rating' => null,
            'notes' => $validated['notes'] ?? $quranHomework->notes,
        ]);

        return back()->with('success', 'Homework marked '.($validated['status'] === 'absent' ? 'Absent' : 'Not Prepared').'.');
    }

    public function studentReport(Request $request, Student $student)
    {
        $user = $request->user();
        if ($user->isGuardian()) {
            $guardian = $user->guardian;
            if (! $guardian || ! $guardian->students()->where('students.id', $student->id)->exists()) {
                abort(403, "You can only view your own children's Quran reports.");
            }
        }

        $sessions = QuranHomework::where('student_id', $student->id)
            ->with(['teacher', 'assessment'])
            ->orderBy('assigned_date', 'desc')
            ->get();

        $surahs = $this->quranApi->getSurahs();
        $surahsMap = collect($surahs)->keyBy('id')->toArray();

        $sessions->transform(function ($record) use ($surahsMap) {
            if ($record->surah_from == $record->surah_to) {
                $record->surah_name = $surahsMap[$record->surah_from]['name_simple'] ?? "Surah {$record->surah_from}";
                $record->surah_name_arabic = $surahsMap[$record->surah_from]['name_arabic'] ?? '';
            } else {
                $fromName = $surahsMap[$record->surah_from]['name_simple'] ?? "Surah {$record->surah_from}";
                $toName = $surahsMap[$record->surah_to]['name_simple'] ?? "Surah {$record->surah_to}";
                $record->surah_name = "{$fromName} - {$toName}";
                $record->surah_name_arabic = '';
            }

            $record->calculated_total_verses = $this->quranApi->calculateTotalVerses(
                $record->surah_from, $record->surah_to, $record->verse_from, $record->verse_to
            );

            return $record;
        });

        $graded = $sessions->where('status', 'graded');
        $newLearningGraded = $graded->where('reading_type', 'new_learning');

        $analytics = [
            'total_sessions' => $sessions->count(),
            'graded_count' => $graded->count(),
            'absent_count' => $sessions->where('status', 'absent')->count(),
            'not_prepared_count' => $sessions->where('status', 'not_prepared')->count(),
            'pending_count' => $sessions->where('status', 'pending')->count(),
            'total_verses' => $graded->sum('calculated_total_verses'),
            'pages_memorized' => $newLearningGraded->sum('pages_memorized'),
            'surahs_memorized' => $newLearningGraded->sum('surahs_memorized'),
            'juz_memorized' => $newLearningGraded->sum('juz_memorized'),
        ];

        return Inertia::render('Quran/Homework/StudentReport', [
            'student' => $student->load('grade'),
            'sessions' => $sessions,
            'analytics' => $analytics,
        ]);
    }

    public function studentHomework(Request $request, Student $student)
    {
        $user = $request->user();
        if ($user->isGuardian()) {
            $guardian = $user->guardian;
            if (! $guardian || ! $guardian->students()->where('students.id', $student->id)->exists()) {
                abort(403, "You can only view your own children's homework.");
            }
        }

        $homework = QuranHomework::where('student_id', $student->id)
            ->with('teacher')
            ->orderBy('assigned_date', 'desc')
            ->get();

        return Inertia::render('Quran/Homework/StudentView', [
            'student' => $student->load('grade'),
            'homework' => $homework,
        ]);
    }

    public function getSurahDetails(int $surahNumber)
    {
        $surah = $this->quranApi->getSurah($surahNumber);

        return $surah ? response()->json($surah) : response()->json(['error' => 'Surah not found'], 404);
    }

    public function getPageImage(int $pageNumber, Request $request)
    {
        try {
            $quality = $request->query('quality', 'medium');
            $imageUrl = $this->quranApi->getPageImageUrl($pageNumber, $quality);

            return response()->json(['page_number' => $pageNumber, 'image_url' => $imageUrl, 'quality' => $quality]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function getPageDetails(int $pageNumber)
    {
        return response()->json($this->quranApi->getPageDetails($pageNumber));
    }

    public function getPageVerses(int $pageNumber)
    {
        return response()->json($this->quranApi->getPageVerses($pageNumber));
    }

    public function getPageRange(Request $request)
    {
        $validated = $request->validate([
            'surah_from' => 'required|integer|min:1|max:114',
            'surah_to' => 'required|integer|min:1|max:114',
            'verse_from' => 'required|integer|min:1',
            'verse_to' => 'required|integer|min:1',
        ]);

        return response()->json($this->quranApi->calculatePageRange(
            $validated['surah_from'], $validated['surah_to'], $validated['verse_from'], $validated['verse_to']
        ));
    }

    public function getAllJuz()
    {
        return response()->json($this->quranApi->getAllJuz());
    }

    public function getVerseText(int $surahNumber, int $verseNumber)
    {
        $text = $this->quranApi->getVerseText($surahNumber, $verseNumber);

        if (! $text) {
            return response()->json(['error' => 'Verse not found'], 404);
        }

        return response()->json(['surah_number' => $surahNumber, 'verse_number' => $verseNumber, 'text' => $text]);
    }

    protected function studentsForUser($user)
    {
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            $query = Student::whereIn('grade_id', $teacherGradeIds);
        } else {
            $query = Student::query();
        }

        return $query->where('status', 'active')
            ->with(['grade', 'activeQuranSchedule'])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }
}
