<?php

namespace App\Http\Controllers;

use App\Models\SchoolSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SchoolSettingController extends Controller
{
    public function academic()
    {
        // Only admins can access
        if (!auth()->user()->isAdmin()) {
            abort(403);
        }

        $signature = SchoolSetting::get('headteacher_signature');

        return Inertia::render('Settings/Academic', [
            'signature' => $signature,
        ]);
    }

    public function updateAcademic(Request $request)
    {
        // Only admins can update
        if (!auth()->user()->isAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'signature' => 'nullable|image|max:2048', // 2MB max
        ]);

        if ($request->hasFile('signature')) {
            // Delete old signature if exists
            $oldSignature = SchoolSetting::get('headteacher_signature');
            if ($oldSignature && Storage::disk('public')->exists($oldSignature)) {
                Storage::disk('public')->delete($oldSignature);
            }

            // Store new signature
            $path = $request->file('signature')->store('signatures', 'public');
            SchoolSetting::set('headteacher_signature', $path);
        }

        return back()->with('success', 'Settings updated successfully.');
    }
}