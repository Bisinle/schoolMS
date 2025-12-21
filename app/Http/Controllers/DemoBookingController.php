<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\DemoBookingNotification;
use App\Mail\DemoBookingConfirmation;
use Spatie\GoogleCalendar\Event;
use Carbon\Carbon;

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
            'school_name' => 'required|string|max:255',
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
            // Parse date and time
            $dateTime = Carbon::parse($validated['date'] . ' ' . $validated['time']);
            $endTime = $dateTime->copy()->addHour();

            // Check Google Calendar availability
            $events = Event::get($dateTime, $endTime);

            if ($events->isNotEmpty()) {
                return back()->withErrors([
                    'time' => 'This time slot is already booked. Please select another time.'
                ])->withInput();
            }

            // Create Google Calendar event with Meet link
            $event = new Event;
            $event->name = "Demo: {$validated['school_name']} - {$validated['name']}";
            $event->description = "School: {$validated['school_name']}\nContact: {$validated['phone']}\nEmail: {$validated['email']}\nMessage: " . ($validated['message'] ?? 'N/A');
            $event->startDateTime = $dateTime;
            $event->endDateTime = $endTime;
            $event->addAttendee([
                'email' => $validated['email'],
                'responseStatus' => 'accepted'
            ]);
            $event->addMeetLink();

            // Set sendUpdates to 'all' to immediately notify attendees
            $event->sendUpdates = 'all';

            $savedEvent = $event->save();
            $meetLink = $savedEvent->hangoutLink ?? 'Will be provided via email';

            // Force refresh the event to ensure it's fully synced
            $savedEvent->refresh();

            // Add meet link to validated data
            $validated['meet_link'] = $meetLink;

            // Send detailed notification email to admin
            Mail::to('bisinleabdi@gmail.com')->send(new DemoBookingNotification($validated));

            // Send simple confirmation email to client
            Mail::to($validated['email'])->send(new DemoBookingConfirmation($validated));

            Log::info('Demo booking created with Google Calendar', [
                'event_id' => $savedEvent->id,
                'event_link' => $savedEvent->htmlLink ?? 'N/A',
                'meet_link' => $meetLink,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'school' => $validated['school_name'],
                'date_time' => $dateTime->toDateTimeString(),
                'status' => $savedEvent->status ?? 'unknown',
            ]);

            // Redirect to success page
            return redirect()->route('demo.success');

        } catch (\Exception $e) {
            Log::error('Failed to create demo booking', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Redirect back with error
            return back()->withErrors([
                'email' => 'Failed to submit your demo request. Please try again or contact us directly at bisinleabdi@gmail.com'
            ])->withInput();
        }
    }
}
