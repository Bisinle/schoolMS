<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Central Web Routes
|--------------------------------------------------------------------------
|
| These routes are for the central domain (localhost:8002)
| Tenant routes are in routes/tenant.php
|
*/

Route::get('/', function () {
    return response()->json([
        'message' => 'School Management System - Central API',
        'status' => 'running',
        'api_url' => url('/api'),
        'health_check' => url('/api/health'),
    ]);
})->name('central.home');

Route::get('/test', function () {
    return 'Central domain is working!';
});