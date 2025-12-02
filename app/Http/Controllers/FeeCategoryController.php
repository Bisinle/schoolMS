<?php

namespace App\Http\Controllers;

use App\Models\FeeCategory;
use App\Models\FeeAmount;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeeCategoryController extends Controller
{
    /**
     * Display a listing of fee categories with their amounts
     */
    public function index(Request $request)
    {
        // Get the active academic year or the first one
        $activeYear = AcademicYear::active()->first() ?? AcademicYear::orderBy('year', 'desc')->first();

        $query = FeeCategory::with(['feeAmounts' => function ($query) use ($activeYear) {
            if ($activeYear) {
                $query->where('academic_year_id', $activeYear->id);
            }
            $query->orderBy('grade_range');
        }]);

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply type filter (universal/grade-specific)
        if ($request->filled('type')) {
            if ($request->type === 'universal') {
                $query->universal();
            } elseif ($request->type === 'grade_specific') {
                $query->gradeSpecific();
            }
        }

        // Apply status filter
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->active();
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $feeCategories = $query->orderBy('name')->get();

        // Get all academic years for the year selector
        $academicYears = AcademicYear::orderBy('year', 'desc')->get();

        return Inertia::render('Fees/Categories/Index', [
            'feeCategories' => $feeCategories,
            'academicYears' => $academicYears,
            'activeYear' => $activeYear,
            'filters' => [
                'search' => $request->search ?? '',
                'type' => $request->type ?? '',
                'status' => $request->status ?? '',
            ],
        ]);
    }

    /**
     * Store a newly created fee category
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_universal' => 'required|boolean',
            'is_active' => 'boolean',
        ]);

        // Check for duplicate category name
        $exists = FeeCategory::where('name', $validated['name'])->exists();
        if ($exists) {
            return redirect()->back()
                ->withErrors(['name' => 'A fee category with this name already exists.'])
                ->withInput();
        }

        $validated['is_active'] = $validated['is_active'] ?? true;

        FeeCategory::create($validated);

        return redirect()->back()->with('success', 'Fee category created successfully.');
    }

    /**
     * Update the specified fee category
     */
    public function update(Request $request, FeeCategory $feeCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_universal' => 'required|boolean',
            'is_active' => 'boolean',
        ]);

        // Check for duplicate category name (excluding current record)
        $exists = FeeCategory::where('name', $validated['name'])
            ->where('id', '!=', $feeCategory->id)
            ->exists();

        if ($exists) {
            return redirect()->back()
                ->withErrors(['name' => 'A fee category with this name already exists.'])
                ->withInput();
        }

        $feeCategory->update($validated);

        return redirect()->back()->with('success', 'Fee category updated successfully.');
    }

    /**
     * Remove the specified fee category
     * Note: This will cascade delete all associated fee amounts
     */
    public function destroy(FeeCategory $feeCategory)
    {
        $amountsCount = $feeCategory->feeAmounts()->count();

        $feeCategory->delete();

        $message = 'Fee category deleted successfully!';
        if ($amountsCount > 0) {
            $message .= " ({$amountsCount} associated fee amount" . ($amountsCount > 1 ? 's' : '') . " also deleted)";
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Toggle the active status of a fee category
     */
    public function toggleStatus(FeeCategory $feeCategory)
    {
        $feeCategory->update(['is_active' => !$feeCategory->is_active]);

        return redirect()->back()->with('success', 'Fee category status updated successfully.');
    }
}

