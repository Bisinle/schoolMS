<?php

use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\SchoolController;
use App\Http\Controllers\SuperAdmin\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Super Admin Routes
|--------------------------------------------------------------------------
|
| These routes are for super administrators only.
| They have access to manage all schools, users, and system settings.
|
*/

Route::middleware(['auth', 'super.admin'])->prefix('super-admin')->name('super-admin.')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Schools Management
    Route::resource('schools', SchoolController::class);
    Route::post('schools/{school}/toggle-active', [SchoolController::class, 'toggleActive'])->name('schools.toggle-active');
    Route::post('schools/{school}/impersonate', [SchoolController::class, 'impersonate'])->name('schools.impersonate');
    
    // Users Management
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
    Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
    Route::post('users/{user}/toggle-active', [UserController::class, 'toggleActive'])->name('users.toggle-active');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    
    // System Logs (TODO: Implement later)
    // Route::get('logs', [LogController::class, 'index'])->name('logs.index');
    
    // Settings (TODO: Implement later)
    // Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
});

