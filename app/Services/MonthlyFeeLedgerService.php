<?php

namespace App\Services;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\MonthlyFeePayment;
use App\Models\MonthlyFeeSetting;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

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
            DB::transaction(function () use ($schoolId, $guardianId, $year, $month, $settingsByGuardian) {
                $setting = MonthlyFeeSetting::lockForUpdate()->find($settingsByGuardian->get($guardianId)?->id);
                $expectedAmount = (float) ($setting->expected_fee ?? 0);
                $creditBalance = (float) ($setting->credit_balance ?? 0);
                $creditApplied = min($creditBalance, $expectedAmount);

                $entry = MonthlyFeeEntry::create([
                    'school_id' => $schoolId,
                    'guardian_id' => $guardianId,
                    'year' => $year,
                    'month' => $month,
                    'expected_amount' => $expectedAmount,
                ]);

                if ($creditApplied > 0) {
                    $entry->update([
                        'amount_collected' => $creditApplied,
                        'credit_applied' => $creditApplied,
                        'paid_date' => now()->toDateString(),
                        'recorded_by' => null,
                    ]);
                    $setting->decrement('credit_balance', $creditApplied);
                }
            });
        }
    }

    /**
     * Appends one row to the append-only cash-receipt log. Never called for
     * credit auto-consumption (syncMonth's credit step, applyCreditToArrears)
     * — only when real cash actually changes hands. The three "applied_to_*"
     * amounts must sum to $amount.
     */
    private function logCashReceived(
        int $schoolId,
        int $guardianId,
        float $amount,
        float $appliedToArrears,
        float $appliedToCurrentMonth,
        float $appliedToCredit,
        int $recordedBy,
        ?string $receivedAt = null,
        ?string $notes = null,
        ?int $correctsEntryId = null,
    ): MonthlyFeePayment {
        return MonthlyFeePayment::create([
            'school_id' => $schoolId,
            'guardian_id' => $guardianId,
            'amount' => $amount,
            'applied_to_arrears' => $appliedToArrears,
            'applied_to_current_month' => $appliedToCurrentMonth,
            'applied_to_credit' => $appliedToCredit,
            'received_at' => $receivedAt ?? now()->toDateString(),
            'recorded_by' => $recordedBy,
            'corrects_entry_id' => $correctsEntryId,
            'notes' => $notes,
        ]);
    }

    /**
     * The primary way money gets collected (spec §3). Always resolves the
     * school's currently-open month internally — never trusts a caller's
     * idea of which month is "current" — and settles, in order: (1) this
     * guardian's unpaid/partial months strictly before the open month,
     * oldest first, each capped at its own remaining shortfall; (2) the open
     * month's own entry, same remaining-shortfall logic, created first if it
     * doesn't exist yet; (3) anything left over becomes reserve credit.
     * Runs inside one locked transaction end to end (round-2 fix #3, round-3
     * fix #6) so a concurrent write to the same guardian's credit_balance or
     * a double-submit racing on the current-month entry's unique constraint
     * can't silently clobber this.
     *
     * @return array{
     *     guardian_id: int, amount_received: float,
     *     applied_to_arrears: array<int, array{entry_id:int, year:int, month:int, applied:float, fully_cleared:bool}>,
     *     applied_to_current_month: ?array{entry_id:int, year:int, month:int, applied:float, fully_cleared:bool},
     *     total_arrears_cleared: float, applied_to_credit: float, new_credit_balance: float,
     * }
     */
    public function recordPayment(
        int $guardianId,
        float $amountReceived,
        int $recordedBy,
        ?string $receivedAt = null,
        ?string $notes = null,
    ): array {
        $guardian = Guardian::findOrFail($guardianId);
        $schoolId = $guardian->school_id;

        return DB::transaction(function () use ($guardian, $guardianId, $schoolId, $amountReceived, $recordedBy, $receivedAt, $notes) {
            $setting = MonthlyFeeSetting::lockForUpdate()->where('guardian_id', $guardianId)->first()
                ?? MonthlyFeeSetting::create(['school_id' => $schoolId, 'guardian_id' => $guardianId, 'expected_fee' => 0]);

            $latest = $this->latestMonth($schoolId);
            $remaining = $amountReceived;
            $arrearsBreakdown = [];
            $arrearsTotal = 0.0;

            $arrearsEntries = MonthlyFeeEntry::where('guardian_id', $guardianId)
                ->where(fn ($query) => $this->beforeMonth($query, $latest['year'], $latest['month']))
                ->whereRaw('COALESCE(amount_collected, 0) < expected_amount')
                ->orderBy('year')->orderBy('month')
                ->lockForUpdate()
                ->get();

            foreach ($arrearsEntries as $entry) {
                if ($remaining <= 0) {
                    break;
                }

                $shortfall = (float) $entry->expected_amount - (float) ($entry->amount_collected ?? 0);
                $applied = min($remaining, $shortfall);

                $entry->update([
                    'amount_collected' => (float) ($entry->amount_collected ?? 0) + $applied,
                    'paid_date' => $receivedAt ?? now()->toDateString(),
                    'recorded_by' => $recordedBy,
                ]);

                $arrearsBreakdown[] = [
                    'entry_id' => $entry->id, 'year' => $entry->year, 'month' => $entry->month,
                    'applied' => $applied, 'fully_cleared' => $applied === $shortfall,
                ];
                $arrearsTotal += $applied;
                $remaining -= $applied;
            }

            $currentEntry = MonthlyFeeEntry::lockForUpdate()->firstOrCreate(
                ['guardian_id' => $guardianId, 'year' => $latest['year'], 'month' => $latest['month']],
                ['school_id' => $schoolId, 'expected_amount' => $setting->expected_fee]
            );

            $appliedToCurrentMonth = 0.0;
            $currentBreakdown = null;

            if ($remaining > 0) {
                $shortfall = (float) $currentEntry->expected_amount - (float) ($currentEntry->amount_collected ?? 0);
                $appliedToCurrentMonth = max(0.0, min($remaining, $shortfall));

                if ($appliedToCurrentMonth > 0) {
                    $currentEntry->update([
                        'amount_collected' => (float) ($currentEntry->amount_collected ?? 0) + $appliedToCurrentMonth,
                        'paid_date' => $receivedAt ?? now()->toDateString(),
                        'recorded_by' => $recordedBy,
                    ]);
                    $remaining -= $appliedToCurrentMonth;
                }

                $currentBreakdown = [
                    'entry_id' => $currentEntry->id, 'year' => $currentEntry->year, 'month' => $currentEntry->month,
                    'applied' => $appliedToCurrentMonth, 'fully_cleared' => $appliedToCurrentMonth === $shortfall,
                ];
            }

            $appliedToCredit = max(0.0, $remaining);
            if ($appliedToCredit > 0) {
                $setting->increment('credit_balance', $appliedToCredit);
            }

            $this->logCashReceived(
                $schoolId, $guardianId, $amountReceived,
                $arrearsTotal, $appliedToCurrentMonth, $appliedToCredit,
                $recordedBy, $receivedAt, $notes
            );

            return [
                'guardian_id' => $guardianId,
                'amount_received' => $amountReceived,
                'applied_to_arrears' => $arrearsBreakdown,
                'applied_to_current_month' => $currentBreakdown,
                'total_arrears_cleared' => $arrearsTotal,
                'applied_to_credit' => $appliedToCredit,
                'new_credit_balance' => (float) $setting->fresh()->credit_balance,
            ];
        });
    }

    /**
     * Returns however much of $entry's amount_collected was credit-funded
     * back to the guardian's credit_balance — used by undoPaid() (Task 3),
     * which separately handles the cash portion (if any) via a negative
     * monthly_fee_payments correction. Locked the same way every other
     * credit_balance write is.
     */
    public function refundCredit(MonthlyFeeEntry $entry, int $recordedBy): void
    {
        $creditPortion = (float) $entry->credit_applied;

        if ($creditPortion <= 0) {
            return;
        }

        DB::transaction(function () use ($entry, $creditPortion) {
            $setting = MonthlyFeeSetting::lockForUpdate()->where('guardian_id', $entry->guardian_id)->first()
                ?? MonthlyFeeSetting::create(['school_id' => $entry->school_id, 'guardian_id' => $entry->guardian_id, 'expected_fee' => 0]);

            $setting->increment('credit_balance', $creditPortion);
        });
    }

    /**
     * Used by the manual correction tools (markPaid/updateCollected in the
     * controller) so real cash changed through them also feeds the
     * cash-basis analytics, the same way recordPayment() does. Computes the
     * delta being applied to $entry's own amount_collected, classifies it
     * as arrears or current-month cash depending on whether $entry belongs
     * to the school's actual open month, and logs it. Deliberately never
     * touches credit_applied — these tools only ever add/adjust real cash;
     * undoPaid() alone handles the credit-refund side.
     */
    public function recordManualCashChange(MonthlyFeeEntry $entry, float $newAmountCollected, int $recordedBy): void
    {
        $delta = $newAmountCollected - (float) ($entry->amount_collected ?? 0);

        if ($delta === 0.0) {
            return;
        }

        $latest = $this->latestMonth($entry->school_id);
        $isCurrentMonth = $entry->year === $latest['year'] && $entry->month === $latest['month'];

        $this->logCashReceived(
            $entry->school_id,
            $entry->guardian_id,
            $delta,
            $isCurrentMonth ? 0.0 : $delta,
            $isCurrentMonth ? $delta : 0.0,
            0.0,
            $recordedBy,
        );
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
