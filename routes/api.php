<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MpesaController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application.
| These routes are loaded by bootstrap/app.php under the "api" prefix.
|
*/

// ----------------------------
// API Health Check
// ----------------------------
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'School MS API is running',
        'timestamp' => now()->toIso8601String()
    ]);
})->name('api.health');

// ----------------------------
// M-Pesa Integration Routes
// ----------------------------
Route::get('/mpesa/password', [MpesaController::class, 'lipaNaMpesaPassword']);
Route::post('/mpesa/new-access-token', [MpesaController::class, 'newAccessToken']);
Route::post('/mpesa/stk/push', [MpesaController::class, 'stkPush'])->name('lipa');
Route::post('/stk/push/callback/url', [MpesaController::class, 'MpesaRes']);