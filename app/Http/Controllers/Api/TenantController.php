<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TenantController extends Controller
{
    /**
     * Create a new tenant with its own database
     */
    public function createTenant(Request $request)
    {
        DB::beginTransaction();

        try {
            Log::info('Request received', [
                'all_data' => $request->all(),
                'tenant_id' => $request->input('tenant_id'),
            ]);

            $validated = $request->validate([
                'tenant_id' => 'required|string|unique:tenants,id',
                'domain' => 'required|string',
                'school_name' => 'required|string|max:255', // REQUIRED
                'trial_days' => 'nullable|integer|min:1',
            ]);

            Log::info('=== TENANT CREATION STARTED ===', $validated);

            // Calculate trial end date (default 30 days)
            $trialDays = $validated['trial_days'] ?? 30;
            $trialEndsAt = now()->addDays($trialDays);

            // Create school slug from name
            $schoolSlug = Str::slug($validated['school_name']);
            
            // Ensure slug is unique
            $originalSlug = $schoolSlug;
            $counter = 1;
            while (Tenant::where('school_slug', $schoolSlug)->exists()) {
                $schoolSlug = $originalSlug . '-' . $counter;
                $counter++;
            }

            // Create tenant using Stancl Tenancy
            // This automatically creates the database and runs migrations
            $tenant = Tenant::create([
                'id' => $validated['tenant_id'],
                'school_name' => $validated['school_name'],
                'school_slug' => $schoolSlug,
                'trial_ends_at' => $trialEndsAt,
                'is_active' => true,
                'data' => [], // You can add extra data here
            ]);

            Log::info('Tenant record created', [
                'tenant_id' => $tenant->id,
                'school_name' => $tenant->school_name,
                'school_slug' => $tenant->school_slug,
                'trial_ends_at' => $tenant->trial_ends_at,
            ]);

            // Add domain for the tenant
            $domain = $tenant->domains()->create([
                'domain' => $validated['domain'],
            ]);

            Log::info('Tenant domain created', [
                'tenant_id' => $tenant->id,
                'domain' => $domain->domain
            ]);

            // Verify database was created
            $databaseName = config('tenancy.database.prefix', 'tenant') . $validated['tenant_id'];
            
            $databaseExists = DB::select(
                "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?", 
                [$databaseName]
            );
            
            if (empty($databaseExists)) {
                throw new \Exception("Tenant database '{$databaseName}' was not created by Stancl Tenancy");
            }

            Log::info('Tenant database verified', ['database' => $databaseName]);

            // Commit transaction if it's still active
            // Note: The TenantCreated event pipeline may have already committed it
            try {
                if (DB::transactionLevel() > 0) {
                    DB::commit();
                }
            } catch (\Exception $e) {
                // Transaction may have already been committed by the event pipeline
                Log::warning('Transaction commit skipped', ['reason' => $e->getMessage()]);
            }

            Log::info('=== TENANT CREATION COMPLETED SUCCESSFULLY ===');

            return response()->json([
                'success' => true,
                'message' => 'Tenant created successfully',
                'data' => [
                    'tenant_id' => $tenant->id,
                    'school_name' => $tenant->school_name,
                    'school_slug' => $tenant->school_slug,
                    'domain' => $domain->domain,
                    'database' => $databaseName,
                    'trial_ends_at' => $tenant->trial_ends_at->toIso8601String(),
                    'is_active' => $tenant->is_active,
                ]
            ], 201);

        } catch (ValidationException $e) {
            // Rollback transaction if it's still active
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            Log::error('Tenant validation failed', [
                'errors' => $e->errors()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            // Rollback transaction if it's still active
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            Log::error('Tenant creation failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create tenant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create an admin user for a specific tenant
     */
    public function createAdmin(Request $request, $tenantId)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'password' => 'required|string|min:8',
                'phone' => 'nullable|string|max:20',
            ]);

            Log::info('=== ADMIN CREATION STARTED ===', [
                'tenant_id' => $tenantId,
                'email' => $validated['email']
            ]);

            // End any existing tenancy to avoid conflicts
            tenancy()->end();
            Log::info('Previous tenancy ended');

            // Find the tenant
            $tenant = Tenant::find($tenantId);
            
            if (!$tenant) {
                Log::error('Tenant not found', ['tenant_id' => $tenantId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant not found'
                ], 404);
            }

            Log::info('Tenant found, initializing tenancy', ['tenant_id' => $tenant->id]);

            // Initialize tenancy - switches to tenant database
            tenancy()->initialize($tenant);
            
            Log::info('Tenancy initialized, creating admin user');

            // Create admin user in tenant database
            $admin = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'email_verified_at' => now(),
            ]);

            Log::info('Admin user created', [
                'admin_id' => $admin->id,
                'email' => $admin->email
            ]);

            // TODO: Assign admin role when Spatie Laravel Permission is installed
            // $admin->assignRole('admin');

            Log::info('Admin user creation completed (role assignment skipped)');

            // End tenancy to return to central database
            tenancy()->end();
            
            Log::info('=== ADMIN CREATION COMPLETED ===');

            return response()->json([
                'success' => true,
                'message' => 'Admin user created successfully',
                'data' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'phone' => $admin->phone,
                ]
            ], 201);

        } catch (ValidationException $e) {
            tenancy()->end();
            
            Log::error('Admin validation failed', [
                'tenant_id' => $tenantId,
                'errors' => $e->errors()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            tenancy()->end();
            
            Log::error('Admin creation failed', [
                'tenant_id' => $tenantId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create admin user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Health check endpoint
     */
    public function health()
    {
        return response()->json([
            'status' => 'ok',
            'message' => 'Tenant API is running',
            'service' => 'School MS API',
            'timestamp' => now()->toIso8601String()
        ]);
    }
}