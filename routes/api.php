<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

// These routes should ONLY be accessible from central domains
foreach (config('tenancy.central_domains') as $domain) {
    Route::domain($domain)->group(function () {
        Route::post('/api/tenants/create', function (Request $request) {
            try {
                $validated = $request->validate([
                    'tenant_id' => 'required|string|unique:tenants,id',
                    'domain' => 'required|string',
                    'school_data' => 'required|array',
                ]);

                // Create the tenant
                $tenant = \App\Models\Tenant::create([
                    'id' => $validated['tenant_id'],
                    'data' => $validated['school_data'],
                ]);

                // Create the domain
                $tenant->domains()->create(['domain' => $validated['domain']]);

                // Run the tenant database creation and migrations
                Artisan::call('tenants:migrate', [
                    '--tenants' => [$tenant->id]
                ]);

                return response()->json([
                    'success' => true,
                    'tenant_id' => $tenant->id,
                    'domain' => $validated['domain'],
                    'message' => 'Tenant created and migrated successfully'
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage()
                ], 500);
            }
        });

        Route::post('/api/tenants/{tenantId}/create-admin', function (Request $request, string $tenantId) {
            try {
                $validated = $request->validate([
                    'name' => 'required|string',
                    'email' => 'required|email',
                    'password' => 'required|string|min:8',
                    'phone' => 'nullable|string',
                ]);

                $tenant = \App\Models\Tenant::find($tenantId);
                
                if (!$tenant) {
                    return response()->json(['error' => 'Tenant not found'], 404);
                }

                tenancy()->initialize($tenant);

                $user = \App\Models\User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => bcrypt($validated['password']),
                    'phone' => $validated['phone'] ?? null,
                    'role' => 'admin',
                    'is_active' => true,
                    'must_change_password' => true,
                    'email_verified_at' => now(),
                ]);

                tenancy()->end();

                return response()->json([
                    'success' => true,
                    'user_id' => $user->id,
                ]);
            } catch (\Exception $e) {
                tenancy()->end();
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage()
                ], 500);
            }
        });

        Route::delete('/api/tenants/{tenantId}', function (string $tenantId) {
            try {
                $tenant = \App\Models\Tenant::find($tenantId);
                
                if (!$tenant) {
                    return response()->json(['error' => 'Tenant not found'], 404);
                }

                $tenant->delete();

                return response()->json(['success' => true]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage()
                ], 500);
            }
        });
    });
}