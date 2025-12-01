<?php

namespace App\Http\Controllers;

use App\Models\GuardianPayment;
use App\Models\GuardianInvoice;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaymentController extends Controller
{
    use AuthorizesRequests;

    /**
     * Show the form for creating a new payment
     */
    public function create(GuardianInvoice $invoice)
    {
        $invoice->load([
            'guardian.user',
            'academicTerm.academicYear',
            'payments'
        ]);

        // Check if invoice is already fully paid
        if ($invoice->balance_due <= 0) {
            return redirect()->route('invoices.show', $invoice)
                ->withErrors(['error' => 'This invoice is already fully paid']);
        }

        return Inertia::render('Fees/Payments/Create', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Store a newly created payment
     */
    public function store(Request $request, GuardianInvoice $invoice)
    {
        $validated = $request->validate([
            'amount' => [
                'required',
                'numeric',
                'min:0.01',
                'max:' . $invoice->balance_due
            ],
            'payment_date' => 'required|date|before_or_equal:today',
            'payment_method' => 'required|in:cash,mpesa,bank_transfer,cheque',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ], [
            'amount.max' => 'Payment amount cannot exceed the balance due (KSh ' . number_format($invoice->balance_due, 2) . ')',
        ]);

        try {
            DB::beginTransaction();

            // Create payment record
            $payment = GuardianPayment::create([
                'school_id' => auth()->user()->school_id,
                'guardian_invoice_id' => $invoice->id,
                'amount' => $validated['amount'],
                'payment_date' => $validated['payment_date'],
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'recorded_by' => auth()->id(),
            ]);

            // The GuardianPayment model's boot method will automatically
            // trigger invoice recalculation via the 'created' event

            DB::commit();

            return redirect()->route('invoices.show', $invoice)
                ->with('success', 'Payment recorded successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to record payment: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified payment
     */
    public function show(GuardianPayment $payment)
    {
        $payment->load([
            'invoice.guardian.user',
            'invoice.academicTerm.academicYear',
            'recordedBy'
        ]);

        return Inertia::render('Fees/Payments/Show', [
            'payment' => $payment,
        ]);
    }

    /**
     * Remove the specified payment
     */
    public function destroy(GuardianPayment $payment)
    {
        // Only admins can delete payments
        if (!auth()->user()->isAdmin()) {
            return back()->withErrors(['error' => 'Unauthorized']);
        }

        try {
            DB::beginTransaction();

            $invoice = $payment->invoice;
            $payment->delete();

            // The GuardianPayment model's boot method will automatically
            // trigger invoice recalculation via the 'deleted' event

            DB::commit();

            return redirect()->route('invoices.show', $invoice)
                ->with('success', 'Payment deleted successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to delete payment: ' . $e->getMessage()]);
        }
    }
}

