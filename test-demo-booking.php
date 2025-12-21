<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Carbon\Carbon;
use App\Http\Controllers\DemoBookingController;
use Illuminate\Http\Request;

// Calculate date 2 days from now
$bookingDate = Carbon::now()->addDays(2)->format('Y-m-d');
$bookingTime = '10:00 AM';

echo "=================================================\n";
echo "Testing Demo Booking System\n";
echo "=================================================\n";
echo "Booking Date: {$bookingDate}\n";
echo "Booking Time: {$bookingTime}\n";
echo "=================================================\n\n";

// Create test booking data
$testData = [
    'name' => 'Test User',
    'email' => 'bisinleabdi@gmail.com', // Using your email for testing
    'phone' => '+254712345678',
    'school_name' => 'Test School Academy',
    'date' => $bookingDate,
    'time' => $bookingTime,
    'message' => 'This is a test booking to verify Google Calendar integration and email notifications.',
];

echo "Test Booking Data:\n";
echo json_encode($testData, JSON_PRETTY_PRINT) . "\n\n";

try {
    // Create a mock request
    $request = Request::create('/demo-booking', 'POST', $testData);
    
    // Instantiate controller
    $controller = new DemoBookingController();
    
    echo "Submitting booking...\n\n";
    
    // Submit the booking
    $response = $controller->submit($request);
    
    echo "=================================================\n";
    echo "✅ SUCCESS!\n";
    echo "=================================================\n";
    echo "Response: " . get_class($response) . "\n";
    
    if (method_exists($response, 'getTargetUrl')) {
        echo "Redirect URL: " . $response->getTargetUrl() . "\n";
    }
    
    echo "\n";
    echo "Please check:\n";
    echo "1. ✅ Google Calendar (bisinleabdi@gmail.com) for the event\n";
    echo "2. ✅ Email inbox for admin notification\n";
    echo "3. ✅ Email inbox for client confirmation\n";
    echo "4. ✅ Event should have a Google Meet link\n";
    echo "\n";
    echo "Event Details:\n";
    echo "- Title: Demo: Test School Academy - Test User\n";
    echo "- Date: {$bookingDate}\n";
    echo "- Time: {$bookingTime} (1 hour duration)\n";
    echo "- Attendee: bisinleabdi@gmail.com\n";
    echo "=================================================\n";
    
} catch (\Exception $e) {
    echo "=================================================\n";
    echo "❌ ERROR!\n";
    echo "=================================================\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "\nStack Trace:\n";
    echo $e->getTraceAsString() . "\n";
    echo "=================================================\n";
}

