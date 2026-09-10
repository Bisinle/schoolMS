<?php

namespace App\Services;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\MonthlyFeeSetting;
use Illuminate\Support\Carbon;

class MonthlyFeeLedgerService
{
    /**
     * The (year, month) currently "open" for a school — the latest month
     * that has any entries at all, or the current calendar month if the
     * ledger has never been opened before (the very first page load
     * bootstraps itself against this).
     *
     * @return array{year: int, month: int}
     */
    public function latestMonth(int $schoolId): array
    {
        $latest = MonthlyFeeEntry::where('school_id', $schoolId)
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->first(['year', 'month']);

        if (! $latest) {
            $now = Carbon::now();

            return ['year' => $now->year, 'month' => $now->month];
        }

        return ['year' => $latest->year, 'month' => $latest->month];
    }

    /**
     * Upsert a monthly_fee_entries row for every active guardian with at
     * least one active student, for the given (year, month). Never touches
     * a row that already exists — this is what makes it safe to call on
     * every page load of the open month (a guardian who joins mid-month is
     * picked up the next time anyone opens the ledger) and safe to call
     * twice in a row without clobbering anything already collected.
     */
    public function syncMonth(int $schoolId, int $year, int $month): void
    {
        $guardianIds = Guardian::where('school_id', $schoolId)
            ->where('status', 'active')
            ->get()
            ->filter(fn (Guardian $guardian) => $guardian->allStudents()->where('status', 'active')->exists())
            ->pluck('id');

        if ($guardianIds->isEmpty()) {
            return;
        }

        $existingGuardianIds = MonthlyFeeEntry::where('school_id', $schoolId)
            ->where('year', $year)
            ->where('month', $month)
            ->whereIn('guardian_id', $guardianIds)
            ->pluck('guardian_id');

        $missingGuardianIds = $guardianIds->diff($existingGuardianIds);

        if ($missingGuardianIds->isEmpty()) {
            return;
        }

        $settingsByGuardian = MonthlyFeeSetting::whereIn('guardian_id', $missingGuardianIds)
            ->get()
            ->keyBy('guardian_id');

        foreach ($missingGuardianIds as $guardianId) {
            MonthlyFeeEntry::create([
                'school_id' => $schoolId,
                'guardian_id' => $guardianId,
                'year' => $year,
                'month' => $month,
                'expected_amount' => $settingsByGuardian->get($guardianId)?->expected_fee ?? 0,
            ]);
        }
    }

    /**
     * Advance the ledger to the month after whatever is currently open, and
     * sync it the same way syncMonth does for the open month. Assumes the
     * open month has already been synced at least once (true in practice —
     * the admin ledger page always syncs the open month on every load
     * before this action is ever reachable in the UI).
     *
     * @return array{year: int, month: int}
     */
    public function openNextMonth(int $schoolId): array
    {
        $latest = $this->latestMonth($schoolId);
        $next = Carbon::create($latest['year'], $latest['month'], 1)->addMonthNoOverflow();

        $this->syncMonth($schoolId, $next->year, $next->month);

        return ['year' => $next->year, 'month' => $next->month];
    }
}
