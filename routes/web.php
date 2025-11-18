<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DemoBookingController;

/*
|--------------------------------------------------------------------------
| Central Web Routes
|--------------------------------------------------------------------------
|
| These routes are for the central domain ONLY (localhost:8002)
| Tenant routes are in routes/tenant.php
|
| Note: These routes should NOT be accessible from tenant domains
|
*/

// Public Home Page
Route::get('/', function () {
    return Inertia::render('Home');
})->name('home');

// Demo Booking Routes
Route::get('/demo-booking', function () {
    return Inertia::render('DemoBooking');
})->name('demo.booking');

Route::post('/demo-booking', [DemoBookingController::class, 'submit'])
    ->name('demo.booking.submit');

Route::get('/demo-booking/success', function () {
    return Inertia::render('DemoSuccess');
})->name('demo.success');