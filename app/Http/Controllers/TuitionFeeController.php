<?php

namespace App\Http\Controllers;

use App\Models\TuitionFee;
use App\Models\Grade;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TuitionFeeController extends Controller
{
    /**
     * Display a listing of tuition fees
     */
    public function index(Request $request)
    {
        // Get the active academic year or the first one
        $activeYear = AcademicYear::active()->first() ?? AcademicYear::orderBy('year', 'desc')->first();
        
        // Get selected year from request or use active year
        $selectedYearId = $request->filled('year') ? $request->year : $activeYear?->id;
        
        $query = TuitionFee::with(['grade', 'academicYear']);

        // Filter by academic year
        if ($selectedYearId) {
            $query->where('academic_year_id', $selectedYearId);
        }

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('grade', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($request->filled('status')) {
            $isActive = $request->status === 'active';
            $query->where('is_active', $isActive);
        }

        $tuitionFees = $query->orderBy('grade_id')->get()->map(function ($fee) {
            return [
                'id' => $fee->id,
                'grade_id' => $fee->grade_id,
                'grade_name' => $fee->grade->name,
                'grade_level' => $fee->grade->level,
                'academic_year_id' => $fee->academic_year_id,
                'academic_year' => $fee->academicYear->year,
                'amount_full_day' => $fee->amount_full_day,
                'amount_half_day' => $fee->amount_half_day,
                'is_active' => $fee->is_active,
                'created_at' => $fee->created_at,
                'updated_at' => $fee->updated_at,
            ];
        });

        // Get all academic years for the year selector
        $academicYears = AcademicYear::orderBy('year', 'desc')->get();

        // Get all grades for bulk create
        $grades = Grade::where('status', 'active')->orderBy('level')->orderBy('name')->get();

        return Inertia::render('Fees/TuitionFees/Index', [
            'tuitionFees' => $tuitionFees,
            'academicYears' => $academicYears,
            'grades' => $grades,
            'selectedYear' => $selectedYearId ? AcademicYear::find($selectedYearId) : $activeYear,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'year' => $selectedYearId,
            ],
        ]);
    }

    /**
     * Store a newly created tuition fee
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'grade_id' => 'required|exists:grades,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'amount_full_day' => 'required|numeric|min:0',
            'amount_half_day' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Validate that full-day amount is greater than half-day
        if ($validated['amount_full_day'] <= $validated['amount_half_day']) {
            return redirect()->back()
                ->withErrors(['amount_full_day' => 'Full-day amount must be greater than half-day amount.'])
                ->withInput();
        }

        // Check for duplicate (grade + academic year)
        $exists = TuitionFee::where('grade_id', $validated['grade_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->exists();
        
        if ($exists) {
            return redirect()->back()
                ->withErrors(['grade_id' => 'Tuition fee for this grade and academic year already exists.'])
                ->withInput();
        }

        $validated['school_id'] = auth()->user()->school_id;
        $validated['is_active'] = $validated['is_active'] ?? true;

        TuitionFee::create($validated);

        return redirect()->back()->with('success', 'Tuition fee created successfully.');
    }

    /**
     * Update the specified tuition fee
     */
    public function update(Request $request, TuitionFee $tuitionFee)
    {
        $validated = $request->validate([
            'amount_full_day' => 'required|numeric|min:0',
            'amount_half_day' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Validate that full-day amount is greater than half-day
        if ($validated['amount_full_day'] <= $validated['amount_half_day']) {
            return redirect()->back()
                ->withErrors(['amount_full_day' => 'Full-day amount must be greater than half-day amount.'])
                ->withInput();
        }

        $tuitionFee->update($validated);

        return redirect()->back()->with('success', 'Tuition fee updated successfully.');
    }

    /**
     * Remove the specified tuition fee
     */
    public function destroy(TuitionFee $tuitionFee)
    {
        $tuitionFee->delete();

        return redirect()->back()->with('success', 'Tuition fee deleted successfully.');
    }

    /**
     * Toggle the active status of a tuition fee
     */
    public function toggleStatus(TuitionFee $tuitionFee)
    {
        $tuitionFee->update([
            'is_active' => !$tuitionFee->is_active,
        ]);

        $status = $tuitionFee->is_active ? 'activated' : 'deactivated';
        return redirect()->back()->with('success', "Tuition fee {$status} successfully.");
    }

    /**
     * Bulk create tuition fees for all grades
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'fees' => 'required|array',
            'fees.*.grade_id' => 'required|exists:grades,id',
            'fees.*.amount_full_day' => 'required|numeric|min:0',
            'fees.*.amount_half_day' => 'required|numeric|min:0',
        ]);

        $schoolId = auth()->user()->school_id;
        $createdCount = 0;
        $skippedCount = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($validated['fees'] as $feeData) {
                // Validate that full-day > half-day
                if ($feeData['amount_full_day'] <= $feeData['amount_half_day']) {
                    $grade = Grade::find($feeData['grade_id']);
                    $errors[] = "Skipped {$grade->name}: Full-day must be greater than half-day.";
                    $skippedCount++;
                    continue;
                }

                // Check if already exists
                $exists = TuitionFee::where('grade_id', $feeData['grade_id'])
                    ->where('academic_year_id', $validated['academic_year_id'])
                    ->exists();

                if ($exists) {
                    $skippedCount++;
                    continue;
                }

                // Create the tuition fee
                TuitionFee::create([
                    'school_id' => $schoolId,
                    'grade_id' => $feeData['grade_id'],
                    'academic_year_id' => $validated['academic_year_id'],
                    'amount_full_day' => $feeData['amount_full_day'],
                    'amount_half_day' => $feeData['amount_half_day'],
                    'is_active' => true,
                ]);

                $createdCount++;
            }

            DB::commit();

            $message = "Created {$createdCount} tuition fee(s).";
            if ($skippedCount > 0) {
                $message .= " Skipped {$skippedCount} (already exist or validation failed).";
            }

            return redirect()->back()
                ->with('success', $message)
                ->with('warnings', $errors); // Changed from 'errors' to 'warnings'

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['bulk' => 'Failed to create tuition fees: ' . $e->getMessage()])
                ->withInput();
        }
    }
}

