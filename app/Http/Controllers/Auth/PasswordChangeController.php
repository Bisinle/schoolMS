<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordChangeController extends Controller
{
    /**
     * Show the change password form
     */
    public function show(): Response
    {
        return Inertia::render('Auth/ChangePassword', [
            'mustChange' => auth()->user()->must_change_password,
        ]);
    }

    /**
     * Handle password change request
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        // Verify current password
        if (!Hash::check($validated['current_password'], $request->user()->password)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'current_password' => ['The provided password does not match your current password.'],
            ]);
        }

        // Update password and reset flag
        $request->user()->update([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);

        // Log the action
        activity()
            ->causedBy($request->user())
            ->log('Changed password');

        return redirect()->route('dashboard')->with('success', 'Password updated successfully!');
    }
}