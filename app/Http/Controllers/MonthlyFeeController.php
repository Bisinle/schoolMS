<?php

namespace App\Http\Controllers;

use App\Models\Guardian;
use App\Models\MonthlyFeeEntry;
use App\Models\MonthlyFeeSetting;
use App\Services\MonthlyFeeLedgerService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class MonthlyFeeController extends Controller
{
    public function __construct(private MonthlyFeeLedgerService $ledger) {}

    /**
     * Admin ledger view for a single month. Defaults to whichever month is
     * currently "open". Only the open month gets synced on load — browsing
     * to an older month never mutates it, so a guardian who joins after
     * September closes doesn't get silently injected into September's
     * history.
     */
    public function index(Request $request)
    {
        $schoolId = $request->user()->school_id;
        $latest = $this->ledger->latestMonth($schoolId);

        $year = (int) $request->query('year', $latest['year']);
        $month = (int) $request->query('month', $latest['month']);

        $isOpenMonth = $year === $latest['year'] && $month === $latest['month'];

        if ($isOpenMonth) {
            $this->ledger->syncMonth($schoolId, $year, $month);
        }

        $entries = MonthlyFeeEntry::where('school_id', $schoolId)
            ->where('year', $year)
            ->where('month', $month)
            ->with('guardian.user')
            ->get();

        $outstandingByGuardian = $this->ledger->outstandingBalancesForSchool($schoolId, $year, $month);

        $rows = $entries->map(function (MonthlyFeeEntry $entry) use ($outstandingByGuardian) {
            $guardian = $entry->guardian;

            $children = $guardian->allStudents()
                ->where('status', 'active')
                ->with('grade')
                ->get()
                ->map(fn ($student) => [
                    'name' => trim($student->first_name.' '.$student->last_name),
                    'grade' => $student->grade->name ?? null,
                ])
                ->values();

            $outstandingBalance = $outstandingByGuardian[$guardian->id] ?? 0.0;

            return [
                'entry_id' => $entry->id,
                'guardian_id' => $guardian->id,
                'guardian_name' => $guardian->full_name,
                'guardian_number' => $guardian->guardian_number,
                'phone' => $guardian->phone,
                'children' => $children,
                'expected_amount' => (float) $entry->expected_amount,
                'amount_collected' => $entry->amount_collected !== null ? (float) $entry->amount_collected : null,
                'paid_date' => $entry->paid_date?->format('Y-m-d'),
                'status' => $entry->status,
                'outstanding_balance' => $outstandingBalance,
                'total_due' => (float) $entry->expected_amount + $outstandingBalance,
                'credit_balance' => (float) ($guardian->monthlyFeeSetting?->credit_balance ?? 0),
            ];
        })->sortBy('guardian_name')->values();

        $monthDate = Carbon::create($year, $month, 1);
        $prev = $monthDate->copy()->subMonthNoOverflow();
        $next = $monthDate->copy()->addMonthNoOverflow();
        $wouldBrowsePastOpenMonth = $isOpenMonth;

        $arrearsActivity = $this->ledger->arrearsActivityForSchool($schoolId, $year, $month)
            // A soft-deleted (or otherwise missing) guardian's arrears are
            // still real debt — the underlying MonthlyFeeEntry rows are
            // untouched — but there's no actionable guardian record left for
            // this drill-down (record-payment/apply-credit both look the
            // guardian up without withTrashed() and would 404), so their
            // group is excluded from this display only.
            ->filter(function ($entries) {
                $guardian = $entries->first()->guardian;

                return $guardian !== null && ! $guardian->trashed();
            })
            ->map(function ($entries, $guardianId) use ($outstandingByGuardian) {
                $guardian = $entries->first()->guardian;

                return [
                    'guardian_id' => $guardianId,
                    'guardian_name' => $guardian->full_name,
                    'guardian_number' => $guardian->guardian_number,
                    'still_owing' => $outstandingByGuardian[$guardianId] ?? 0.0,
                    'months' => $entries->map(fn (MonthlyFeeEntry $e) => [
                        'entry_id' => $e->id,
                        'year' => $e->year,
                        'month' => $e->month,
                        'label' => Carbon::create($e->year, $e->month, 1)->format('F Y'),
                        'expected_amount' => (float) $e->expected_amount,
                        'amount_collected' => $e->amount_collected !== null ? (float) $e->amount_collected : null,
                        'credit_applied' => (float) $e->credit_applied,
                        'paid_date' => $e->paid_date?->format('Y-m-d'),
                        'status' => $e->status,
                    ])->values(),
                ];
            })->values();

        return Inertia::render('Fees/MonthlyFees/Index', [
            'year' => $year,
            'month' => $month,
            'monthLabel' => $monthDate->format('F Y'),
            'isOpenMonth' => $isOpenMonth,
            'canBrowseNext' => ! $wouldBrowsePastOpenMonth,
            'prev' => ['year' => $prev->year, 'month' => $prev->month],
            'next' => ['year' => $next->year, 'month' => $next->month],
            'rows' => $rows,
            'totalCollected' => $rows->sum(
                fn ($row) => in_array($row['status'], ['paid', 'partial'], true) ? $row['amount_collected'] : 0
            ),
            'collectedThisPeriod' => $this->ledger->collectedThisPeriod($schoolId, $year, $month),
            'arrearsCollectedThisPeriod' => $this->ledger->arrearsCollectedThisPeriod($schoolId, $year, $month),
            'creditRecognizedThisPeriod' => $this->ledger->creditRecognizedThisPeriod($schoolId, $year, $month),
            'arrearsActivity' => $arrearsActivity,
        ]);
    }

    public function openNextMonth(Request $request)
    {
        $next = $this->ledger->openNextMonth($request->user()->school_id);

        return redirect()->route('monthly-fees.index', $next);
    }

    public function updateExpected(Request $request, Guardian $guardian)
    {
        $validated = $request->validate([
            'expected_fee' => ['required', 'numeric', 'min:0'],
        ]);

        $setting = MonthlyFeeSetting::updateOrCreate(
            ['guardian_id' => $guardian->id],
            [
                'school_id' => $guardian->school_id,
                'expected_fee' => $validated['expected_fee'],
                'updated_by' => $request->user()->id,
            ]
        );

        // The currently open month's entry, if it hasn't been collected yet,
        // reflects the new rate immediately — this is what turns a flagged
        // "needs fee" row into a collectible one without waiting for next
        // month. An entry that already has a recorded amount is left alone;
        // its expected_amount stays the snapshot from when it was generated.
        $latest = $this->ledger->latestMonth($guardian->school_id);

        MonthlyFeeEntry::where('guardian_id', $guardian->id)
            ->where('year', $latest['year'])
            ->where('month', $latest['month'])
            ->where(function ($query) {
                $query->whereNull('amount_collected')
                    ->orWhereColumn('amount_collected', 'credit_applied');
            })
            ->update(['expected_amount' => $setting->expected_fee]);

        return back()->with('success', 'Expected fee updated.');
    }

    public function markPaid(Request $request, MonthlyFeeEntry $entry)
    {
        if ($entry->expected_amount <= 0) {
            return back()->withErrors(['error' => 'Set an expected fee for this guardian before marking a payment.']);
        }

        $this->ledger->recordManualCashChange($entry, (float) $entry->expected_amount, $request->user()->id);

        $entry->update([
            'amount_collected' => $entry->expected_amount,
            'paid_date' => now()->toDateString(),
            'recorded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Marked as paid.');
    }

    public function undoPaid(Request $request, MonthlyFeeEntry $entry)
    {
        $this->ledger->undoEntry($entry, $request->user()->id);

        return back()->with('success', 'Payment undone.');
    }

    public function updateCollected(Request $request, MonthlyFeeEntry $entry)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
        ]);

        $amount = (float) $validated['amount'];

        $this->ledger->recordManualCashChange($entry, $amount, $request->user()->id);

        $entry->update([
            'amount_collected' => $amount > 0 ? $amount : null,
            'paid_date' => $amount > 0 ? ($entry->paid_date?->toDateString() ?? now()->toDateString()) : null,
            'recorded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Amount updated.');
    }

    public function recordPayment(Request $request, Guardian $guardian)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'received_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $result = $this->ledger->recordPayment(
            $guardian->id,
            (float) $validated['amount'],
            $request->user()->id,
            $validated['received_at'] ?? null,
            $validated['notes'] ?? null,
        );

        return back()->with('success', 'Payment recorded.')->with('payment_receipt', $result);
    }

    public function applyCredit(Request $request, Guardian $guardian)
    {
        $this->ledger->applyCreditToArrears($guardian->id, $request->user()->id);

        return back()->with('success', 'Credit applied to arrears.');
    }

    /**
     * Guardian-facing view of their own current month — mirrors how
     * InvoiceController already serves both the admin and guardian invoice
     * routes from one controller under different route-group permissions.
     */
    public function guardianShow(Request $request)
    {
        $guardian = Guardian::where('user_id', $request->user()->id)->firstOrFail();
        $schoolId = $guardian->school_id;
        $latest = $this->ledger->latestMonth($schoolId);

        // Only this guardian's own entry needs to exist for the open month —
        // unlike the admin ledger page, there's no reason to sync the whole
        // school's guardian list just so one guardian can see their own row.
        $entry = MonthlyFeeEntry::firstOrCreate(
            [
                'guardian_id' => $guardian->id,
                'year' => $latest['year'],
                'month' => $latest['month'],
            ],
            [
                'school_id' => $schoolId,
                'expected_amount' => $guardian->monthlyFeeSetting?->expected_fee ?? 0,
            ]
        );

        $monthDate = Carbon::create($latest['year'], $latest['month'], 1);
        $expected = $entry ? (float) $entry->expected_amount : 0;
        $collected = $entry ? (float) ($entry->amount_collected ?? 0) : 0;
        $outstandingBalance = $this->ledger->outstandingBalanceFor($guardian->id, $latest['year'], $latest['month']);

        return Inertia::render('Fees/MonthlyFees/GuardianShow', [
            'monthLabel' => $monthDate->format('F Y'),
            'guardianName' => $guardian->full_name,
            'guardianNumber' => $guardian->guardian_number,
            'phone' => $guardian->phone,
            'amountDue' => max($expected - $collected, 0) + $outstandingBalance,
            'expectedAmount' => $expected,
            'outstandingBalance' => $outstandingBalance,
            'creditBalance' => (float) ($guardian->monthlyFeeSetting?->credit_balance ?? 0),
            'status' => $entry->status ?? 'needs_fee',
        ]);
    }
}
