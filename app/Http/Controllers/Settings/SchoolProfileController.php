<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SchoolProfileController extends Controller
{
    /**
     * Display the school profile settings page
     */
    public function index()
    {
        $school = School::find(auth()->user()->school_id);

        return Inertia::render('Settings/SchoolProfile/Index', [
            'school' => $school,
        ]);
    }

    /**
     * Update the school profile
     */
    public function update(Request $request)
    {
        $school = School::find(auth()->user()->school_id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'tagline' => 'nullable|string|max:500',
            'motto' => 'nullable|string|max:1000',
            'vision' => 'nullable|string|max:2000',
            'mission' => 'nullable|string|max:2000',
            'email' => 'nullable|email|max:255',
            'phone_primary' => 'nullable|string|max:20',
            'phone_secondary' => 'nullable|string|max:20',
            'physical_address' => 'nullable|string|max:500',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle logo upload
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($school->logo_path && Storage::disk('public')->exists($school->logo_path)) {
                Storage::disk('public')->delete($school->logo_path);
            }

            // Store new logo
            $logoPath = $request->file('logo')->store('logos', 'public');
            $validated['logo_path'] = $logoPath;
        }

        // Remove logo from validated data if not uploaded
        unset($validated['logo']);

        // Update school
        $school->update($validated);

        return redirect()->back()->with('success', 'School profile updated successfully!');
    }

    /**
     * Delete the school logo
     */
    public function deleteLogo()
    {
        $school = School::find(auth()->user()->school_id);

        if ($school->logo_path && Storage::disk('public')->exists($school->logo_path)) {
            Storage::disk('public')->delete($school->logo_path);
            $school->update(['logo_path' => null]);
        }

        return redirect()->back()->with('success', 'School logo deleted successfully!');
    }
}

