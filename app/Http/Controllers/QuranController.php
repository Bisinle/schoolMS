<?php

namespace App\Http\Controllers;

use App\Models\QuranHomePractice;
use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuranController extends Controller
{
    /**
     * Display the Quran module dashboard.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Overall statistics
        $stats = [
            'totalSessions' => QuranHomework::count(),
            'studentsTracked' => QuranHomework::distinct('student_id')->count('student_id'),
            'pagesMemorized' => QuranHomework::where('reading_type', 'new_learning')->sum('pages_memorized'),
            'juzMemorized' => QuranHomework::where('reading_type', 'new_learning')->sum('juz_memorized'),

            // Module-specific stats
            'tracking' => [
                'total' => QuranHomework::count(),
                'thisMonth' => QuranHomework::whereMonth('assigned_date', now()->month)
                    ->whereYear('assigned_date', now()->year)
                    ->count(),
            ],
            'homework' => [
                'total' => QuranHomework::count(),
                'thisMonth' => QuranHomework::whereMonth('assigned_date', now()->month)
                    ->whereYear('assigned_date', now()->year)
                    ->count(),
            ],
            'schedule' => [
                'total' => QuranSchedule::count(),
                'thisMonth' => QuranSchedule::whereMonth('start_date', now()->month)
                    ->whereYear('start_date', now()->year)
                    ->count(),
            ],
            'homePractice' => [
                'total' => QuranHomePractice::count(),
                'thisMonth' => QuranHomePractice::whereMonth('practice_date', now()->month)
                    ->whereYear('practice_date', now()->year)
                    ->count(),
            ],
        ];

        // Recent sessions (last 10)
        $recentSessions = QuranHomework::with(['student', 'teacher'])
            ->orderBy('assigned_date', 'desc')
            ->take(10)
            ->get()
            ->map(function ($homework) {
                return [
                    'id' => $homework->id,
                    'student_name' => $homework->student->full_name,
                    'teacher_name' => $homework->teacher->name ?? 'N/A',
                    'date' => $homework->assigned_date->format('M d, Y'),
                    'reading_type' => $homework->reading_type_label,
                    'pages_memorized' => $homework->pages_memorized,
                ];
            });

        return Inertia::render('Quran/Index', [
            'stats' => $stats,
            'recentSessions' => $recentSessions,
        ]);
    }
}
