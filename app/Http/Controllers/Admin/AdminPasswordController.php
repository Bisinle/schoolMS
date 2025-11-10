<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\TemporaryPasswordMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminPasswordController extends Controller
{
    /**
     * Generate and send temporary password to user
     */
    public function generateTemporaryPassword(Request $request, User $user)
    {
        // Ensure only admins can do this
        if (!$request->user()->hasRole('admin')) {
            abort(403, 'Unauthorized action.');
        }

        try {
            // Generate strong temporary password
            $temporaryPassword = $this->generateSecurePassword();

            // Update user password and set flag
            $user->update([
                'password' => Hash::make($temporaryPassword),
                'must_change_password' => true,
                'password_changed_at' => now(),
            ]);

            // Send email with temporary password
            Mail::to($user->email)->send(new TemporaryPasswordMail($user, $temporaryPassword));

            // Log the action
            activity()
                ->causedBy($request->user())
                ->performedOn($user)
                ->log('Generated temporary password');

            return back()->with('success', "Temporary password has been sent to {$user->email}");
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to generate temporary password. Please try again.');
        }
    }

    /**
     * Generate a secure random password
     */
    private function generateSecurePassword(): string
    {
        $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $lowercase = 'abcdefghijklmnopqrstuvwxyz';
        $numbers = '0123456789';
        $special = '!@#$%^&*';

        $password = '';
        $password .= $uppercase[random_int(0, strlen($uppercase) - 1)];
        $password .= $lowercase[random_int(0, strlen($lowercase) - 1)];
        $password .= $numbers[random_int(0, strlen($numbers) - 1)];
        $password .= $special[random_int(0, strlen($special) - 1)];

        $allChars = $uppercase . $lowercase . $numbers . $special;
        for ($i = 0; $i < 8; $i++) {
            $password .= $allChars[random_int(0, strlen($allChars) - 1)];
        }

        return str_shuffle($password);
    }
}