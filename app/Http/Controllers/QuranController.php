<?php

namespace App\Http\Controllers;

use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuranController extends Controller
{
    /**
     * Display the Quran module dashboard. Admin sees school-wide numbers;
     * Teacher and Guardian see numbers scoped to their own Quran teaching
     * load / their own children respectively — see
     * docs/quran-dashboard-role-scoping-audit.md for why each is scoped the
     * way it is.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $recentActivity = null;
        $recentProgress = null;
        $activeSchedulesList = null;

        if ($user->isTeacher()) {
            $stats = $this->teacherStats($user);
            $recentActivity = $this->teacherRecentActivity($user);
        } elseif ($user->isGuardian()) {
            $stats = $this->guardianStats($user);
            $recentProgress = $this->guardianRecentProgress($user);
            $activeSchedulesList = $this->guardianActiveSchedules($user);
        } else {
            $stats = $this->adminStats();
        }

        // Module-specific stats — guardian-scoped (their own children's
        // records only) for guardians; unchanged (school-wide) for
        // admin/teacher, matching those roles' Module Cards, which still
        // link to the unscoped admin/teacher index pages.
        [$stats['homework'], $stats['schedule']] = $this->moduleStats($user);

        // Recent sessions (last 10) — unchanged, school-wide; kept for
        // parity with the prior version of this page (not currently
        // rendered by the frontend).
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
            'recentActivity' => $recentActivity,
            'recentProgress' => $recentProgress,
            'activeSchedulesList' => $activeSchedulesList,
        ]);
    }

    /**
     * The Module Cards' [homework, schedule] total/thisMonth pairs. Guardian
     * gets the same Guardian::allStudents()-based scoping as every other
     * guardian card on this page — otherwise the "Quran Homework" card would
     * link to a correctly-scoped page while still advertising a school-wide
     * count on its face. Admin/teacher stay unscoped, since their Module
     * Cards still link to the unscoped /quran-homework and /quran-schedule
     * index pages.
     */
    private function moduleStats($user): array
    {
        if ($user->isGuardian()) {
            $studentIds = $user->guardian ? $user->guardian->allStudentIds() : collect();

            return [
                [
                    'total' => QuranHomework::whereIn('student_id', $studentIds)->count(),
                    'thisMonth' => QuranHomework::whereIn('student_id', $studentIds)
                        ->whereMonth('assigned_date', now()->month)
                        ->whereYear('assigned_date', now()->year)
                        ->count(),
                ],
                [
                    'total' => QuranSchedule::whereIn('student_id', $studentIds)->count(),
                    'thisMonth' => QuranSchedule::whereIn('student_id', $studentIds)
                        ->whereMonth('start_date', now()->month)
                        ->whereYear('start_date', now()->year)
                        ->count(),
                ],
            ];
        }

        return [
            [
                'total' => QuranHomework::count(),
                'thisMonth' => QuranHomework::whereMonth('assigned_date', now()->month)
                    ->whereYear('assigned_date', now()->year)
                    ->count(),
            ],
            [
                'total' => QuranSchedule::count(),
                'thisMonth' => QuranSchedule::whereMonth('start_date', now()->month)
                    ->whereYear('start_date', now()->year)
                    ->count(),
            ],
        ];
    }

    /**
     * School-wide stats (Admin only). Pages/juz-memorized sums were dropped
     * from here (grow unbounded, not meaningful at scale) in favor of
     * bounded counts — see docs/quran-module-architecture-redesign.md.
     */
    private function adminStats(): array
    {
        $topPerformerRow = QuranHomework::where('reading_type', 'new_learning')
            ->where('status', 'graded')
            ->selectRaw('student_id, SUM(juz_memorized) as juz_total, SUM(pages_memorized) as pages_total')
            ->groupBy('student_id')
            ->orderByDesc('juz_total')
            ->orderByDesc('pages_total')
            ->with('student')
            ->first();

        $topPerformer = $topPerformerRow && $topPerformerRow->juz_total > 0
            ? "{$topPerformerRow->student->full_name} — {$topPerformerRow->juz_total} Juz"
            : null;

        return [
            'role' => 'admin',
            'activeSchedules' => QuranSchedule::inDateRange()->count(),
            'studentsTracked' => QuranHomework::distinct('student_id')->count('student_id'),
            'pendingHomework' => QuranHomework::pending()->count(),
            'topPerformer' => $topPerformer,
        ];
    }

    /**
     * Teacher's own Quran teaching load — scoped via teacher_id on
     * QuranSchedule/QuranHomework (the same ownership column
     * QuranSchedulePolicy::view() already uses for "my schedule"), not the
     * broader grade_teacher class assignment, which would pull in students
     * this teacher has never actually assigned Quran work to. See the audit
     * doc's §1/§3 for the full reasoning.
     */
    private function teacherStats($user): array
    {
        return [
            'role' => 'teacher',
            'activeSchedules' => QuranSchedule::where('teacher_id', $user->id)->inDateRange()->count(),
            'studentsTracked' => QuranHomework::where('teacher_id', $user->id)
                ->distinct('student_id')
                ->count('student_id'),
            'pendingHomework' => QuranHomework::where('teacher_id', $user->id)->pending()->count(),
        ];
    }

    private function teacherRecentActivity($user)
    {
        return QuranHomework::where('teacher_id', $user->id)
            ->with('student')
            ->orderByDesc('updated_at')
            ->take(5)
            ->get()
            ->map(fn ($homework) => [
                'id' => $homework->id,
                'student_name' => $homework->student->full_name,
                'status' => $homework->status,
                'status_label' => $homework->status_label,
                'surah_range' => $homework->surah_range,
                'reading_type_label' => $homework->reading_type_label,
                'date' => $homework->assigned_date->format('M d, Y'),
            ])
            ->values();
    }

    /**
     * Guardian's own children — scoped via Guardian::allStudents(), which
     * merges the legacy guardian_id column with the guardian_student pivot
     * so a second/non-primary guardian isn't silently shown nothing. See
     * Guardian.php and the audit doc's §1/§5.
     */
    private function guardianStats($user): array
    {
        $guardian = $user->guardian;

        if (! $guardian) {
            return ['role' => 'guardian', 'childrenTracked' => 0, 'pendingHomework' => 0];
        }

        $studentIds = $guardian->allStudentIds();

        return [
            'role' => 'guardian',
            'childrenTracked' => $guardian->allStudents()->whereHas('quranHomework')->count(),
            'pendingHomework' => QuranHomework::whereIn('student_id', $studentIds)->pending()->count(),
        ];
    }

    private function guardianRecentProgress($user)
    {
        $guardian = $user->guardian;

        if (! $guardian) {
            return collect();
        }

        return $guardian->allStudents()
            ->where('status', 'active')
            ->get()
            ->map(function ($student) {
                $latest = QuranHomework::where('student_id', $student->id)
                    ->orderByDesc('assigned_date')
                    ->orderByDesc('id')
                    ->first();

                return [
                    'student_id' => $student->id,
                    'student_name' => $student->full_name,
                    'latest' => $latest ? [
                        'status' => $latest->status,
                        'status_label' => $latest->status_label,
                        'surah_range' => $latest->surah_range,
                        'date' => $latest->assigned_date->format('M d, Y'),
                    ] : null,
                ];
            })
            ->values();
    }

    private function guardianActiveSchedules($user)
    {
        $guardian = $user->guardian;

        if (! $guardian) {
            return collect();
        }

        return QuranSchedule::whereIn('student_id', $guardian->allStudentIds())
            ->inDateRange()
            ->with('student')
            ->get()
            ->map(fn ($schedule) => [
                'id' => $schedule->id,
                'student_name' => $schedule->student->full_name,
                'progress_percentage' => $schedule->progress_percentage,
                'status_badge' => $schedule->status_badge,
                'days_remaining' => $schedule->days_remaining,
            ])
            ->values();
    }
}
