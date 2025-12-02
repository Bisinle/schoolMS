<?php

namespace App\Http\Controllers;

use App\Models\FeeCategory;
use App\Models\Grade;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class FeeCategoryController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $query = FeeCategory::with(['grade']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('category_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by grade
        if ($request->filled('grade_id') && $request->grade_id !== 'all') {
            $query->where('grade_id', $request->grade_id);
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $isActive = $request->status === 'active';
            $query->where('is_active', $isActive);
        }

        // Sort
        $sortField = $request->get('sort_field', 'category_name');
        $sortDirection = $request->get('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $feeCategories = $query->paginate(15)->withQueryString();

        $grades = Grade::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Fees/Categories/Index', [
            'feeCategories' => $feeCategories,
            'grades' => $grades,
            'filters' => $request->only(['search', 'grade_id', 'status', 'sort_field', 'sort_direction']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'grade_id' => 'required|exists:grades,id',
            'category_name' => 'required|string|max:255',
            'default_amount' => 'required|numeric|min:0',
            'is_per_child' => 'boolean',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Check if fee category already exists for this grade
        $exists = FeeCategory::where('grade_id', $validated['grade_id'])
            ->where('category_name', $validated['category_name'])
            ->exists();

        if ($exists) {
            return redirect()->back()
                ->withErrors(['category_name' => 'A fee category with this name already exists for the selected grade.'])
                ->withInput();
        }

        $validated['is_per_child'] = $validated['is_per_child'] ?? true;
        $validated['is_active'] = $validated['is_active'] ?? true;

        FeeCategory::create($validated);

        return redirect()->route('fee-categories.index')->with('success', 'Fee category created successfully.');
    }

    public function update(Request $request, FeeCategory $feeCategory)
    {
        $validated = $request->validate([
            'grade_id' => 'required|exists:grades,id',
            'category_name' => 'required|string|max:255',
            'default_amount' => 'required|numeric|min:0',
            'is_per_child' => 'boolean',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Check if fee category already exists for this grade (excluding current record)
        $exists = FeeCategory::where('grade_id', $validated['grade_id'])
            ->where('category_name', $validated['category_name'])
            ->where('id', '!=', $feeCategory->id)
            ->exists();

        if ($exists) {
            return redirect()->back()
                ->withErrors(['category_name' => 'A fee category with this name already exists for the selected grade.'])
                ->withInput();
        }

        $feeCategory->update($validated);

        return redirect()->route('fee-categories.index')->with('success', 'Fee category updated successfully.');
    }

    public function destroy(FeeCategory $feeCategory)
    {
        // Check if fee category is used in any invoices
        // For now, we'll allow deletion
        // TODO: Add check for invoice line items if needed
        
        $feeCategory->delete();

        return redirect()->route('fee-categories.index')->with('success', 'Fee category deleted successfully.');
    }

    public function toggleStatus(FeeCategory $feeCategory)
    {
        $feeCategory->update([
            'is_active' => !$feeCategory->is_active
        ]);

        $status = $feeCategory->is_active ? 'activated' : 'deactivated';
        return redirect()->route('fee-categories.index')->with('success', "Fee category {$status} successfully.");
    }
}

