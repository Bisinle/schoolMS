<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\TenantStatsController;

/*
|--------------------------------------------------------------------------
| Central API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by bootstrap/app.php under the "api" prefix.
| They handle tenant (school) creation and management from the
| central School Management System admin.
|
*/

Route::prefix('tenants')->group(function () {

    // ----------------------------
    // Tenant Creation
    // ----------------------------
    Route::post('/create', [TenantController::class, 'createTenant'])
        ->name('api.tenants.create');

    // ----------------------------
    // Tenant Admin Creation
    // ----------------------------
    Route::post('/{tenant}/create-admin', [TenantController::class, 'createAdmin'])
        ->name('api.tenants.create-admin');

    // ----------------------------
    // Tenant Status
    // ----------------------------
    Route::get('/{tenant}/status', [TenantController::class, 'status'])
        ->name('api.tenants.status');

    // ----------------------------
    // Update Tenant Details
    // ----------------------------
    Route::put('/{tenant}', [TenantController::class, 'update'])
        ->name('api.tenants.update');

    // ----------------------------
    // Delete Tenant (and DB)
    // ----------------------------
    Route::delete('/{tenant}', [TenantController::class, 'destroy'])
        ->name('api.tenants.destroy');

    // ----------------------------
    // Suspend Tenant
    // ----------------------------
    Route::post('/{tenant}/suspend', [TenantController::class, 'suspend'])
        ->name('api.tenants.suspend');

    // ----------------------------
    // Reactivate Tenant
    // ----------------------------
    Route::post('/{tenant}/reactivate', [TenantController::class, 'reactivate'])
        ->name('api.tenants.reactivate');

    // ----------------------------
    // List All Tenants
    // ----------------------------
    Route::get('/', [TenantController::class, 'index'])
        ->name('api.tenants.index');

    // ----------------------------
    // Get Tenant Statistics
    // ----------------------------
    Route::get('/{tenant}/stats', [TenantStatsController::class, 'index'])
        ->name('api.tenants.stats');
});

// ----------------------------
// API Health Check
// ----------------------------
Route::get('/health', [TenantController::class, 'health'])
    ->name('api.health');