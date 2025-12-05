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
    public function index()
    {
        $currentTerm = AcademicTerm::where('is_active', true)->first();

        $stats = [
            'total_guardians' => Guardian::whereHas('students', function($q) {
                $q->where('status', 'active');
            })->count(),
            'total_invoices' => 0,
            'total_billed' => 0,
            'total_collected' => 0,
        ];

        if ($currentTerm) {
            $invoices = GuardianInvoice::where('academic_term_id', $currentTerm->id)->get();
            $stats['total_invoices'] = $invoices->count();
            $stats['total_billed'] = $invoices->sum('total_amount');
            $stats['total_collected'] = $invoices->sum('amount_paid');
        }

        $terms = AcademicTerm::with('academicYear')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Fees/Index', [
            'currentTerm' => $currentTerm,
            'stats' => $stats,
            'terms' => $terms,
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

