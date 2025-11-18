<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\DemoBookingNotification;

class DemoBookingController extends Controller
{
    /**
     * Handle the demo booking form submission.
     */
    public function submit(Request $request)
    {
        // Validate the form data
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'school_name' => 'nullable|string|max:255',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required|string',
            'message' => 'nullable|string|max:1000',
        ]);

        try {
            // Send email synchronously (not queued)
            Mail::to('alelmischoools@gmail.com')->send(new DemoBookingNotification($validated));

            Log::info('Demo booking submitted successfully', [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'date' => $validated['date'],
                'time' => $validated['time'],
            ]);

            // Redirect to success page
            return redirect()->route('demo.success');
        } catch (\Exception $e) {
            Log::error('Failed to send demo booking email', [
                'error' => $e->getMessage(),
                'data' => $validated,
            ]);

            // Redirect back with error
            return back()->withErrors([
                'email' => 'Failed to submit your demo request. Please try again or contact us directly at alelmischoools@gmail.com'
            ])->withInput();
        }
    }
}

