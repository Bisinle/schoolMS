<?php

namespace App\Http\Controllers;

use App\Models\GuardianInvoice;
use App\Models\Guardian;
use App\Models\AcademicTerm;
use App\Models\InvoiceLineItem;
use App\Models\GuardianPayment;
use App\Services\InvoiceGenerationService;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected InvoiceGenerationService $invoiceService
    ) {}

    /**
     * Display a listing of invoices
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Build query based on user role
        if ($user->isGuardian()) {
            $query = GuardianInvoice::where('guardian_id', $user->guardian->id);
        } else {
            $query = GuardianInvoice::query();
        }

        // Get filter values (handle both string and array inputs)
        $search = is_array($request->search) ? '' : $request->search;
        $termId = is_array($request->term_id) ? '' : $request->term_id;
        $status = is_array($request->status) ? '' : $request->status;

        // Get active term for default filtering
        $activeTerm = AcademicTerm::where('is_active', true)->first();

        // If no term filter is specified, default to active term
        if (!$termId && $activeTerm) {
            $termId = $activeTerm->id;
        }

        // Apply filters
        $query->with(['guardian.user', 'academicTerm.academicYear'])
            ->when($search, function ($q, $search) {
                $q->where(function($query) use ($search) {
                    $query->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('guardian.user', function($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($termId, function ($q, $termId) {
                $q->where('academic_term_id', $termId);
            })
            ->when($status, function ($q, $status) {
                $q->where('status', $status);
            });

        $invoices = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Get terms for filter dropdown
        $terms = AcademicTerm::with('academicYear')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Fees/Invoices/Index', [
            'invoices' => $invoices,
            'terms' => $terms,
            'activeTerm' => $activeTerm,
            'filters' => [
                'search' => $search ?? '',
                'term_id' => $termId ?? '',
                'status' => $status ?? '',
            ],
        ]);
    }

    /**
     * Show the form for creating a new invoice
     */
    public function create()
    {
        $guardians = Guardian::with(['user', 'students'])
            ->whereHas('students', function($q) {
                $q->where('status', 'active');
            })
            ->get()
            ->map(function ($guardian) {
                return [
                    'id' => $guardian->id,
                    'name' => $guardian->user->name,
                    'guardian_number' => $guardian->guardian_number,
                    'students_count' => $guardian->students->where('status', 'active')->count(),
                ];
            });

        // Only get the active term for invoice creation
        $activeTerm = AcademicTerm::where('is_active', true)
            ->with('academicYear')
            ->first();

        if (!$activeTerm) {
            return redirect()->route('fees.index')
                ->with('error', 'No active academic term found. Please activate a term in Settings → Academic Years before creating invoices.');
        }

        return Inertia::render('Fees/Invoices/Create', [
            'guardians' => $guardians,
            'activeTerm' => $activeTerm,
        ]);
    }

    /**
     * Store a newly created invoice
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'guardian_id' => 'required|exists:guardians,id',
            'academic_term_id' => 'required|exists:academic_terms,id',
            'payment_plan' => 'required|in:full,half_half,monthly',
        ]);

        $guardian = Guardian::findOrFail($validated['guardian_id']);
        $term = AcademicTerm::findOrFail($validated['academic_term_id']);

        // Ensure the term is active
        if (!$term->is_active) {
            return back()->withErrors(['error' => 'Invoices can only be created for the active academic term.']);
        }

        try {
            $invoice = $this->invoiceService->generateInvoiceForGuardian(
                $guardian,
                $term,
                $request->user()->id,
                $validated['payment_plan']
            );

            return redirect()->route('invoices.show', $invoice)
                ->with('success', 'Invoice generated successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Display the specified invoice
     */
    public function show(GuardianInvoice $invoice)
    {
        // Authorize: Admins can view all, guardians can only view their own
        $this->authorize('view', $invoice);

        $invoice->load([
            'guardian.user',
            'guardian.students.grade',
            'academicTerm.academicYear',
            'lineItems',
            'payments.recordedBy',
            'generatedBy'
        ]);

        // Get school information for invoice header
        $school = \App\Models\School::find(auth()->user()->school_id);

        return Inertia::render('Fees/Invoices/Show', [
            'invoice' => $invoice,
            'school' => $school,
        ]);
    }

    /**
     * Update invoice line items (edit fee breakdown)
     */
    public function updateLineItems(Request $request, GuardianInvoice $invoice)
    {
        // Authorize: Only admins can edit
        $this->authorize('update', $invoice);

        // Only allow editing pending invoices
        if ($invoice->status !== 'pending') {
            return back()->withErrors(['error' => 'Can only edit pending invoices']);
        }

        // Log the incoming request for debugging
        Log::info('Update Line Items Request', [
            'invoice_id' => $invoice->id,
            'request_data' => $request->all()
        ]);

        // Validate the line items
        $validated = $request->validate([
            'line_items' => 'required|array',
            'line_items.*.id' => 'required|exists:invoice_line_items,id',
            'line_items.*.fee_breakdown' => 'required|array',
            'line_items.*.fee_breakdown.*' => 'numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['line_items'] as $itemData) {
                $lineItem = InvoiceLineItem::find($itemData['id']);

                // Verify this line item belongs to this invoice
                if ($lineItem->guardian_invoice_id !== $invoice->id) {
                    throw new \Exception('Invalid line item');
                }

                // Update fee breakdown (total_amount will auto-calculate via model observer)
                $lineItem->fee_breakdown = $itemData['fee_breakdown'];
                $lineItem->save();
            }

            // Recalculate invoice totals
            $invoice->recalculateTotals();

            DB::commit();

            return back()->with('success', 'Invoice updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update invoice', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['error' => 'Failed to update invoice: ' . $e->getMessage()]);
        }
    }

    /**
     * Download invoice as PDF
     */
    public function downloadPdf(GuardianInvoice $invoice)
    {
        // Authorize: Admins can download all, guardians can only download their own
        $this->authorize('view', $invoice);

        $invoice->load([
            'guardian.user',
            'guardian.students.grade',
            'academicTerm.academicYear',
            'lineItems',
            'payments.recordedBy',
            'generatedBy'
        ]);

        // Get school information for invoice header
        $school = \App\Models\School::find(auth()->user()->school_id);

        // Generate PDF
        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoice,
            'school' => $school,
        ]);

        // Set paper size and orientation
        $pdf->setPaper('a4', 'portrait');

        // Download the PDF
        return $pdf->download('invoice-' . $invoice->invoice_number . '.pdf');
    }

    /**
     * Remove the specified invoice
     * Note: Payments and line items will be cascade deleted automatically
     */
    public function destroy(GuardianInvoice $invoice)
    {
        // Allow deletion even with payments (for development)
        // Payments and line items will be cascade deleted due to foreign key constraints

        $invoiceNumber = $invoice->invoice_number;
        $invoice->delete();

        return redirect()->route('invoices.index')
            ->with('success', "Invoice {$invoiceNumber} and all associated payments deleted successfully");
    }

    /**
     * Clear all invoices (for development)
     * Deletes all invoices, line items, and payments
     */
    public function clearAll()
    {
        DB::beginTransaction();

        try {
            $schoolId = auth()->user()->school_id;

            // Count before deletion
            $invoiceCount = GuardianInvoice::where('school_id', $schoolId)->count();
            $paymentCount = GuardianPayment::where('school_id', $schoolId)->count();

            // Delete all payments first
            GuardianPayment::where('school_id', $schoolId)->delete();

            // Delete all line items
            InvoiceLineItem::where('school_id', $schoolId)->delete();

            // Delete all invoices
            GuardianInvoice::where('school_id', $schoolId)->delete();

            DB::commit();

            return redirect()->route('invoices.index')
                ->with('success', "Successfully deleted {$invoiceCount} invoices and {$paymentCount} payments");
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to clear invoices: ' . $e->getMessage()]);
        }
    }
}

