<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AcademicYearController extends Controller
{
    /**
     * Display a listing of academic years
     */
    public function index()
    {
        $academicYears = AcademicYear::with('academicTerms')
            ->orderBy('year', 'desc')
            ->get();

        return Inertia::render('Settings/AcademicYears/Index', [
            'academicYears' => $academicYears,
        ]);
    }

    /**
     * Store a newly created academic year
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|string|max:10|unique:academic_years,year,NULL,id,school_id,' . auth()->user()->school_id,
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
        ]);

        // If setting as active, deactivate all other years
        if ($validated['is_active'] ?? false) {
            AcademicYear::where('school_id', auth()->user()->school_id)
                ->update(['is_active' => false]);
        }

        $academicYear = AcademicYear::create($validated);

        return redirect()->back()->with('success', 'Academic year created successfully!');
    }

    /**
     * Update the specified academic year
     */
    public function update(Request $request, AcademicYear $academicYear)
    {
        $validated = $request->validate([
            'year' => 'required|string|max:10|unique:academic_years,year,' . $academicYear->id . ',id,school_id,' . auth()->user()->school_id,
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
        ]);

        // If setting as active, deactivate all other years
        if ($validated['is_active'] ?? false) {
            AcademicYear::where('school_id', auth()->user()->school_id)
                ->where('id', '!=', $academicYear->id)
                ->update(['is_active' => false]);
        }

        $academicYear->update($validated);

        return redirect()->back()->with('success', 'Academic year updated successfully!');
    }

    /**
     * Remove the specified academic year
     * Note: This will cascade delete all associated academic terms and their invoices
     */
    public function destroy(AcademicYear $academicYear)
    {
        $termsCount = $academicYear->academicTerms()->count();

        $academicYear->delete();

        $message = 'Academic year deleted successfully!';
        if ($termsCount > 0) {
            $message .= " ({$termsCount} associated term" . ($termsCount > 1 ? 's' : '') . " also deleted)";
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Toggle the active status of an academic year
     */
    public function toggleActive(AcademicYear $academicYear)
    {
        DB::transaction(function () use ($academicYear) {
            if (!$academicYear->is_active) {
                // Deactivate all other years
                AcademicYear::where('school_id', auth()->user()->school_id)
                    ->where('id', '!=', $academicYear->id)
                    ->update(['is_active' => false]);
                
                $academicYear->update(['is_active' => true]);
            } else {
                $academicYear->update(['is_active' => false]);
            }
        });

        return redirect()->back()->with('success', 'Academic year status updated successfully!');
    }
}

