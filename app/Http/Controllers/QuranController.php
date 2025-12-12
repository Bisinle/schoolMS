<?php

namespace App\Http\Controllers;

use App\Models\QuranTracking;
use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use App\Models\QuranHomePractice;
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
            'totalSessions' => QuranTracking::count(),
            'studentsTracked' => QuranTracking::distinct('student_id')->count('student_id'),
            'pagesMemorized' => QuranTracking::where('reading_type', 'new_learning')->sum('pages_memorized'),
            'juzMemorized' => QuranTracking::where('reading_type', 'new_learning')->sum('juz_memorized'),
            
            // Module-specific stats
            'tracking' => [
                'total' => QuranTracking::count(),
                'thisMonth' => QuranTracking::whereMonth('date', now()->month)
                    ->whereYear('date', now()->year)
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
        $recentSessions = QuranTracking::with(['student', 'teacher'])
            ->orderBy('date', 'desc')
            ->take(10)
            ->get()
            ->map(function ($tracking) {
                return [
                    'id' => $tracking->id,
                    'student_name' => $tracking->student->full_name,
                    'teacher_name' => $tracking->teacher->name ?? 'N/A',
                    'date' => $tracking->date->format('M d, Y'),
                    'reading_type' => $tracking->reading_type_label,
                    'pages_memorized' => $tracking->pages_memorized,
                ];
            });

        return Inertia::render('Quran/Index', [
            'stats' => $stats,
            'recentSessions' => $recentSessions,
        ]);
    }
}

