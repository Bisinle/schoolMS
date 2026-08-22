<?php

namespace App\Http\Controllers;

use App\Models\QuranHomework;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GuardianQuranHomeworkController extends Controller
{
    /**
     * Display a list of guardian's children who have Quran homework records
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->isGuardian()) {
            abort(403, 'Unauthorized access.');
        }

        $guardian = $user->guardian;

        if (!$guardian) {
            abort(404, 'Guardian profile not found.');
        }

        // Check if school is madrasah
        if (!$user->school || $user->school->school_type !== 'madrasah') {
            abort(403, 'Quran tracking is only available for madrasah schools.');
        }

        // Get guardian's children with their latest Quran homework
        $students = $guardian->students()
            ->with(['grade'])
            ->withCount('quranHomework')
            ->where('status', 'active')
            ->get()
            ->filter(function ($student) {
                // Only show students who have at least one homework record
                return $student->quran_homework_count > 0;
            })
            ->map(function ($student) {
                // Get the latest homework session separately
                $latestTracking = QuranHomework::where('student_id', $student->id)
                    ->latest('assigned_date')
                    ->first();

                return [
                    'id' => $student->id,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'admission_number' => $student->admission_number,
                    'grade' => [
                        'id' => $student->grade->id ?? null,
                        'name' => $student->grade->name ?? 'N/A',
                    ],
                    'total_sessions' => $student->quran_homework_count,
                    'latest_tracking' => $latestTracking ? [
                        'id' => $latestTracking->id,
                        'date' => $latestTracking->assigned_date->format('M d, Y'),
                        'reading_type' => $latestTracking->reading_type,
                        'reading_type_label' => $latestTracking->reading_type_label,
                        'difficulty' => $latestTracking->quality_rating,
                        'difficulty_label' => $latestTracking->quality_rating_label,
                        'pages_memorized' => $latestTracking->pages_memorized,
                        'surahs_memorized' => $latestTracking->surahs_memorized,
                        'juz_memorized' => $latestTracking->juz_memorized,
                    ] : null,
                ];
            })
            ->values();

        return Inertia::render('Guardians/QuranTracking/Index', [
            'students' => $students,
        ]);
    }
}
