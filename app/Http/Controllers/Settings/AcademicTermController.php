<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AcademicTermController extends Controller
{
    /**
     * Display a listing of academic terms
     */
    public function index()
    {
        $academicYears = AcademicYear::with(['academicTerms' => function ($query) {
            $query->orderBy('term_number');
        }])->orderBy('year', 'desc')->get();

        return Inertia::render('Settings/AcademicTerms/Index', [
            'academicYears' => $academicYears,
        ]);
    }

    /**
     * Store a newly created academic term
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'term_number' => 'required|integer|min:1|max:3',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
        ]);

        // Get the academic year to validate dates
        $academicYear = AcademicYear::find($validated['academic_year_id']);
        
        // Validate term dates fall within academic year dates
        if ($validated['start_date'] < $academicYear->start_date->format('Y-m-d') || 
            $validated['end_date'] > $academicYear->end_date->format('Y-m-d')) {
            return redirect()->back()->with('error', 'Term dates must fall within the academic year dates.');
        }

        // Check for unique term number per academic year
        $existingTerm = AcademicTerm::where('academic_year_id', $validated['academic_year_id'])
            ->where('term_number', $validated['term_number'])
            ->first();

        if ($existingTerm) {
            return redirect()->back()->with('error', 'A term with this number already exists for this academic year.');
        }

        // If setting as active, deactivate all other terms for this year
        if ($validated['is_active'] ?? false) {
            AcademicTerm::where('academic_year_id', $validated['academic_year_id'])
                ->update(['is_active' => false]);
        }

        $academicTerm = AcademicTerm::create($validated);

        return redirect()->back()->with('success', 'Academic term created successfully!');
    }

    /**
     * Update the specified academic term
     */
    public function update(Request $request, AcademicTerm $academicTerm)
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'term_number' => 'required|integer|min:1|max:3',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
        ]);

        // Get the academic year to validate dates
        $academicYear = AcademicYear::find($validated['academic_year_id']);
        
        // Validate term dates fall within academic year dates
        if ($validated['start_date'] < $academicYear->start_date->format('Y-m-d') || 
            $validated['end_date'] > $academicYear->end_date->format('Y-m-d')) {
            return redirect()->back()->with('error', 'Term dates must fall within the academic year dates.');
        }

        // Check for unique term number per academic year (excluding current term)
        $existingTerm = AcademicTerm::where('academic_year_id', $validated['academic_year_id'])
            ->where('term_number', $validated['term_number'])
            ->where('id', '!=', $academicTerm->id)
            ->first();

        if ($existingTerm) {
            return redirect()->back()->with('error', 'A term with this number already exists for this academic year.');
        }

        // If setting as active, deactivate all other terms for this year
        if ($validated['is_active'] ?? false) {
            AcademicTerm::where('academic_year_id', $validated['academic_year_id'])
                ->where('id', '!=', $academicTerm->id)
                ->update(['is_active' => false]);
        }

        $academicTerm->update($validated);

        return redirect()->back()->with('success', 'Academic term updated successfully!');
    }

    /**
     * Remove the specified academic term
     */
    public function destroy(AcademicTerm $academicTerm)
    {
        // Check if term is used in invoices
        if ($academicTerm->guardianInvoices()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete academic term that has invoices. Please delete the invoices first.');
        }

        $academicTerm->delete();

        return redirect()->back()->with('success', 'Academic term deleted successfully!');
    }

    /**
     * Toggle the active status of an academic term
     */
    public function toggleActive(AcademicTerm $academicTerm)
    {
        DB::transaction(function () use ($academicTerm) {
            if (!$academicTerm->is_active) {
                // Deactivate all other terms for this academic year
                AcademicTerm::where('academic_year_id', $academicTerm->academic_year_id)
                    ->where('id', '!=', $academicTerm->id)
                    ->update(['is_active' => false]);
                
                $academicTerm->update(['is_active' => true]);
            } else {
                $academicTerm->update(['is_active' => false]);
            }
        });

        return redirect()->back()->with('success', 'Academic term status updated successfully!');
    }
}

