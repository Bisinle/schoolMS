<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\FeeCategory;
use App\Models\Guardian;
use App\Models\GuardianInvoice;
use App\Models\GuardianFeePreference;
use App\Models\OneTimeFee;
use App\Services\InvoiceGenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class FeeManagementController extends Controller
{
    public function __construct(
        protected InvoiceGenerationService $invoiceService
    ) {}

    /**
     * Display fee management dashboard
     */
    public function index(Request $request)
    {
        $activeTerm = AcademicTerm::where('is_active', true)->first();

        $terms = AcademicTerm::with('academicYear')
            ->orderBy('created_at', 'desc')
            ->get();

        // Use the term_id from the request, falling back to the active term
        $selectedTermId = $request->input('term_id');
        $selectedTerm = $selectedTermId
            ? AcademicTerm::with('academicYear')->find($selectedTermId)
            : $activeTerm;

        $stats = [
            'total_guardians' => Guardian::whereHas('students', function($q) {
                $q->where('status', 'active');
            })->count(),
            'total_invoices' => 0,
            'total_billed' => 0,
            'total_collected' => 0,
            'total_pending' => 0,
        ];

        $invoicesByStatus = [
            'pending' => 0,
            'partial' => 0,
            'paid' => 0,
        ];

        $monthlyCollections = [];
        $yearTerms         = [];
        $billedGuardians   = collect();
        $unbilledGuardians = collect();

        if ($selectedTerm) {
            $invoices = GuardianInvoice::where('academic_term_id', $selectedTerm->id)->get();
            $stats['total_invoices'] = $invoices->count();
            $stats['total_billed'] = $invoices->sum('total_amount');
            $stats['total_collected'] = $invoices->sum('amount_paid');
            $stats['total_pending'] = $stats['total_billed'] - $stats['total_collected'];

            // Invoice status breakdown
            $invoicesByStatus = [
                'pending' => $invoices->where('status', 'pending')->count(),
                'partial' => $invoices->where('status', 'partial')->count(),
                'paid' => $invoices->where('status', 'paid')->count(),
            ];

            // All terms for this academic year (for chart grouping)
            $allYearTerms = AcademicTerm::where('academic_year_id', $selectedTerm->academic_year_id)
                ->orderBy('term_number')
                ->get();

            $yearTermIds = $allYearTerms->pluck('id');

            // Monthly collections across the entire academic year, with term annotation
            $rawRows = DB::table('guardian_payments as gp')
                ->join('guardian_invoices as gi', 'gp.guardian_invoice_id', '=', 'gi.id')
                ->join('academic_terms as at', 'gi.academic_term_id', '=', 'at.id')
                ->whereIn('gi.academic_term_id', $yearTermIds)
                ->select(
                    DB::raw('DATE_FORMAT(gp.payment_date, "%Y-%m") as month_key'),
                    DB::raw('SUM(gp.amount) as total'),
                    'at.term_number'
                )
                ->groupBy('month_key', 'at.term_number')
                ->orderBy('month_key')
                ->get();

            // Consolidate: one bar per month, term = whichever term collected most that month
            $byMonth = [];
            foreach ($rawRows as $row) {
                $key = $row->month_key;
                if (!isset($byMonth[$key])) {
                    $byMonth[$key] = ['total' => 0, 'term_totals' => []];
                }
                $byMonth[$key]['total'] += $row->total;
                $byMonth[$key]['term_totals'][$row->term_number] =
                    ($byMonth[$key]['term_totals'][$row->term_number] ?? 0) + $row->total;
            }

            $monthlyCollections = collect($byMonth)->map(function ($data, $month_key) {
                arsort($data['term_totals']);
                $dominantTerm = (int) array_key_first($data['term_totals']);
                return [
                    'month'       => date('M Y', strtotime($month_key . '-01')),
                    'month_key'   => $month_key,
                    'total'       => (float) $data['total'],
                    'term_number' => $dominantTerm,
                ];
            })->values();

            // Term boundary metadata for the frontend
            $yearTerms = $allYearTerms->map(fn($t) => [
                'term_number' => $t->term_number,
                'start_month' => $t->start_date?->format('Y-m'),
                'end_month'   => $t->end_date?->format('Y-m'),
            ])->values();

            // Guardian billing status for the selected term
            // Build a map: guardian_id => invoice_id
            $billedMap = GuardianInvoice::where('academic_term_id', $selectedTerm->id)
                ->get(['id', 'guardian_id'])
                ->keyBy('guardian_id');

            $guardianList = Guardian::with(['user', 'students' => function ($q) {
                    $q->where('status', 'active');
                }])
                ->whereHas('students', function ($q) {
                    $q->where('status', 'active');
                })
                ->get()
                ->map(function ($guardian) use ($billedMap) {
                    $invoice = $billedMap->get($guardian->id);
                    return [
                        'id'              => $guardian->id,
                        'name'            => $guardian->user->name,
                        'guardian_number' => $guardian->guardian_number,
                        'students_count'  => $guardian->students->count(),
                        'is_billed'       => $invoice !== null,
                        'invoice_id'      => $invoice?->id,
                    ];
                });

            $billedGuardians   = $guardianList->filter(fn($g) => $g['is_billed'])->values();
            $unbilledGuardians = $guardianList->filter(fn($g) => !$g['is_billed'])->values();
        }

        return Inertia::render('Fees/Index', [
            'currentTerm'        => $activeTerm,
            'selectedTerm'       => $selectedTerm,
            'stats'              => $stats,
            'terms'              => $terms,
            'invoicesByStatus'   => $invoicesByStatus,
            'monthlyCollections' => $monthlyCollections,
            'yearTerms'          => $yearTerms,
            'billedGuardians'    => $billedGuardians,
            'unbilledGuardians'  => $unbilledGuardians,
        ]);
    }

    /**
     * Show bulk invoice generation page
     */
    public function bulkGenerate()
    {
        $terms = AcademicTerm::with('academicYear')
            ->orderBy('created_at', 'desc')
            ->get();

        // Get active term for preference checking
        $activeTerm = AcademicTerm::where('is_active', true)->first();

        $guardians = Guardian::with(['user', 'students' => function($q) {
                $q->where('status', 'active');
            }])
            ->whereHas('students', function($q) {
                $q->where('status', 'active');
            })
            ->get()
            ->map(function ($guardian) use ($activeTerm) {
                $activeStudents = $guardian->students->where('status', 'active');
                $studentsCount = $activeStudents->count();

                // Check preference status for active term
                $preferencesCount = 0;
                if ($activeTerm) {
                    $preferencesCount = GuardianFeePreference::where('guardian_id', $guardian->id)
                        ->where('academic_term_id', $activeTerm->id)
                        ->count();
                }

                return [
                    'id' => $guardian->id,
                    'name' => $guardian->user->name,
                    'guardian_number' => $guardian->guardian_number,
                    'students_count' => $studentsCount,
                    'has_preferences' => $preferencesCount === $studentsCount && $studentsCount > 0,
                    'preferences_count' => $preferencesCount,
                ];
            });

        return Inertia::render('Fees/BulkGenerate', [
            'terms' => $terms,
            'guardians' => $guardians,
            'activeTerm' => $activeTerm,
        ]);
    }

    /**
     * Process bulk invoice generation
     */
    public function processBulkGenerate(Request $request)
    {
        $validated = $request->validate([
            'academic_term_id' => 'required|exists:academic_terms,id',
            'payment_plan' => 'required|in:full,half_half,monthly',
            'guardian_ids' => 'nullable|array',
            'guardian_ids.*' => 'exists:guardians,id',
        ]);

        $term = AcademicTerm::findOrFail($validated['academic_term_id']);
        
        // Get guardians to process
        if (!empty($validated['guardian_ids'])) {
            $guardians = Guardian::whereIn('id', $validated['guardian_ids'])->get();
        } else {
            // All guardians with active students
            $guardians = Guardian::whereHas('students', function($q) {
                $q->where('status', 'active');
            })->get();
        }

        $results = [
            'success' => 0,
            'failed' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        DB::beginTransaction();

        try {
            foreach ($guardians as $guardian) {
                try {
                    // Check if invoice already exists
                    $existingInvoice = GuardianInvoice::where('guardian_id', $guardian->id)
                        ->where('academic_term_id', $term->id)
                        ->first();

                    if ($existingInvoice) {
                        $results['skipped']++;
                        continue;
                    }

                    $this->invoiceService->generateInvoiceForGuardian(
                        $guardian,
                        $term,
                        $request->user()->id,
                        $validated['payment_plan']
                    );

                    $results['success']++;
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = [
                        'guardian' => $guardian->user->name,
                        'error' => $e->getMessage(),
                    ];
                    Log::error('Bulk invoice generation failed for guardian', [
                        'guardian_id' => $guardian->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            DB::commit();

            // Build success message
            $message = "Successfully generated {$results['success']} invoice(s) for {$term->academicYear->year} - Term {$term->term_number}";
            if ($results['skipped'] > 0) {
                $message .= ". Skipped {$results['skipped']} (already exists)";
            }
            if ($results['failed'] > 0) {
                $message .= ". Failed: {$results['failed']}";
            }

            return redirect()->route('invoices.index')->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('invoices.index')->withErrors(['error' => 'Bulk generation failed: ' . $e->getMessage()]);
        }
    }
}

