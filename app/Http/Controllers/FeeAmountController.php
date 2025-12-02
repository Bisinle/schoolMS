<?php

namespace App\Http\Controllers;

use App\Models\FeeAmount;
use App\Models\FeeCategory;
use App\Models\AcademicYear;
use Illuminate\Http\Request;

class FeeAmountController extends Controller
{
    /**
     * Store a newly created fee amount
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fee_category_id' => 'required|exists:fee_categories,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'grade_range' => 'nullable|string|max:50',
            'amount' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Get the fee category to check if it's universal
        $feeCategory = FeeCategory::findOrFail($validated['fee_category_id']);

        // Validate based on category type
        if ($feeCategory->is_universal && $validated['grade_range'] !== null) {
            return redirect()->back()
                ->withErrors(['grade_range' => 'Universal fees cannot have a grade range.'])
                ->withInput();
        }

        if (!$feeCategory->is_universal && $validated['grade_range'] === null) {
            return redirect()->back()
                ->withErrors(['grade_range' => 'Grade-specific fees must have a grade range.'])
                ->withInput();
        }

        // Check for duplicate fee amount (same category, year, and grade range)
        $exists = FeeAmount::where('fee_category_id', $validated['fee_category_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('grade_range', $validated['grade_range'])
            ->exists();

        if ($exists) {
            return redirect()->back()
                ->withErrors(['grade_range' => 'A fee amount already exists for this category, year, and grade range.'])
                ->withInput();
        }

        $validated['is_active'] = $validated['is_active'] ?? true;

        FeeAmount::create($validated);

        return redirect()->back()->with('success', 'Fee amount created successfully.');
    }

    /**
     * Update the specified fee amount
     */
    public function update(Request $request, FeeAmount $feeAmount)
    {
        $validated = $request->validate([
            'grade_range' => 'nullable|string|max:50',
            'amount' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Get the fee category to check if it's universal
        $feeCategory = $feeAmount->feeCategory;

        // Validate based on category type
        if ($feeCategory->is_universal && $validated['grade_range'] !== null) {
            return redirect()->back()
                ->withErrors(['grade_range' => 'Universal fees cannot have a grade range.'])
                ->withInput();
        }

        if (!$feeCategory->is_universal && $validated['grade_range'] === null) {
            return redirect()->back()
                ->withErrors(['grade_range' => 'Grade-specific fees must have a grade range.'])
                ->withInput();
        }

        // Check for duplicate (excluding current record)
        $exists = FeeAmount::where('fee_category_id', $feeAmount->fee_category_id)
            ->where('academic_year_id', $feeAmount->academic_year_id)
            ->where('grade_range', $validated['grade_range'])
            ->where('id', '!=', $feeAmount->id)
            ->exists();

        if ($exists) {
            return redirect()->back()
                ->withErrors(['grade_range' => 'A fee amount already exists for this category, year, and grade range.'])
                ->withInput();
        }

        $feeAmount->update($validated);

        return redirect()->back()->with('success', 'Fee amount updated successfully.');
    }

    /**
     * Remove the specified fee amount
     */
    public function destroy(FeeAmount $feeAmount)
    {
        $feeAmount->delete();

        return redirect()->back()->with('success', 'Fee amount deleted successfully.');
    }

    /**
     * Toggle the active status of a fee amount
     */
    public function toggleStatus(FeeAmount $feeAmount)
    {
        $feeAmount->update(['is_active' => !$feeAmount->is_active]);

        return redirect()->back()->with('success', 'Fee amount status updated successfully.');
    }
}

