<?php

namespace App\Http\Controllers;

use App\Models\QuranTracking;
use App\Models\Student;
use App\Services\QuranApiService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuranTrackingController extends Controller
{
    protected $quranApi;

    public function __construct(QuranApiService $quranApi)
    {
        $this->quranApi = $quranApi;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Build student query based on user role
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            $studentsQuery = Student::whereIn('grade_id', $teacherGradeIds);
        } else {
            $studentsQuery = Student::query();
        }

        // Apply filters to students
        $studentsQuery->with(['grade', 'quranTracking' => function ($query) {
                $query->latest('date')->limit(1);
            }])
            ->where('status', 'active')
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->where(function($query) use ($request) {
                    $query->where('first_name', 'like', '%' . $request->search . '%')
                        ->orWhere('last_name', 'like', '%' . $request->search . '%')
                        ->orWhere('admission_number', 'like', '%' . $request->search . '%');
                });
            })
            ->when($request->filled('grade_id'), function ($q) use ($request) {
                $q->where('grade_id', $request->grade_id);
            })
            ->when($request->filled('reading_type'), function ($q) use ($request) {
                $q->whereHas('quranTracking', function ($query) use ($request) {
                    $query->where('reading_type', $request->reading_type);
                });
            });

        $students = $studentsQuery->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate(20)
            ->withQueryString();

        // Get surahs for display
        $surahs = $this->quranApi->getSurahs();
        $surahsMap = collect($surahs)->keyBy('id')->toArray();

        // Transform students to include latest tracking with surah names
        $students->getCollection()->transform(function ($student) use ($surahsMap) {
            $latestTracking = $student->quranTracking->first();

            if ($latestTracking) {
                // Handle multi-surah display
                if ($latestTracking->surah_from == $latestTracking->surah_to) {
                    $latestTracking->surah_name = $surahsMap[$latestTracking->surah_from]['name'] ?? "Surah {$latestTracking->surah_from}";
                    $latestTracking->surah_name_arabic = $surahsMap[$latestTracking->surah_from]['name_arabic'] ?? '';
                } else {
                    $fromName = $surahsMap[$latestTracking->surah_from]['name'] ?? "Surah {$latestTracking->surah_from}";
                    $toName = $surahsMap[$latestTracking->surah_to]['name'] ?? "Surah {$latestTracking->surah_to}";
                    $latestTracking->surah_name = "{$fromName} - {$toName}";
                    $latestTracking->surah_name_arabic = '';
                }

                // Calculate total verses
                $latestTracking->calculated_total_verses = $this->quranApi->calculateTotalVerses(
                    $latestTracking->surah_from,
                    $latestTracking->verse_from,
                    $latestTracking->surah_to,
                    $latestTracking->verse_to
                );
            }

            $student->latest_tracking = $latestTracking;
            unset($student->quranTracking);

            return $student;
        });

        // Get grades for filter dropdown (including Unassigned)
        $grades = $user->isTeacher()
            ? $user->teacher->grades
            : \App\Models\Grade::where('status', 'active')
                ->orderByRaw("CASE WHEN code = 'UNASSIGNED' THEN 1 ELSE 0 END")
                ->orderBy('level')
                ->orderBy('name')
                ->get();

        return Inertia::render('QuranTracking/Index', [
            'students' => $students,
            'grades' => $grades,
            'filters' => $request->only(['search', 'grade_id', 'reading_type']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $user = $request->user();

        // Build student query based on user role
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            $studentsQuery = Student::whereIn('grade_id', $teacherGradeIds);
        } else {
            $studentsQuery = Student::query();
        }

        $students = $studentsQuery->where('status', 'active')
            ->with('grade')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->full_name,
                    'admission_number' => $student->admission_number,
                    'grade_name' => $student->grade ? $student->grade->name : 'N/A',
                ];
            });

        $surahs = $this->quranApi->getSurahs();

        // Check if pre-selected student from query parameter
        $preSelectedStudentId = $request->query('student_id');

        return Inertia::render('QuranTracking/Create', [
            'students' => $students,
            'surahs' => $surahs,
            'preSelectedStudentId' => $preSelectedStudentId,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'date' => 'required|date',
            'reading_type' => 'required|in:new_learning,revision,subac',
            'surah_from' => 'required|integer|min:1|max:114',
            'surah_to' => 'required|integer|min:1|max:114',
            'verse_from' => 'required|integer|min:1',
            'verse_to' => 'required|integer|min:1',
            'page_from' => 'nullable|integer|min:1|max:604',
            'page_to' => 'nullable|integer|min:1|max:604',
            'difficulty' => 'required|in:very_well,middle,difficult',
            'pages_memorized' => 'nullable|integer|min:0',
            'surahs_memorized' => 'nullable|integer|min:0',
            'juz_memorized' => 'nullable|integer|min:0|max:30',
            'subac_participation' => 'nullable|boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Validate multi-surah verse range using API
        $validation = $this->quranApi->validateMultiSurahRange(
            $validated['surah_from'],
            $validated['verse_from'],
            $validated['surah_to'],
            $validated['verse_to']
        );

        if (!$validation['valid']) {
            return back()->withErrors(['verse_range' => $validation['message']])->withInput();
        }

        // Calculate total verses
        $totalVerses = $this->quranApi->calculateTotalVerses(
            $validated['surah_from'],
            $validated['verse_from'],
            $validated['surah_to'],
            $validated['verse_to']
        );

        // Calculate page range from API if not provided
        if (empty($validated['page_from']) || empty($validated['page_to'])) {
            $pageRange = $this->quranApi->calculatePageRange(
                $validated['surah_from'],
                $validated['verse_from'],
                $validated['surah_to'],
                $validated['verse_to']
            );

            if ($pageRange) {
                $validated['page_from'] = $pageRange['page_from'];
                $validated['page_to'] = $pageRange['page_to'];
            }
        }

        $validated['teacher_id'] = auth()->id();
        $validated['school_id'] = auth()->user()->school_id;
        $validated['subac_participation'] = $validated['subac_participation'] ?? false;

        QuranTracking::create($validated);

        return redirect()->route('quran-tracking.index')
            ->with('success', "Quran tracking record created successfully. Total verses: {$totalVerses}");
    }

    /**
     * Display the specified resource.
     */
    public function show(QuranTracking $quranTracking)
    {
        $quranTracking->load(['student', 'teacher']);

        // Handle multi-surah display
        $surahs = $this->quranApi->getSurahs();
        $surahsById = collect($surahs)->keyBy('id');

        if ($quranTracking->surah_from == $quranTracking->surah_to) {
            $surah = $surahsById->get($quranTracking->surah_from);
            $quranTracking->surah_name = $surah['name'] ?? "Surah {$quranTracking->surah_from}";
            $quranTracking->surah_name_arabic = $surah['name_arabic'] ?? '';
        } else {
            $fromSurah = $surahsById->get($quranTracking->surah_from);
            $toSurah = $surahsById->get($quranTracking->surah_to);
            $quranTracking->surah_name = ($fromSurah['name'] ?? "Surah {$quranTracking->surah_from}") .
                                         " - " .
                                         ($toSurah['name'] ?? "Surah {$quranTracking->surah_to}");
            $quranTracking->surah_name_arabic = '';
        }

        // Calculate total verses for this record
        $quranTracking->calculated_total_verses = $this->quranApi->calculateTotalVerses(
            $quranTracking->surah_from,
            $quranTracking->verse_from,
            $quranTracking->surah_to,
            $quranTracking->verse_to
        );

        // Get student's overall stats (simplified for now - can be enhanced later)
        $studentStats = QuranTracking::where('student_id', $quranTracking->student_id)
            ->selectRaw('
                COUNT(*) as total_sessions,
                SUM(CASE WHEN reading_type = "new_learning" THEN 1 ELSE 0 END) as new_learning_count,
                SUM(CASE WHEN reading_type = "revision" THEN 1 ELSE 0 END) as revision_count,
                SUM(CASE WHEN reading_type = "subac" THEN 1 ELSE 0 END) as subac_count
            ')
            ->first();

        return Inertia::render('QuranTracking/Show', [
            'tracking' => $quranTracking,
            'studentStats' => $studentStats,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, QuranTracking $quranTracking)
    {
        $quranTracking->load(['student']);

        $user = $request->user();

        // Build student query based on user role
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            $studentsQuery = Student::whereIn('grade_id', $teacherGradeIds);
        } else {
            $studentsQuery = Student::query();
        }

        $students = $studentsQuery->where('status', 'active')
            ->with('grade')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->full_name,
                    'admission_number' => $student->admission_number,
                    'grade_name' => $student->grade ? $student->grade->name : 'N/A',
                ];
            });

        $surahs = $this->quranApi->getSurahs();

        return Inertia::render('QuranTracking/Edit', [
            'tracking' => $quranTracking,
            'students' => $students,
            'surahs' => $surahs,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, QuranTracking $quranTracking)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'date' => 'required|date',
            'reading_type' => 'required|in:new_learning,revision,subac',
            'surah_from' => 'required|integer|min:1|max:114',
            'surah_to' => 'required|integer|min:1|max:114',
            'verse_from' => 'required|integer|min:1',
            'verse_to' => 'required|integer|min:1',
            'page_from' => 'nullable|integer|min:1|max:604',
            'page_to' => 'nullable|integer|min:1|max:604',
            'difficulty' => 'required|in:very_well,middle,difficult',
            'pages_memorized' => 'nullable|integer|min:0',
            'surahs_memorized' => 'nullable|integer|min:0',
            'juz_memorized' => 'nullable|integer|min:0|max:30',
            'subac_participation' => 'nullable|boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Validate multi-surah verse range using API
        $validation = $this->quranApi->validateMultiSurahRange(
            $validated['surah_from'],
            $validated['verse_from'],
            $validated['surah_to'],
            $validated['verse_to']
        );

        if (!$validation['valid']) {
            return back()->withErrors(['verse_range' => $validation['message']])->withInput();
        }

        // Calculate total verses
        $totalVerses = $this->quranApi->calculateTotalVerses(
            $validated['surah_from'],
            $validated['verse_from'],
            $validated['surah_to'],
            $validated['verse_to']
        );

        // Calculate page range from API if not provided
        if (empty($validated['page_from']) || empty($validated['page_to'])) {
            $pageRange = $this->quranApi->calculatePageRange(
                $validated['surah_from'],
                $validated['verse_from'],
                $validated['surah_to'],
                $validated['verse_to']
            );

            if ($pageRange) {
                $validated['page_from'] = $pageRange['page_from'];
                $validated['page_to'] = $pageRange['page_to'];
            }
        }

        $validated['subac_participation'] = $validated['subac_participation'] ?? false;

        $quranTracking->update($validated);

        return redirect()->route('quran-tracking.index')
            ->with('success', "Quran tracking record updated successfully. Total verses: {$totalVerses}");
    }

    /**
     * Show student report with all sessions and analytics.
     */
    public function studentReport(Student $student)
    {
        // Get all tracking sessions for this student
        $sessions = QuranTracking::where('student_id', $student->id)
            ->with(['teacher'])
            ->orderBy('date', 'desc')
            ->get();

        // Get surahs for display
        $surahs = $this->quranApi->getSurahs();
        $surahsMap = collect($surahs)->keyBy('id')->toArray();

        // Add surah names, total verses, and page numbers to sessions
        $sessions->transform(function ($record) use ($surahsMap) {
            // Calculate page numbers if not set (for old records) - do this FIRST before adding temporary attributes
            if (!$record->page_from || !$record->page_to) {
                $pageRange = $this->quranApi->calculatePageRange(
                    $record->surah_from,
                    $record->verse_from,
                    $record->surah_to,
                    $record->verse_to
                );

                if ($pageRange) {
                    // Update only the page fields in the database
                    $record->update([
                        'page_from' => $pageRange['page_from'],
                        'page_to' => $pageRange['page_to'],
                    ]);
                }
            }

            // Handle multi-surah display (temporary attributes for display only)
            if ($record->surah_from == $record->surah_to) {
                $record->surah_name = $surahsMap[$record->surah_from]['name'] ?? "Surah {$record->surah_from}";
                $record->surah_name_arabic = $surahsMap[$record->surah_from]['name_arabic'] ?? '';
            } else {
                $fromName = $surahsMap[$record->surah_from]['name'] ?? "Surah {$record->surah_from}";
                $toName = $surahsMap[$record->surah_to]['name'] ?? "Surah {$record->surah_to}";
                $record->surah_name = "{$fromName} - {$toName}";
                $record->surah_name_arabic = '';
            }

            // Calculate total verses (temporary attribute for display only)
            $record->calculated_total_verses = $this->quranApi->calculateTotalVerses(
                $record->surah_from,
                $record->verse_from,
                $record->surah_to,
                $record->verse_to
            );

            return $record;
        });

        // Calculate analytics
        $totalPages = $sessions->sum(function ($session) {
            if ($session->page_from && $session->page_to) {
                return ($session->page_to - $session->page_from) + 1;
            }
            return 0;
        });

        // Get unique surahs covered (only count new_learning sessions for memorization)
        $newLearningSessions = $sessions->where('reading_type', 'new_learning');
        $uniqueSurahs = $newLearningSessions->flatMap(function ($session) {
            // Get all surahs between surah_from and surah_to
            $surahs = [];
            for ($i = $session->surah_from; $i <= $session->surah_to; $i++) {
                $surahs[] = $i;
            }
            return $surahs;
        })->unique()->count();

        // Calculate pages memorized (only from new_learning sessions)
        $pagesMemorized = $newLearningSessions->sum(function ($session) {
            if ($session->page_from && $session->page_to) {
                return ($session->page_to - $session->page_from) + 1;
            }
            return 0;
        });

        // Calculate juz memorized (each juz is approximately 20 pages)
        // We'll be conservative and only count complete juz
        $juzMemorized = floor($pagesMemorized / 20);

        $analytics = [
            'total_sessions' => $sessions->count(),
            'total_verses' => $sessions->sum('calculated_total_verses'),
            'total_pages' => $totalPages,
            'new_learning_count' => $sessions->where('reading_type', 'new_learning')->count(),
            'revision_count' => $sessions->where('reading_type', 'revision')->count(),
            'subac_count' => $sessions->where('reading_type', 'subac')->count(),
            'very_well_count' => $sessions->where('difficulty', 'very_well')->count(),
            'middle_count' => $sessions->where('difficulty', 'middle')->count(),
            'difficult_count' => $sessions->where('difficulty', 'difficult')->count(),
            'pages_memorized' => $pagesMemorized,
            'surahs_memorized' => $uniqueSurahs,
            'juz_memorized' => $juzMemorized,
        ];

        // Group sessions by month for chart data
        $sessionsByMonth = $sessions->groupBy(function ($session) {
            return \Carbon\Carbon::parse($session->date)->format('Y-m');
        })->map(function ($monthSessions) {
            return [
                'count' => $monthSessions->count(),
                'verses' => $monthSessions->sum('calculated_total_verses'),
            ];
        });

        // Group by reading type for pie chart
        $sessionsByType = [
            'new_learning' => $sessions->where('reading_type', 'new_learning')->count(),
            'revision' => $sessions->where('reading_type', 'revision')->count(),
            'subac' => $sessions->where('reading_type', 'subac')->count(),
        ];

        // Group by difficulty for pie chart
        $sessionsByDifficulty = [
            'very_well' => $sessions->where('difficulty', 'very_well')->count(),
            'middle' => $sessions->where('difficulty', 'middle')->count(),
            'difficult' => $sessions->where('difficulty', 'difficult')->count(),
        ];

        return Inertia::render('QuranTracking/StudentReport', [
            'student' => $student->load('grade'),
            'sessions' => $sessions,
            'analytics' => $analytics,
            'sessionsByMonth' => $sessionsByMonth,
            'sessionsByType' => $sessionsByType,
            'sessionsByDifficulty' => $sessionsByDifficulty,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(QuranTracking $quranTracking)
    {
        $quranTracking->delete();

        return redirect()->route('quran-tracking.index')
            ->with('success', 'Quran tracking record deleted successfully.');
    }

    /**
     * API endpoint to get surah details.
     */
    public function getSurahDetails(int $surahNumber)
    {
        $surah = $this->quranApi->getSurah($surahNumber);

        if (!$surah) {
            return response()->json(['error' => 'Surah not found'], 404);
        }

        return response()->json($surah);
    }
}

