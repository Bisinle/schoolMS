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
     * How much a guardian owes from months strictly before (year, month) —
     * the sum of each past entry's shortfall (expected_amount minus
     * whatever was actually collected). Deliberately excludes the
     * (year, month) being viewed itself; that month's own row is shown
     * separately by the caller. Never negative: a guardian who overpaid a
     * past month nets that credit against other arrears, but the balance
     * itself never surfaces as a negative "credit" figure.
     */
    public function outstandingBalanceFor(int $guardianId, int $beforeYear, int $beforeMonth): float
    {
        $balance = MonthlyFeeEntry::where('guardian_id', $guardianId)
            ->where(fn ($query) => $this->beforeMonth($query, $beforeYear, $beforeMonth))
            ->selectRaw('SUM(expected_amount - COALESCE(amount_collected, 0)) as balance')
            ->value('balance');

        return max(0.0, (float) $balance);
    }

    /**
     * The same balance as outstandingBalanceFor(), computed for every
     * guardian in a school in one query — used by the admin ledger so
     * showing a month's worth of rows doesn't cost one extra query per
     * guardian on top of what it already runs.
     *
     * @return array<int, float> guardian_id => outstanding balance
     */
    public function outstandingBalancesForSchool(int $schoolId, int $beforeYear, int $beforeMonth): array
    {
        return MonthlyFeeEntry::where('school_id', $schoolId)
            ->where(fn ($query) => $this->beforeMonth($query, $beforeYear, $beforeMonth))
            ->selectRaw('guardian_id, SUM(expected_amount - COALESCE(amount_collected, 0)) as balance')
            ->groupBy('guardian_id')
            ->pluck('balance', 'guardian_id')
            ->map(fn ($balance) => max(0.0, (float) $balance))
            ->all();
    }

    private function beforeMonth($query, int $year, int $month): void
    {
        $query->where('year', '<', $year)
            ->orWhere(function ($query) use ($year, $month) {
                $query->where('year', $year)->where('month', '<', $month);
            });
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
