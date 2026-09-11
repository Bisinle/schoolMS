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

        return DB::transaction(function () use ($guardianId, $schoolId, $amountReceived, $recordedBy, $receivedAt, $notes) {
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
     * The full reversal of a paid/partial entry back to unpaid — used by
     * MonthlyFeeController::undoPaid(). Runs the ENTIRE read-refund-correct-
     * reset sequence inside one locked transaction, matching the pattern
     * every other credit_balance/entry read-modify-write in this service
     * uses (recordPayment, syncMonth's credit step, applyCreditToArrears):
     * the plan's Global Constraints explicitly name undoPaid's
     * credit-refund path as one of these. Re-fetches and locks the entry
     * itself inside the transaction rather than trusting a possibly-stale
     * $entry instance passed in from outside the lock — only the entry's
     * immutable identifying FKs (guardian_id/school_id) are read from the
     * passed instance, never its mutable financial fields.
     *
     * Any credit portion of the entry's amount_collected goes back to
     * credit_balance; any real-cash portion is logged as a negative
     * correction through logCashReceived() — the one place that writes the
     * cash ledger — rather than a raw MonthlyFeePayment::create(). Calling
     * this on an entry that's already fully reset (no credit_applied, no
     * amount_collected) is a safe no-op: nothing is written, so a
     * double-submitted undo can't double-refund or log two corrections.
     */
    public function undoEntry(MonthlyFeeEntry $entry, int $recordedBy): void
    {
        DB::transaction(function () use ($entry, $recordedBy) {
            // Lock the setting row before the entry row — the same order
            // every other credit_balance read-modify-write in this service
            // uses (recordPayment/applyCreditToArrears lock the setting
            // first, then entries), so this can't deadlock against them
            // under concurrent access.
            $setting = MonthlyFeeSetting::lockForUpdate()->where('guardian_id', $entry->guardian_id)->first()
                ?? MonthlyFeeSetting::create(['school_id' => $entry->school_id, 'guardian_id' => $entry->guardian_id, 'expected_fee' => 0]);

            $locked = MonthlyFeeEntry::lockForUpdate()->findOrFail($entry->id);

            $creditPortion = (float) $locked->credit_applied;
            $cashPortion = (float) ($locked->amount_collected ?? 0) - $creditPortion;

            if ($creditPortion <= 0 && $cashPortion <= 0) {
                return;
            }

            if ($creditPortion > 0) {
                $setting->increment('credit_balance', $creditPortion);
            }

            if ($cashPortion > 0) {
                $latest = $this->latestMonth($locked->school_id);
                $isCurrentMonth = $locked->year === $latest['year'] && $locked->month === $latest['month'];

                $this->logCashReceived(
                    $locked->school_id,
                    $locked->guardian_id,
                    -$cashPortion,
                    $isCurrentMonth ? 0.0 : -$cashPortion,
                    $isCurrentMonth ? -$cashPortion : 0.0,
                    0.0,
                    $recordedBy,
                    correctsEntryId: $locked->id,
                );
            }

            $locked->update([
                'amount_collected' => null,
                'credit_applied' => 0,
                'paid_date' => null,
                'recorded_by' => $recordedBy,
            ]);
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
     * The explicit, admin-triggered action that nets an existing credit
     * balance against reopened/still-outstanding arrears (spec round-2 fix
     * #5) — never automatic. Walks oldest-unpaid-first, the same order
     * recordPayment() uses, but the money's source is the guardian's stored
     * credit rather than new cash: every entry it touches gets its
     * credit_applied increased by exactly the amount applied — mirroring
     * syncMonth()'s credit consumption (spec round-4 fix) — and recorded_by
     * is set to the acting admin (unlike syncMonth's fully-automatic null),
     * since a human deliberately triggered this. No monthly_fee_payments row
     * is logged — no new cash changed hands.
     *
     * @return array{total_applied: float, entries: array<int, array{entry_id:int, year:int, month:int, applied:float}>}
     */
    public function applyCreditToArrears(int $guardianId, int $recordedBy): array
    {
        $guardian = Guardian::findOrFail($guardianId);

        return DB::transaction(function () use ($guardian, $guardianId, $recordedBy) {
            $setting = MonthlyFeeSetting::lockForUpdate()->where('guardian_id', $guardianId)->first()
                ?? MonthlyFeeSetting::create(['school_id' => $guardian->school_id, 'guardian_id' => $guardianId, 'expected_fee' => 0]);

            $latest = $this->latestMonth($guardian->school_id);
            $remaining = (float) $setting->credit_balance;
            $totalApplied = 0.0;
            $touched = [];

            if ($remaining <= 0) {
                return ['total_applied' => 0.0, 'entries' => []];
            }

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
                    'credit_applied' => (float) $entry->credit_applied + $applied,
                    'paid_date' => now()->toDateString(),
                    'recorded_by' => $recordedBy,
                ]);

                $touched[] = ['entry_id' => $entry->id, 'year' => $entry->year, 'month' => $entry->month, 'applied' => $applied];
                $totalApplied += $applied;
                $remaining -= $applied;
            }

            if ($totalApplied > 0) {
                $setting->decrement('credit_balance', $totalApplied);
            }

            return ['total_applied' => $totalApplied, 'entries' => $touched];
        });
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

    /**
     * The date range this abstract (year, month) was actually "open" for —
     * from the earliest entry syncMonth ever created for it, until the
     * earliest entry of whichever month opened right after it (or now, if
     * none has opened yet). Round-3 fix #4: this is what lets the analytics
     * below match what's actually on screen, regardless of how far behind
     * the real calendar a school's "Open next month" habits are.
     *
     * @return array{start: string, end: string}
     */
    private function periodBounds(int $schoolId, int $year, int $month): array
    {
        $start = MonthlyFeeEntry::where('school_id', $schoolId)
            ->where('year', $year)->where('month', $month)
            ->min('created_at');

        $next = MonthlyFeeEntry::where('school_id', $schoolId)
            ->where(function ($query) use ($year, $month) {
                $query->where('year', '>', $year)
                    ->orWhere(function ($query) use ($year, $month) {
                        $query->where('year', $year)->where('month', '>', $month);
                    });
            })
            ->orderBy('year')->orderBy('month')
            ->first(['year', 'month']);

        $end = $next
            ? MonthlyFeeEntry::where('school_id', $schoolId)->where('year', $next->year)->where('month', $next->month)->min('created_at')
            : now()->toDateTimeString();

        return ['start' => $start ?? now()->toDateTimeString(), 'end' => $end];
    }

    /**
     * Real cash received while this abstract month was open — the true,
     * honest "cash in the door this period" figure.
     *
     * Bounded against the payment row's own `created_at` (not `received_at`,
     * a user-editable, day-precision cash-received date used only for
     * display/statements) — `received_at` can be backdated by the recorder
     * and is stored as a bare DATE column, so comparing it against
     * periodBounds()'s datetime-precision boundaries would silently exclude
     * everything (a `date` string like "2026-09-11" always sorts below a
     * `datetime` string like "2026-09-11 08:15:00" once any time-of-day
     * component is present, which is effectively always). `created_at`
     * matches periodBounds()'s own precision and reflects when the cash was
     * actually recorded into this open period, which is what "this period"
     * is meant to mean here.
     */
    public function collectedThisPeriod(int $schoolId, int $year, int $month): float
    {
        $bounds = $this->periodBounds($schoolId, $year, $month);

        return (float) (MonthlyFeePayment::where('school_id', $schoolId)
            ->whereBetween('created_at', [$bounds['start'], $bounds['end']])
            ->sum('amount') ?? 0);
    }

    /** How much of this period's real cash went toward old debt. See collectedThisPeriod()'s note on why this binds to created_at, not received_at. */
    public function arrearsCollectedThisPeriod(int $schoolId, int $year, int $month): float
    {
        $bounds = $this->periodBounds($schoolId, $year, $month);

        return (float) (MonthlyFeePayment::where('school_id', $schoolId)
            ->whereBetween('created_at', [$bounds['start'], $bounds['end']])
            ->sum('applied_to_arrears') ?? 0);
    }

    /**
     * Informational only: how much reserve credit got recognized as this
     * period's fees, with no new cash behind it. Deliberately keys off
     * credit_applied, not recorded_by IS NULL (round-4 fix) — that would
     * only catch syncMonth's automatic consumption and miss everything
     * applyCreditToArrears settles, since that's a deliberate admin action
     * that honestly attributes recorded_by to whoever clicked it.
     *
     * Bounded against `updated_at`, not `paid_date`, for the same
     * date-vs-datetime precision reason documented on collectedThisPeriod():
     * `paid_date` is a bare DATE column and periodBounds() is datetime-
     * precision. Both syncMonth's auto-consumption and applyCreditToArrears
     * touch `updated_at` via their own ->update() calls, so it tracks
     * exactly when the credit was recognized, at matching precision.
     */
    public function creditRecognizedThisPeriod(int $schoolId, int $year, int $month): float
    {
        $bounds = $this->periodBounds($schoolId, $year, $month);

        return (float) (MonthlyFeeEntry::where('school_id', $schoolId)
            ->where('credit_applied', '>', 0)
            ->whereBetween('updated_at', [$bounds['start'], $bounds['end']])
            ->sum('credit_applied') ?? 0);
    }

    /**
     * Every guardian with arrears activity relevant to this period — either
     * a still-outstanding shortfall from before (year, month), or an entry
     * actually resolved during this period. Grouped by guardian for the
     * drill-down.
     *
     * The "resolved during this period" leg binds to `updated_at`, not
     * `paid_date`, for the same date-vs-datetime precision reason documented
     * on collectedThisPeriod()/creditRecognizedThisPeriod(): `paid_date` is
     * a bare DATE column and periodBounds() is datetime-precision.
     *
     * @return \Illuminate\Support\Collection<int, \Illuminate\Support\Collection<int, MonthlyFeeEntry>>
     */
    public function arrearsActivityForSchool(int $schoolId, int $year, int $month): \Illuminate\Support\Collection
    {
        $bounds = $this->periodBounds($schoolId, $year, $month);

        return MonthlyFeeEntry::where('school_id', $schoolId)
            ->where('expected_amount', '>', 0)
            ->where(fn ($query) => $this->beforeMonth($query, $year, $month))
            ->where(function ($query) use ($bounds) {
                $query->whereRaw('COALESCE(amount_collected, 0) < expected_amount')
                    ->orWhereBetween('updated_at', [$bounds['start'], $bounds['end']]);
            })
            ->with(['guardian' => fn ($q) => $q->withTrashed()])
            ->orderBy('guardian_id')->orderBy('year')->orderBy('month')
            ->get()
            ->groupBy('guardian_id');
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
