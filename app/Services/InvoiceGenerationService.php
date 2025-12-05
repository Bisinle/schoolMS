<?php

namespace App\Services;

use App\Models\AcademicTerm;
use App\Models\Guardian;
use App\Models\GuardianInvoice;
use App\Models\InvoiceLineItem;
use App\Models\FeeCategory;
use App\Models\FeeAmount;
use App\Models\GuardianFeeAdjustment;
use App\Models\OneTimeFee;
use App\Models\GuardianFeePreference;
use App\Models\TuitionFee;
use App\Models\TransportRoute;
use App\Models\UniversalFee;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InvoiceGenerationService
{
    /**
     * Generate invoice number
     * Format: INV-YYYY-T{TERM}-XXXX (e.g., INV-2025-T1-0001)
     */
    public function generateInvoiceNumber(int $schoolId, int $termId): string
    {
        $term = AcademicTerm::find($termId);
        $year = $term->academicYear->year;
        $termNumber = $term->term_number;

        // Get the latest invoice for this term
        $latestInvoice = GuardianInvoice::where('school_id', $schoolId)
            ->where('academic_term_id', $termId)
            ->orderByRaw("CAST(SUBSTRING_INDEX(invoice_number, '-', -1) AS UNSIGNED) DESC")
            ->first();

        if ($latestInvoice) {
            $parts = explode('-', $latestInvoice->invoice_number);
            $counter = isset($parts[3]) ? (int)$parts[3] : 0;
            $nextCounter = $counter + 1;
        } else {
            $nextCounter = 1;
        }

        // Format: INV-YYYY-T{TERM}-COUNTER
        return sprintf(
            'INV-%s-T%s-%s',
            $year, // Single year format (e.g., 2025)
            $termNumber,
            str_pad($nextCounter, 4, '0', STR_PAD_LEFT)
        );
    }

    /**
     * Generate invoice for a single guardian for a specific term
     */
    public function generateInvoiceForGuardian(
        Guardian $guardian,
        AcademicTerm $term,
        int $generatedBy,
        string $paymentPlan = 'full',
        array $options = []
    ): GuardianInvoice {
        DB::beginTransaction();

        try {
            // Check if invoice already exists
            $existingInvoice = GuardianInvoice::where('guardian_id', $guardian->id)
                ->where('academic_term_id', $term->id)
                ->first();

            if ($existingInvoice) {
                throw new \Exception("Invoice already exists for this guardian and term");
            }

            // Generate invoice number
            $invoiceNumber = $this->generateInvoiceNumber($guardian->school_id, $term->id);

            // Create invoice
            $invoice = GuardianInvoice::create([
                'school_id' => $guardian->school_id,
                'guardian_id' => $guardian->id,
                'academic_term_id' => $term->id,
                'invoice_number' => $invoiceNumber,
                'invoice_date' => now(),
                'due_date' => now()->addDays(14), // 2 weeks from now
                'payment_plan' => $paymentPlan,
                'generated_by' => $generatedBy,
            ]);

            // Generate line items
            $this->generateLineItems($invoice, $guardian, $term, $options);

            // Recalculate totals
            $invoice->recalculateTotals();

            DB::commit();

            Log::info('Invoice generated successfully', [
                'invoice_id' => $invoice->id,
                'guardian_id' => $guardian->id,
                'term_id' => $term->id,
            ]);

            return $invoice->fresh(['lineItems', 'payments']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice generation failed', [
                'guardian_id' => $guardian->id,
                'term_id' => $term->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Generate line items for an invoice
     * ENHANCED: Prioritizes fee preferences, falls back to old fee structure
     */
    protected function generateLineItems(
        GuardianInvoice $invoice,
        Guardian $guardian,
        AcademicTerm $term,
        array $options = []
    ): void {
        // Get all active students for this guardian
        $students = $guardian->students()->where('status', 'active')->with('grade')->get();

        if ($students->isEmpty()) {
            throw new \Exception("Guardian has no active students");
        }

        // Check if preferences exist for this guardian and term
        $preferences = GuardianFeePreference::where('guardian_id', $guardian->id)
            ->where('academic_term_id', $term->id)
            ->with(['transportRoute'])
            ->get()
            ->keyBy('student_id');

        $usePreferences = $preferences->isNotEmpty();

        Log::info('Invoice Generation - Preference Check', [
            'guardian_id' => $guardian->id,
            'term_id' => $term->id,
            'preferences_found' => $preferences->count(),
            'use_preferences' => $usePreferences,
        ]);

        // Get universal fees for this academic year
        $universalFees = UniversalFee::where('academic_year_id', $term->academic_year_id)
            ->where('is_active', true)
            ->get()
            ->keyBy('fee_type');

        // Create ONE line item per student
        foreach ($students as $student) {
            $grade = $student->grade;
            $feeBreakdown = [];

            if ($usePreferences && isset($preferences[$student->id])) {
                // Use fee preferences
                $preference = $preferences[$student->id];

                // 1. Tuition Fee
                $tuitionFee = TuitionFee::where('grade_id', $student->grade_id)
                    ->where('academic_year_id', $term->academic_year_id)
                    ->where('is_active', true)
                    ->first();

                if ($tuitionFee) {
                    $tuitionAmount = $preference->tuition_type === 'full_day'
                        ? $tuitionFee->amount_full_day
                        : $tuitionFee->amount_half_day;
                    $tuitionType = $preference->tuition_type === 'full_day' ? 'Full Day' : 'Half Day';

                    $feeBreakdown['Tuition'] = [
                        'type' => $tuitionType,
                        'amount' => (float) $tuitionAmount,
                    ];
                }

                // 2. Transport Fee
                if ($preference->transport_route_id && $preference->transport_type !== 'none') {
                    $route = $preference->transportRoute;
                    if ($route) {
                        $transportAmount = $preference->transport_type === 'two_way'
                            ? $route->amount_two_way
                            : $route->amount_one_way;
                        $transportType = $route->route_name . ' (' .
                            ($preference->transport_type === 'two_way' ? '2-Way' : '1-Way') . ')';

                        $feeBreakdown['Transport'] = [
                            'type' => $transportType,
                            'amount' => (float) $transportAmount,
                        ];
                    }
                }

                // 3. Food Fee
                if ($preference->include_food && isset($universalFees['food'])) {
                    $feeBreakdown['Food'] = [
                        'type' => 'Universal',
                        'amount' => (float) $universalFees['food']->amount,
                    ];
                }

                // 4. Sports Fee
                if ($preference->include_sports && isset($universalFees['sports'])) {
                    $feeBreakdown['Sports'] = [
                        'type' => 'Universal',
                        'amount' => (float) $universalFees['sports']->amount,
                    ];
                }

                Log::info('Invoice Generation - Using Preferences', [
                    'student' => $student->first_name . ' ' . $student->last_name,
                    'fee_breakdown' => $feeBreakdown,
                ]);
            } else {
                // Fallback to old fee structure
                $gradeName = $grade->name;
                $academicYearId = $term->academic_year_id;

                // Get fee adjustments for this guardian and term
                $adjustments = GuardianFeeAdjustment::where('guardian_id', $guardian->id)
                    ->where('academic_term_id', $term->id)
                    ->get()
                    ->keyBy('category_name');

                // Get all applicable fee amounts for this student's grade and academic year
                $applicableFees = FeeAmount::getApplicableFeesForGrade($gradeName, $academicYearId);

                foreach ($applicableFees as $feeAmount) {
                    $categoryName = $feeAmount->feeCategory->name;

                    // Check if this category is excluded or adjusted
                    $adjustment = $adjustments->get($categoryName);

                    if ($adjustment && $adjustment->adjustment_type === 'exclude') {
                        continue; // Skip this category
                    }

                    // Determine the amount to use
                    $amount = $feeAmount->amount;
                    $type = 'Standard';

                    if ($adjustment && $adjustment->adjustment_type === 'custom_amount') {
                        $amount = $adjustment->custom_amount;
                        $type = 'Adjusted';
                    }

                    // Add to fee breakdown with type information
                    $feeBreakdown[$categoryName] = [
                        'type' => $type,
                        'amount' => (float) $amount,
                    ];
                }

                Log::info('Invoice Generation - Using Old Fee Structure', [
                    'student' => $student->first_name . ' ' . $student->last_name,
                    'fees_found' => $applicableFees->count(),
                ]);
            }

            // Create single line item for this student with all fees
            InvoiceLineItem::create([
                'school_id' => $invoice->school_id,
                'guardian_invoice_id' => $invoice->id,
                'student_id' => $student->id,
                'student_name' => $student->first_name . ' ' . $student->last_name,
                'grade_name' => $grade->name,
                'fee_breakdown' => $feeBreakdown, // JSON: {"Tuition": 35000, "Transport": 10000, ...}
                // total_amount will be auto-calculated by model boot method
            ]);
        }
    }
}

