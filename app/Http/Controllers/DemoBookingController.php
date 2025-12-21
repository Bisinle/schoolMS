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
        // Calculate minimum date (2 days from today)
        $minDate = now()->addDays(2)->format('Y-m-d');

        // Validate the form data
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'school_name' => 'nullable|string|max:255',
            'date' => [
                'required',
                'date',
                'after_or_equal:' . $minDate,
            ],
            'time' => 'required|string|in:09:00 AM,10:00 AM,11:00 AM,12:00 PM,01:00 PM,02:00 PM,03:00 PM,04:00 PM,05:00 PM',
            'message' => 'nullable|string|max:1000',
        ], [
            'date.after_or_equal' => 'Demo bookings must be scheduled at least 2 days in advance to allow sufficient preparation time.',
            'time.in' => 'Please select a valid time slot.',
        ]);

        try {
            // Send email synchronously (not queued)
            Mail::to('bisinleabdi@gmail.com')->send(new DemoBookingNotification($validated));

            Log::info('Demo booking submitted successfully', [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
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
                'email' => 'Failed to submit your demo request. Please try again or contact us directly at bisinleabdi@gmail.com'
            ])->withInput();
        }
    }
}

