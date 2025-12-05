<?php

namespace App\Http\Controllers;

use App\Models\UniversalFee;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UniversalFeeController extends Controller
{
    /**
     * Display universal fees for the active academic year
     */
    public function index(Request $request)
    {
        // Get the active academic year or the first one
        $activeYear = AcademicYear::active()->first() ?? AcademicYear::orderBy('year', 'desc')->first();
        
        // Get selected year from request or use active year
        $selectedYearId = $request->filled('year') ? $request->year : $activeYear?->id;
        
        $query = UniversalFee::with('academicYear');

        // Filter by academic year
        if ($selectedYearId) {
            $query->where('academic_year_id', $selectedYearId);
        }

        // Apply status filter
        if ($request->filled('status')) {
            $isActive = $request->status === 'active';
            $query->where('is_active', $isActive);
        }

        $universalFees = $query->orderBy('fee_type')->get()->map(function ($fee) {
            return [
                'id' => $fee->id,
                'fee_type' => $fee->fee_type,
                'fee_name' => $fee->getFeeTypeName(),
                'amount' => $fee->amount,
                'academic_year_id' => $fee->academic_year_id,
                'academic_year' => $fee->academicYear->year,
                'is_active' => $fee->is_active,
                'created_at' => $fee->created_at,
                'updated_at' => $fee->updated_at,
            ];
        });

        // Get all academic years for the year selector
        $academicYears = AcademicYear::orderBy('year', 'desc')->get();

        return Inertia::render('Fees/UniversalFees/Index', [
            'universalFees' => $universalFees,
            'academicYears' => $academicYears,
            'selectedYear' => $selectedYearId ? AcademicYear::find($selectedYearId) : $activeYear,
            'filters' => [
                'status' => $request->status ?? '',
                'year' => $selectedYearId,
            ],
        ]);
    }

    /**
     * Store a newly created universal fee
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fee_type' => 'required|in:food,sports,library,technology',
            'academic_year_id' => 'required|exists:academic_years,id',
            'amount' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Check for duplicate (fee_type + academic year)
        $exists = UniversalFee::where('fee_type', $validated['fee_type'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->exists();
        
        if ($exists) {
            return redirect()->back()
                ->withErrors(['fee_type' => 'This universal fee for the selected academic year already exists.'])
                ->withInput();
        }

        $validated['school_id'] = auth()->user()->school_id;
        $validated['is_active'] = $validated['is_active'] ?? true;

        UniversalFee::create($validated);

        return redirect()->back()->with('success', 'Universal fee created successfully.');
    }

    /**
     * Update the specified universal fee
     */
    public function update(Request $request, UniversalFee $universalFee)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $universalFee->update($validated);

        return redirect()->back()->with('success', 'Universal fee updated successfully.');
    }

    /**
     * Remove the specified universal fee
     */
    public function destroy(UniversalFee $universalFee)
    {
        $universalFee->delete();

        return redirect()->back()->with('success', 'Universal fee deleted successfully.');
    }

    /**
     * Toggle the active status of a universal fee
     */
    public function toggleStatus(UniversalFee $universalFee)
    {
        $universalFee->update([
            'is_active' => !$universalFee->is_active,
        ]);

        $status = $universalFee->is_active ? 'activated' : 'deactivated';
        return redirect()->back()->with('success', "Universal fee {$status} successfully.");
    }

    /**
     * Bulk create universal fees for all types
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'fees' => 'required|array',
            'fees.*.fee_type' => 'required|in:food,sports,library,technology',
            'fees.*.amount' => 'required|numeric|min:0',
        ]);

        $schoolId = auth()->user()->school_id;
        $createdCount = 0;
        $skippedCount = 0;

        foreach ($validated['fees'] as $feeData) {
            // Check if already exists
            $exists = UniversalFee::where('fee_type', $feeData['fee_type'])
                ->where('academic_year_id', $validated['academic_year_id'])
                ->exists();

            if ($exists) {
                $skippedCount++;
                continue;
            }

            // Create the universal fee
            UniversalFee::create([
                'school_id' => $schoolId,
                'fee_type' => $feeData['fee_type'],
                'academic_year_id' => $validated['academic_year_id'],
                'amount' => $feeData['amount'],
                'is_active' => true,
            ]);

            $createdCount++;
        }

        $message = "Created {$createdCount} universal fee(s).";
        if ($skippedCount > 0) {
            $message .= " Skipped {$skippedCount} (already exist).";
        }

        return redirect()->back()->with('success', $message);
    }
}

