# Per-School Fee Module Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every school exactly one active fee-billing system — the existing "termly" family (Fees Dashboard, Invoices, Payments, Tuition Fees, Universal Fees, Fee Preferences) or the "Monthly Fees" module — chosen by the super admin at school creation and changeable later, enforced by a route-level 404 gate identical to the existing `school_type`/madrasah pattern.

**Architecture:** One new `fee_module` enum column on `schools` (`'termly'` / `'monthly'`, default `'termly'`), gated by a new parameterized middleware (`fee-module:termly` / `fee-module:monthly`) wrapping two new nested route sub-groups inside the existing admin and guardian fee route blocks. Transport Routes stays ungated — it's shared infrastructure both fee modules' guardian fee-preference flows read from. The toggle is exposed to the super admin via the existing Create/Edit School forms, and to the frontend nav via the same shared-Inertia-prop + `navigation.js` conditional-spread pattern already used for `school_type`/`isMadrasah`.

**Tech Stack:** Laravel 12 (PHP 8.4), Inertia.js + React 18, PHPUnit-style Pest test classes with `RefreshDatabase`.

**Spec:** `docs/superpowers/specs/2026-09-11-fee-module-toggle-design.md`

## Global Constraints

- Every credit-affecting or tenant-affecting query must respect `school_id` isolation — this feature is itself a tenant-isolation feature, so this is the whole point, not an aside.
- Tests are PHPUnit-style classes extending `Tests\TestCase` with explicit `use RefreshDatabase;`, matching every existing test in this repo (not Pest closures).
- Every test hitting an Inertia page must call `$this->withoutVite();` first (existing house convention, confirmed in `QuranDashboardAccessTest.php` and every `MonthlyFee*Test.php`).
- Use `php8.4` explicitly for all artisan/composer commands — the default `php` on this machine is 8.5 and lacks `pdo_sqlite`.
- The middleware is a **single parameterized alias** (`fee-module:termly` / `fee-module:monthly`), not two separate aliases — matches the existing `permission:fees.manage` pattern already used throughout `routes/web.php`.
- Transport Routes (`transport-routes.*`) is never wrapped in either `fee-module` gate — it is shared infrastructure, not part of the termly bucket, per the spec's explicit correction.
- 404, never a redirect, is the required response for a school hitting a route outside its `fee_module` — matches `CheckMadrasahSchool`'s existing behavior exactly.

---

### Task 1: Migration + model fillable

**Files:**
- Create: `database/migrations/2026_09_11_100000_add_fee_module_to_schools_table.php`
- Modify: `app/Models/School.php:18-38` (the `$fillable` array)
- Test: `tests/Feature/SchoolFeeModuleColumnTest.php`

**Interfaces:**
- Produces: `schools.fee_module` column (`enum('termly','monthly')`, `default('termly')`), `School::$fillable` includes `'fee_module'`.

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/SchoolFeeModuleColumnTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\School;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolFeeModuleColumnTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_school_created_with_no_explicit_fee_module_defaults_to_termly(): void
    {
        $school = School::factory()->create();

        // Eloquent does not reflect a DB-level column default on the
        // in-memory model immediately after create() — read it back fresh.
        $this->assertSame('termly', $school->fresh()->fee_module);
    }

    public function test_fee_module_is_mass_assignable(): void
    {
        $school = School::factory()->create(['fee_module' => 'monthly']);

        $this->assertSame('monthly', $school->fresh()->fee_module);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `php8.4 artisan test tests/Feature/SchoolFeeModuleColumnTest.php`
Expected: FAIL — `fee_module` column doesn't exist yet (SQLite error on the factory's implicit insert, or an "Unknown column" style failure).

- [ ] **Step 3: Write the migration**

Create `database/migrations/2026_09_11_100000_add_fee_module_to_schools_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->enum('fee_module', ['termly', 'monthly'])
                ->default('termly')
                ->after('school_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn('fee_module');
        });
    }
};
```

- [ ] **Step 4: Add `fee_module` to `School::$fillable`**

In `app/Models/School.php`, find the `$fillable` array (currently ends `..., 'school_type', 'trial_ends_at', ...`) and add `'fee_module'` immediately after `'school_type'`:

```php
    protected $fillable = [
        'name',
        'tagline',
        'motto',
        'vision',
        'mission',
        'email',
        'phone_primary',
        'phone_secondary',
        'physical_address',
        'slug',
        'domain',
        'admin_name',
        'admin_email',
        'admin_phone',
        'is_active',
        'status',
        'school_type',
        'fee_module',
        'trial_ends_at',
        'current_student_count',
        'address',
        'logo_path',
    ];
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `php8.4 artisan test tests/Feature/SchoolFeeModuleColumnTest.php`
Expected: PASS, 2 tests.

- [ ] **Step 6: Commit**

```bash
git add database/migrations/2026_09_11_100000_add_fee_module_to_schools_table.php app/Models/School.php tests/Feature/SchoolFeeModuleColumnTest.php
git commit -m "feat: add fee_module column to schools, defaulting to termly"
```

---

### Task 2: Middleware + route gating

**This is the core enforcement mechanism — get the middleware and route split right before anything downstream (the form, the nav) can be meaningfully tested end-to-end.**

**Files:**
- Create: `app/Http/Middleware/CheckFeeModule.php`
- Modify: `bootstrap/app.php` (add import + one alias line)
- Modify: `routes/web.php:636-712` (split the admin fee block and the guardian fee block)
- Test: `tests/Feature/FeeModuleGatingTest.php`

**Interfaces:**
- Consumes: `schools.fee_module` (Task 1).
- Produces: middleware alias `fee-module` usable as `fee-module:termly` / `fee-module:monthly` in any route definition. No new named routes — only re-wraps ones that already exist.

- [ ] **Step 1: Write the failing tests**

Create `tests/Feature/FeeModuleGatingTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeeModuleGatingTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(string $feeModule): User
    {
        $school = School::factory()->create(['fee_module' => $feeModule]);

        return User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
    }

    private function makeGuardian(string $feeModule): User
    {
        $school = School::factory()->create(['fee_module' => $feeModule]);

        return User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
    }

    // --- A monthly-module school gets 404 on every termly route ---

    public function test_monthly_school_admin_gets_404_on_fees_dashboard(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/fees')->assertNotFound();
    }

    public function test_monthly_school_admin_gets_404_on_fees_bulk_generate(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/fees/bulk-generate')->assertNotFound();
    }

    public function test_monthly_school_admin_gets_404_on_invoices(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/invoices')->assertNotFound();
    }

    public function test_monthly_school_admin_gets_404_on_tuition_fees(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/tuition-fees')->assertNotFound();
    }

    public function test_monthly_school_admin_gets_404_on_universal_fees(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/universal-fees')->assertNotFound();
    }

    public function test_monthly_school_admin_gets_404_on_fee_preferences(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/fee-preferences')->assertNotFound();
    }

    public function test_monthly_school_guardian_gets_404_on_guardian_invoices(): void
    {
        $guardian = $this->makeGuardian('monthly');

        $this->actingAs($guardian)->get('/guardian/invoices')->assertNotFound();
    }

    // --- A termly-module school gets 404 on every monthly route ---

    public function test_termly_school_admin_gets_404_on_monthly_fees(): void
    {
        $admin = $this->makeAdmin('termly');

        $this->actingAs($admin)->get('/monthly-fees')->assertNotFound();
    }

    public function test_termly_school_guardian_gets_404_on_guardian_monthly_fees(): void
    {
        $guardian = $this->makeGuardian('termly');

        $this->actingAs($guardian)->get('/guardian/monthly-fees')->assertNotFound();
    }

    // --- Each module's own routes stay reachable on its own school ---

    public function test_termly_school_admin_can_reach_fees_dashboard(): void
    {
        $admin = $this->makeAdmin('termly');

        $this->actingAs($admin)->get('/fees')->assertOk();
    }

    public function test_monthly_school_admin_can_reach_monthly_fees(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/monthly-fees')->assertOk();
    }

    // --- Transport Routes is shared, ungated, reachable regardless ---

    public function test_termly_school_admin_can_reach_transport_routes(): void
    {
        $admin = $this->makeAdmin('termly');

        $this->actingAs($admin)->get('/transport-routes')->assertOk();
    }

    public function test_monthly_school_admin_can_reach_transport_routes(): void
    {
        $admin = $this->makeAdmin('monthly');

        $this->actingAs($admin)->get('/transport-routes')->assertOk();
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/FeeModuleGatingTest.php`
Expected: FAIL — every route currently returns 200/OK regardless of `fee_module` (no gate exists yet), so every `assertNotFound()` test fails; the `assertOk()` tests for each module's own routes and Transport Routes already pass (nothing to break there yet).

- [ ] **Step 3: Write the middleware**

Create `app/Http/Middleware/CheckFeeModule.php`:

```php
<?php

namespace App\Http\Middleware;

use App\Models\School;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeeModule
{
    /**
     * Handle an incoming request.
     * Ensures the school's fee_module matches the value required by the
     * route (e.g. 'termly' or 'monthly') before allowing access.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $required): Response
    {
        if (! auth()->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user();

        // Super admins should not access school routes directly
        if ($user->isSuperAdmin()) {
            abort(404);
        }

        // School users must have a school_id
        if (! $user->school_id) {
            abort(404);
        }

        $school = School::find($user->school_id);

        if (! $school || $school->fee_module !== $required) {
            abort(404);
        }

        return $next($request);
    }
}
```

- [ ] **Step 4: Register the middleware alias**

In `bootstrap/app.php`, add the import alongside the existing middleware imports:

```php
use App\Http\Middleware\CheckFeeModule;
```

Then add one line to the `$middleware->alias([...])` array, alongside the existing `'madrasah.only' => CheckMadrasahSchool::class,` line:

```php
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'user.active' => CheckUserActive::class,
            'school.active' => CheckSchoolActive::class,
            'super.admin' => SuperAdminMiddleware::class,
            'school.admin' => SchoolAdminMiddleware::class,
            'madrasah.only' => CheckMadrasahSchool::class,
            'fee-module' => CheckFeeModule::class,
        ]);
```

- [ ] **Step 5: Split the admin fee route block**

In `routes/web.php`, find this exact block (currently lines 639-706):

```php
    //^ Fee Management Routes (Admin only)
    Route::middleware(['user.active', 'permission:fees.manage'])->group(function () {
        // Fee Management Dashboard
        Route::get('/fees', [FeeManagementController::class, 'index'])->name('fees.index');

        // Bulk Invoice Generation
        Route::get('/fees/bulk-generate', [FeeManagementController::class, 'bulkGenerate'])->name('fees.bulk-generate');
        Route::post('/fees/bulk-generate', [FeeManagementController::class, 'processBulkGenerate'])->name('fees.process-bulk-generate');

        // Transport Routes
        Route::get('/transport-routes', [TransportRouteController::class, 'index'])->name('transport-routes.index');
        Route::post('/transport-routes', [TransportRouteController::class, 'store'])->name('transport-routes.store');
        Route::put('/transport-routes/{transportRoute}', [TransportRouteController::class, 'update'])->name('transport-routes.update');
        Route::delete('/transport-routes/{transportRoute}', [TransportRouteController::class, 'destroy'])->name('transport-routes.destroy');
        Route::post('/transport-routes/{transportRoute}/toggle-status', [TransportRouteController::class, 'toggleStatus'])->name('transport-routes.toggle-status');

        // Tuition Fees
        Route::get('/tuition-fees', [TuitionFeeController::class, 'index'])->name('tuition-fees.index');
        Route::post('/tuition-fees', [TuitionFeeController::class, 'store'])->name('tuition-fees.store');
        Route::post('/tuition-fees/bulk', [TuitionFeeController::class, 'bulkStore'])->name('tuition-fees.bulk-store');
        Route::put('/tuition-fees/{tuitionFee}', [TuitionFeeController::class, 'update'])->name('tuition-fees.update');
        Route::delete('/tuition-fees/{tuitionFee}', [TuitionFeeController::class, 'destroy'])->name('tuition-fees.destroy');
        Route::post('/tuition-fees/{tuitionFee}/toggle-status', [TuitionFeeController::class, 'toggleStatus'])->name('tuition-fees.toggle-status');

        // Universal Fees
        Route::get('/universal-fees', [UniversalFeeController::class, 'index'])->name('universal-fees.index');
        Route::post('/universal-fees', [UniversalFeeController::class, 'store'])->name('universal-fees.store');
        Route::post('/universal-fees/bulk', [UniversalFeeController::class, 'bulkStore'])->name('universal-fees.bulk-store');
        Route::put('/universal-fees/{universalFee}', [UniversalFeeController::class, 'update'])->name('universal-fees.update');
        Route::delete('/universal-fees/{universalFee}', [UniversalFeeController::class, 'destroy'])->name('universal-fees.destroy');
        Route::post('/universal-fees/{universalFee}/toggle-status', [UniversalFeeController::class, 'toggleStatus'])->name('universal-fees.toggle-status');

        // Guardian Fee Preferences
        Route::get('/fee-preferences', [GuardianFeePreferenceController::class, 'index'])->name('fee-preferences.index');
        Route::get('/fee-preferences/{guardian}/edit', [GuardianFeePreferenceController::class, 'edit'])->name('fee-preferences.edit');
        Route::put('/fee-preferences/{guardian}', [GuardianFeePreferenceController::class, 'update'])->name('fee-preferences.update');
        Route::delete('/fee-preferences/{feePreference}', [GuardianFeePreferenceController::class, 'destroy'])->name('fee-preferences.destroy');
        Route::post('/fee-preferences/bulk-apply-defaults', [GuardianFeePreferenceController::class, 'bulkApplyDefaults'])->name('fee-preferences.bulk-apply-defaults');
        Route::get('/fee-preferences/{guardian}/history', [GuardianFeePreferenceController::class, 'history'])->name('fee-preferences.history');

        // Monthly Fee Ledger
        Route::get('/monthly-fees', [MonthlyFeeController::class, 'index'])->name('monthly-fees.index');
        Route::post('/monthly-fees/open-next-month', [MonthlyFeeController::class, 'openNextMonth'])->name('monthly-fees.open-next-month');
        Route::put('/monthly-fees/guardians/{guardian}/expected-fee', [MonthlyFeeController::class, 'updateExpected'])->name('monthly-fees.update-expected');
        Route::post('/monthly-fees/entries/{entry}/mark-paid', [MonthlyFeeController::class, 'markPaid'])->name('monthly-fees.mark-paid');
        Route::post('/monthly-fees/entries/{entry}/undo', [MonthlyFeeController::class, 'undoPaid'])->name('monthly-fees.undo');
        Route::put('/monthly-fees/entries/{entry}', [MonthlyFeeController::class, 'updateCollected'])->name('monthly-fees.update-collected');
        Route::post('/monthly-fees/guardians/{guardian}/record-payment', [MonthlyFeeController::class, 'recordPayment'])->name('monthly-fees.record-payment');
        Route::post('/monthly-fees/guardians/{guardian}/apply-credit', [MonthlyFeeController::class, 'applyCredit'])->name('monthly-fees.apply-credit');

        // Invoice Management
        Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
        Route::get('/invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
        Route::post('/invoices/preview', [InvoiceController::class, 'preview'])->name('invoices.preview');
        Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
        Route::post('/invoices/clear-all', [InvoiceController::class, 'clearAll'])->name('invoices.clearAll');
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
        Route::put('/invoices/{invoice}/line-items', [InvoiceController::class, 'updateLineItems'])->name('invoices.updateLineItems');
        Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoices.pdf');
        Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');

        // Payment Management
        Route::get('/invoices/{invoice}/payments/create', [PaymentController::class, 'create'])->name('payments.create');
        Route::post('/invoices/{invoice}/payments', [PaymentController::class, 'store'])->name('payments.store');
        Route::get('/payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');
        Route::delete('/payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');
    });
```

Replace it with (Transport Routes pulled out to the outer, ungated level; termly routes nested under `fee-module:termly`; monthly routes nested under `fee-module:monthly`):

```php
    //^ Fee Management Routes (Admin only)
    Route::middleware(['user.active', 'permission:fees.manage'])->group(function () {
        // Transport Routes — shared by both fee modules' guardian
        // fee-preference flows, so it is never wrapped in a fee-module gate.
        Route::get('/transport-routes', [TransportRouteController::class, 'index'])->name('transport-routes.index');
        Route::post('/transport-routes', [TransportRouteController::class, 'store'])->name('transport-routes.store');
        Route::put('/transport-routes/{transportRoute}', [TransportRouteController::class, 'update'])->name('transport-routes.update');
        Route::delete('/transport-routes/{transportRoute}', [TransportRouteController::class, 'destroy'])->name('transport-routes.destroy');
        Route::post('/transport-routes/{transportRoute}/toggle-status', [TransportRouteController::class, 'toggleStatus'])->name('transport-routes.toggle-status');

        Route::middleware(['fee-module:termly'])->group(function () {
            // Fee Management Dashboard
            Route::get('/fees', [FeeManagementController::class, 'index'])->name('fees.index');

            // Bulk Invoice Generation
            Route::get('/fees/bulk-generate', [FeeManagementController::class, 'bulkGenerate'])->name('fees.bulk-generate');
            Route::post('/fees/bulk-generate', [FeeManagementController::class, 'processBulkGenerate'])->name('fees.process-bulk-generate');

            // Tuition Fees
            Route::get('/tuition-fees', [TuitionFeeController::class, 'index'])->name('tuition-fees.index');
            Route::post('/tuition-fees', [TuitionFeeController::class, 'store'])->name('tuition-fees.store');
            Route::post('/tuition-fees/bulk', [TuitionFeeController::class, 'bulkStore'])->name('tuition-fees.bulk-store');
            Route::put('/tuition-fees/{tuitionFee}', [TuitionFeeController::class, 'update'])->name('tuition-fees.update');
            Route::delete('/tuition-fees/{tuitionFee}', [TuitionFeeController::class, 'destroy'])->name('tuition-fees.destroy');
            Route::post('/tuition-fees/{tuitionFee}/toggle-status', [TuitionFeeController::class, 'toggleStatus'])->name('tuition-fees.toggle-status');

            // Universal Fees
            Route::get('/universal-fees', [UniversalFeeController::class, 'index'])->name('universal-fees.index');
            Route::post('/universal-fees', [UniversalFeeController::class, 'store'])->name('universal-fees.store');
            Route::post('/universal-fees/bulk', [UniversalFeeController::class, 'bulkStore'])->name('universal-fees.bulk-store');
            Route::put('/universal-fees/{universalFee}', [UniversalFeeController::class, 'update'])->name('universal-fees.update');
            Route::delete('/universal-fees/{universalFee}', [UniversalFeeController::class, 'destroy'])->name('universal-fees.destroy');
            Route::post('/universal-fees/{universalFee}/toggle-status', [UniversalFeeController::class, 'toggleStatus'])->name('universal-fees.toggle-status');

            // Guardian Fee Preferences
            Route::get('/fee-preferences', [GuardianFeePreferenceController::class, 'index'])->name('fee-preferences.index');
            Route::get('/fee-preferences/{guardian}/edit', [GuardianFeePreferenceController::class, 'edit'])->name('fee-preferences.edit');
            Route::put('/fee-preferences/{guardian}', [GuardianFeePreferenceController::class, 'update'])->name('fee-preferences.update');
            Route::delete('/fee-preferences/{feePreference}', [GuardianFeePreferenceController::class, 'destroy'])->name('fee-preferences.destroy');
            Route::post('/fee-preferences/bulk-apply-defaults', [GuardianFeePreferenceController::class, 'bulkApplyDefaults'])->name('fee-preferences.bulk-apply-defaults');
            Route::get('/fee-preferences/{guardian}/history', [GuardianFeePreferenceController::class, 'history'])->name('fee-preferences.history');

            // Invoice Management
            Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
            Route::get('/invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
            Route::post('/invoices/preview', [InvoiceController::class, 'preview'])->name('invoices.preview');
            Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
            Route::post('/invoices/clear-all', [InvoiceController::class, 'clearAll'])->name('invoices.clearAll');
            Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
            Route::put('/invoices/{invoice}/line-items', [InvoiceController::class, 'updateLineItems'])->name('invoices.updateLineItems');
            Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoices.pdf');
            Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');

            // Payment Management
            Route::get('/invoices/{invoice}/payments/create', [PaymentController::class, 'create'])->name('payments.create');
            Route::post('/invoices/{invoice}/payments', [PaymentController::class, 'store'])->name('payments.store');
            Route::get('/payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');
            Route::delete('/payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');
        });

        Route::middleware(['fee-module:monthly'])->group(function () {
            // Monthly Fee Ledger
            Route::get('/monthly-fees', [MonthlyFeeController::class, 'index'])->name('monthly-fees.index');
            Route::post('/monthly-fees/open-next-month', [MonthlyFeeController::class, 'openNextMonth'])->name('monthly-fees.open-next-month');
            Route::put('/monthly-fees/guardians/{guardian}/expected-fee', [MonthlyFeeController::class, 'updateExpected'])->name('monthly-fees.update-expected');
            Route::post('/monthly-fees/entries/{entry}/mark-paid', [MonthlyFeeController::class, 'markPaid'])->name('monthly-fees.mark-paid');
            Route::post('/monthly-fees/entries/{entry}/undo', [MonthlyFeeController::class, 'undoPaid'])->name('monthly-fees.undo');
            Route::put('/monthly-fees/entries/{entry}', [MonthlyFeeController::class, 'updateCollected'])->name('monthly-fees.update-collected');
            Route::post('/monthly-fees/guardians/{guardian}/record-payment', [MonthlyFeeController::class, 'recordPayment'])->name('monthly-fees.record-payment');
            Route::post('/monthly-fees/guardians/{guardian}/apply-credit', [MonthlyFeeController::class, 'applyCredit'])->name('monthly-fees.apply-credit');
        });
    });
```

- [ ] **Step 6: Split the guardian fee route block**

In `routes/web.php`, find this exact block:

```php
    //^ Guardian Invoice Routes (Guardians can view their own invoices)
    Route::middleware(['user.active', 'permission:fees.view-own-invoices'])->group(function () {
        Route::get('/guardian/invoices', [InvoiceController::class, 'index'])->name('guardian.invoices');
        Route::get('/guardian/invoices/{invoice}', [InvoiceController::class, 'show'])->name('guardian.invoices.show');
        Route::get('/guardian/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('guardian.invoices.pdf');
        Route::get('/guardian/monthly-fees', [MonthlyFeeController::class, 'guardianShow'])->name('guardian.monthly-fees');
    });
```

Replace it with:

```php
    //^ Guardian Invoice Routes (Guardians can view their own invoices)
    Route::middleware(['user.active', 'permission:fees.view-own-invoices'])->group(function () {
        Route::middleware(['fee-module:termly'])->group(function () {
            Route::get('/guardian/invoices', [InvoiceController::class, 'index'])->name('guardian.invoices');
            Route::get('/guardian/invoices/{invoice}', [InvoiceController::class, 'show'])->name('guardian.invoices.show');
            Route::get('/guardian/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('guardian.invoices.pdf');
        });

        Route::middleware(['fee-module:monthly'])->group(function () {
            Route::get('/guardian/monthly-fees', [MonthlyFeeController::class, 'guardianShow'])->name('guardian.monthly-fees');
        });
    });
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/FeeModuleGatingTest.php`
Expected: PASS, 14 tests.

- [ ] **Step 8: Run the full monthly-fee and termly-fee test suites to confirm nothing broke**

Run: `php8.4 artisan test --filter=MonthlyFee`
Expected: PASS, all still green — every existing `MonthlyFee*Test.php` test creates its own school via `School::factory()->create()`, which now defaults to `fee_module: 'termly'`. Since `MonthlyFeeLedgerServiceTest`/`MonthlyFeeControllerTest`/`MonthlyFeeTenantIsolationTest`/`MonthlyFeePaymentTest` all hit `/monthly-fees*` routes directly without ever setting `fee_module`, **this step is expected to reveal real failures** — those schools are now `'termly'` by default and will 404 on monthly-fees routes.

- [ ] **Step 9: Fix the now-broken MonthlyFee test suite**

Every existing `School::factory()->create()` call across `tests/Feature/MonthlyFeeLedgerServiceTest.php`, `tests/Feature/MonthlyFeeControllerTest.php`, `tests/Feature/MonthlyFeeTenantIsolationTest.php`, and `tests/Feature/MonthlyFeePaymentTest.php` needs `'fee_module' => 'monthly'` added to its `create([...])` array so these schools remain on the monthly module they were always testing. Search each file for `School::factory()->create(` and add the key to every call found. Example, in context (this exact pattern repeats across all four files — apply it to every occurrence):

```php
// Before:
$school = School::factory()->create();

// After:
$school = School::factory()->create(['fee_module' => 'monthly']);
```

Where a call already passes other attributes (rare, but check), add `'fee_module' => 'monthly'` as an additional array key rather than replacing the call.

- [ ] **Step 10: Run the full monthly-fee suite again to confirm the fix**

Run: `php8.4 artisan test --filter=MonthlyFee`
Expected: PASS, all tests green again (same counts as before this task started).

- [ ] **Step 11: Run the full repo-wide suite**

Run: `php8.4 artisan test`
Expected: PASS — check specifically for any other pre-existing test (termly-side: Invoice/TuitionFee/UniversalFee/FeePreference/Payment/TransportRoute tests) that creates its own school and hits a termly route; those need no change (they default to `'termly'` correctly), but confirm none of them explicitly created a school with an incompatible setup. If any termly-side test fails, apply the same fix pattern as Step 9 but with `'fee_module' => 'termly'` (or simply remove an unnecessary override, since `'termly'` is already the default).

- [ ] **Step 12: Commit**

```bash
git add app/Http/Middleware/CheckFeeModule.php bootstrap/app.php routes/web.php tests/Feature/FeeModuleGatingTest.php tests/Feature/MonthlyFeeLedgerServiceTest.php tests/Feature/MonthlyFeeControllerTest.php tests/Feature/MonthlyFeeTenantIsolationTest.php tests/Feature/MonthlyFeePaymentTest.php
git commit -m "feat: gate termly and monthly fee routes behind school.fee_module"
```

(If Step 11 required fixes to any termly-side test files, add those to the `git add` list too before committing.)

---

### Task 3: Super Admin Create/Edit School form

**Files:**
- Modify: `app/Http/Controllers/SuperAdmin/SchoolController.php` (`store()` and `update()` validation + `store()`'s `School::create([...])` call)
- Modify: `resources/js/Pages/SuperAdmin/Schools/Create.jsx`
- Modify: `resources/js/Pages/SuperAdmin/Schools/Edit.jsx`
- Test: `tests/Feature/SuperAdmin/SchoolFeeModuleFormTest.php`

**Interfaces:**
- Consumes: `schools.fee_module` (Task 1).
- Produces: nothing new consumed by later tasks — this task is a leaf.

- [ ] **Step 1: Write the failing tests**

Create `tests/Feature/SuperAdmin/SchoolFeeModuleFormTest.php`:

```php
<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolFeeModuleFormTest extends TestCase
{
    use RefreshDatabase;

    private function makeSuperAdmin(): User
    {
        return User::factory()->create(['school_id' => null, 'role' => 'super_admin']);
    }

    public function test_creating_a_school_persists_the_chosen_fee_module(): void
    {
        $this->withoutVite();
        $superAdmin = $this->makeSuperAdmin();

        $response = $this->actingAs($superAdmin)->post('/super-admin/schools', [
            'name' => 'Test School',
            'admin_name' => 'Admin Person',
            'admin_email' => 'admin@testschool.example',
            'status' => 'trial',
            'school_type' => 'islamic_school',
            'fee_module' => 'monthly',
            'password_option' => 'auto',
            'send_email' => false,
        ]);

        $response->assertRedirect();
        $school = School::where('admin_email', 'admin@testschool.example')->firstOrFail();
        $this->assertSame('monthly', $school->fee_module);
    }

    public function test_creating_a_school_without_fee_module_fails_validation(): void
    {
        $this->withoutVite();
        $superAdmin = $this->makeSuperAdmin();

        $response = $this->actingAs($superAdmin)->post('/super-admin/schools', [
            'name' => 'Test School',
            'admin_name' => 'Admin Person',
            'admin_email' => 'admin2@testschool.example',
            'status' => 'trial',
            'school_type' => 'islamic_school',
            'password_option' => 'auto',
            'send_email' => false,
        ]);

        $response->assertSessionHasErrors('fee_module');
    }

    public function test_editing_a_school_can_switch_its_fee_module(): void
    {
        $this->withoutVite();
        $superAdmin = $this->makeSuperAdmin();
        $school = School::factory()->create(['fee_module' => 'termly']);

        $response = $this->actingAs($superAdmin)->put("/super-admin/schools/{$school->id}", [
            'name' => $school->name,
            'admin_name' => $school->admin_name,
            'admin_email' => $school->admin_email,
            'status' => $school->status,
            'school_type' => $school->school_type,
            'fee_module' => 'monthly',
            'is_active' => 1,
        ]);

        $response->assertRedirect();
        $this->assertSame('monthly', $school->fresh()->fee_module);
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/SuperAdmin/SchoolFeeModuleFormTest.php`
Expected: FAIL — `fee_module` isn't validated or persisted by the controller yet; the first test fails because the column stays at its default `'termly'` instead of becoming `'monthly'`, the second fails because no validation error is raised for a missing `fee_module` (there's no rule requiring it yet), the third fails the same way as the first.

- [ ] **Step 3: Add validation and persistence to `SchoolController::store()`**

In `app/Http/Controllers/SuperAdmin/SchoolController.php`, in `store()`, add one line to the `$request->validate([...])` array immediately after the existing `'school_type' => 'required|in:islamic_school,madrasah',` line:

```php
            'fee_module' => 'required|in:termly,monthly',
```

Then add one line to the `School::create([...])` array immediately after the existing `'school_type' => $validated['school_type'],` line:

```php
                'fee_module' => $validated['fee_module'],
```

- [ ] **Step 4: Add validation to `SchoolController::update()`**

In the same file's `update()` method, add the identical validation line immediately after the existing `'school_type' => 'required|in:islamic_school,madrasah',` line:

```php
            'fee_module' => 'required|in:termly,monthly',
```

No change is needed to the update logic itself — `update()` already does `$school->update($validated)` with the whole validated array, so adding the rule is sufficient for the value to persist.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/SuperAdmin/SchoolFeeModuleFormTest.php`
Expected: PASS, 3 tests.

- [ ] **Step 6: Add the Fee Module field to `Create.jsx`**

In `resources/js/Pages/SuperAdmin/Schools/Create.jsx`, add `fee_module: 'termly',` to the `useForm` initial data object, immediately after the existing `school_type: 'islamic_school',` line:

```php
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        domain: '',
        admin_name: '',
        admin_email: '',
        admin_phone: '',
        address: '',
        status: 'trial',
        school_type: 'islamic_school',
        fee_module: 'termly',
        trial_ends_at: '',
        password_option: 'auto',
        admin_password: '',
        send_email: true,
        logo: null,
    });
```

Then find the "School Type" field block:

```jsx
                                        {/* School Type */}
                                        <div>
                                            <InputLabel htmlFor="school_type" value="School Type *" className="font-bold" />
                                            <select
                                                id="school_type"
                                                value={data.school_type}
                                                onChange={(e) => setData('school_type', e.target.value)}
                                                className="block w-full mt-2 border-gray-300 rounded-xl shadow-sm focus:border-purple-500 focus:ring-purple-500 font-semibold"
                                                required
                                            >
                                                <option value="islamic_school">Islamic School</option>
                                                <option value="madrasah">Madrasah</option>
                                            </select>
                                            <InputError message={errors.school_type} className="mt-2" />
                                            <p className="mt-2 text-sm text-gray-600">
                                                Madrasah mode hides academic subjects in reports and forms
                                            </p>
                                        </div>
```

And add a new field directly after it, matching the exact same shape:

```jsx
                                        {/* School Type */}
                                        <div>
                                            <InputLabel htmlFor="school_type" value="School Type *" className="font-bold" />
                                            <select
                                                id="school_type"
                                                value={data.school_type}
                                                onChange={(e) => setData('school_type', e.target.value)}
                                                className="block w-full mt-2 border-gray-300 rounded-xl shadow-sm focus:border-purple-500 focus:ring-purple-500 font-semibold"
                                                required
                                            >
                                                <option value="islamic_school">Islamic School</option>
                                                <option value="madrasah">Madrasah</option>
                                            </select>
                                            <InputError message={errors.school_type} className="mt-2" />
                                            <p className="mt-2 text-sm text-gray-600">
                                                Madrasah mode hides academic subjects in reports and forms
                                            </p>
                                        </div>

                                        {/* Fee Module */}
                                        <div>
                                            <InputLabel htmlFor="fee_module" value="Fee Module *" className="font-bold" />
                                            <select
                                                id="fee_module"
                                                value={data.fee_module}
                                                onChange={(e) => setData('fee_module', e.target.value)}
                                                className="block w-full mt-2 border-gray-300 rounded-xl shadow-sm focus:border-purple-500 focus:ring-purple-500 font-semibold"
                                                required
                                            >
                                                <option value="termly">Termly (Invoices, Tuition Fees, Universal Fees, Fee Preferences)</option>
                                                <option value="monthly">Monthly Fees</option>
                                            </select>
                                            <InputError message={errors.fee_module} className="mt-2" />
                                            <p className="mt-2 text-sm text-gray-600">
                                                Every school uses exactly one fee system — this can be changed later from the Edit screen.
                                            </p>
                                        </div>
```

- [ ] **Step 7: Add the Fee Module field to `Edit.jsx`**

In `resources/js/Pages/SuperAdmin/Schools/Edit.jsx`, add `fee_module: school.fee_module || 'termly',` to the `useForm` initial data object, immediately after the existing `school_type: school.school_type || 'islamic_school',` line:

```php
    const { data, setData, post, processing, errors } = useForm({
        name: school.name || '',
        slug: school.slug || '',
        domain: school.domain || '',
        admin_name: school.admin_name || '',
        admin_email: school.admin_email || '',
        admin_phone: school.admin_phone || '',
        address: school.address || '',
        status: school.status || 'trial',
        school_type: school.school_type || 'islamic_school',
        fee_module: school.fee_module || 'termly',
        is_active: school.is_active || false,
        trial_ends_at: school.trial_ends_at ? school.trial_ends_at.split('T')[0] : '',
        logo: null,
        _method: 'PUT',
    });
```

Then find the identical "School Type" field block in this file:

```jsx
                                        {/* School Type */}
                                        <div>
                                            <InputLabel htmlFor="school_type" value="School Type *" className="font-bold" />
                                            <select
                                                id="school_type"
                                                value={data.school_type}
                                                onChange={(e) => setData('school_type', e.target.value)}
                                                className="block w-full mt-2 border-gray-300 rounded-xl shadow-sm focus:border-purple-500 focus:ring-purple-500 font-semibold"
                                                required
                                            >
                                                <option value="islamic_school">Islamic School</option>
                                                <option value="madrasah">Madrasah</option>
                                            </select>
                                            <InputError message={errors.school_type} className="mt-2" />
                                            <p className="mt-2 text-sm text-gray-600">
                                                Madrasah mode hides academic subjects in reports and forms
                                            </p>
                                        </div>
```

And add a new field directly after it (byte-identical to what Create.jsx got in Step 6 — same ids, same options, same helper text):

```jsx
                                        {/* School Type */}
                                        <div>
                                            <InputLabel htmlFor="school_type" value="School Type *" className="font-bold" />
                                            <select
                                                id="school_type"
                                                value={data.school_type}
                                                onChange={(e) => setData('school_type', e.target.value)}
                                                className="block w-full mt-2 border-gray-300 rounded-xl shadow-sm focus:border-purple-500 focus:ring-purple-500 font-semibold"
                                                required
                                            >
                                                <option value="islamic_school">Islamic School</option>
                                                <option value="madrasah">Madrasah</option>
                                            </select>
                                            <InputError message={errors.school_type} className="mt-2" />
                                            <p className="mt-2 text-sm text-gray-600">
                                                Madrasah mode hides academic subjects in reports and forms
                                            </p>
                                        </div>

                                        {/* Fee Module */}
                                        <div>
                                            <InputLabel htmlFor="fee_module" value="Fee Module *" className="font-bold" />
                                            <select
                                                id="fee_module"
                                                value={data.fee_module}
                                                onChange={(e) => setData('fee_module', e.target.value)}
                                                className="block w-full mt-2 border-gray-300 rounded-xl shadow-sm focus:border-purple-500 focus:ring-purple-500 font-semibold"
                                                required
                                            >
                                                <option value="termly">Termly (Invoices, Tuition Fees, Universal Fees, Fee Preferences)</option>
                                                <option value="monthly">Monthly Fees</option>
                                            </select>
                                            <InputError message={errors.fee_module} className="mt-2" />
                                            <p className="mt-2 text-sm text-gray-600">
                                                Every school uses exactly one fee system — this can be changed later from the Edit screen.
                                            </p>
                                        </div>
```

- [ ] **Step 8: Build the frontend and verify no errors**

Run: `pnpm run build`
Expected: builds cleanly, no errors.

- [ ] **Step 9: Commit**

```bash
git add app/Http/Controllers/SuperAdmin/SchoolController.php resources/js/Pages/SuperAdmin/Schools/Create.jsx resources/js/Pages/SuperAdmin/Schools/Edit.jsx tests/Feature/SuperAdmin/SchoolFeeModuleFormTest.php
git commit -m "feat: add Fee Module field to the super-admin Create/Edit School forms"
```

---

### Task 4: Shared prop + nav split

**Files:**
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`
- Modify: `resources/js/Layouts/AuthenticatedLayout.jsx`
- Modify: `resources/js/Config/navigation.js`

**Interfaces:**
- Consumes: `schools.fee_module` (Task 1), the gated routes from Task 2 (a wrong-module nav click must now 404, matching what the nav will correctly stop offering).
- Produces: nothing consumed by a later task — this task is a leaf, verified live rather than by an automated frontend test (this repo has no frontend test suite — confirmed during spec research).

- [ ] **Step 1: Share `fee_module` in the global Inertia prop**

In `app/Http/Middleware/HandleInertiaRequests.php`, find:

```php
            $school = \App\Models\School::select('id', 'name', 'logo_path', 'is_active', 'status', 'school_type')
                ->find($user->school_id);

            if ($school) {
                $schoolData = [
                    'id' => $school->id,
                    'name' => $school->name,
                    'logo_path' => $school->logo_path,
                    'logo_url' => $school->logo_url,
                    'is_active' => $school->is_active,
                    'status' => $school->status,
                    'school_type' => $school->school_type,
                ];
            }
```

Replace with:

```php
            $school = \App\Models\School::select('id', 'name', 'logo_path', 'is_active', 'status', 'school_type', 'fee_module')
                ->find($user->school_id);

            if ($school) {
                $schoolData = [
                    'id' => $school->id,
                    'name' => $school->name,
                    'logo_path' => $school->logo_path,
                    'logo_url' => $school->logo_url,
                    'is_active' => $school->is_active,
                    'status' => $school->status,
                    'school_type' => $school->school_type,
                    'fee_module' => $school->fee_module,
                ];
            }
```

- [ ] **Step 2: Read `fee_module` and pass it into `getNavigation()`**

In `resources/js/Layouts/AuthenticatedLayout.jsx`, find:

```jsx
    const isMadrasah = school?.school_type === "madrasah";
    const navigation = getNavigation(auth.user.role, isMadrasah, can, canAny);
```

Replace with:

```jsx
    const isMadrasah = school?.school_type === "madrasah";
    const feeModule = school?.fee_module;
    const navigation = getNavigation(auth.user.role, isMadrasah, can, canAny, feeModule);
```

- [ ] **Step 3: Accept `feeModule` in `getNavigation()` and split the admin Fees submenu**

In `resources/js/Config/navigation.js`, find the function signature:

```js
export const getNavigation = (role, isMadrasah = false, can = () => true, canAny = () => true) => {
```

Replace with:

```js
export const getNavigation = (role, isMadrasah = false, can = () => true, canAny = () => true, feeModule = 'termly') => {
```

Then find the admin role's "Fees" submenu (the only place in this file where all 7 fee-related items appear):

```js
            {
                name: "Fees",
                icon: DollarSign,
                submenu: [
                    { name: "Dashboard", href: "/fees", icon: LayoutDashboard, permission: "fees.manage" },
                    { name: "Invoices", href: "/invoices", icon: Receipt, permission: "fees.manage" },
                    { name: "Transport Routes", href: "/transport-routes", icon: Bus, permission: "fees.manage" },
                    { name: "Tuition Fees", href: "/tuition-fees", icon: GraduationCap, permission: "fees.manage" },
                    { name: "Universal Fees", href: "/universal-fees", icon: BookOpen, permission: "fees.manage" },
                    { name: "Fee Preferences", href: "/fee-preferences", icon: Settings, permission: "fees.manage" },
                    { name: "Monthly Fees", href: "/monthly-fees", icon: Calendar, permission: "fees.manage" },
                ]
            },
```

Replace with:

```js
            {
                name: "Fees",
                icon: DollarSign,
                submenu: [
                    ...(feeModule === 'termly' ? [
                        { name: "Dashboard", href: "/fees", icon: LayoutDashboard, permission: "fees.manage" },
                        { name: "Invoices", href: "/invoices", icon: Receipt, permission: "fees.manage" },
                    ] : []),
                    { name: "Transport Routes", href: "/transport-routes", icon: Bus, permission: "fees.manage" },
                    ...(feeModule === 'termly' ? [
                        { name: "Tuition Fees", href: "/tuition-fees", icon: GraduationCap, permission: "fees.manage" },
                        { name: "Universal Fees", href: "/universal-fees", icon: BookOpen, permission: "fees.manage" },
                        { name: "Fee Preferences", href: "/fee-preferences", icon: Settings, permission: "fees.manage" },
                    ] : []),
                    ...(feeModule === 'monthly' ? [
                        { name: "Monthly Fees", href: "/monthly-fees", icon: Calendar, permission: "fees.manage" },
                    ] : []),
                ]
            },
```

- [ ] **Step 4: Split the guardian's flat fee nav items**

In the same file, find the guardian role's array, which contains:

```js
            { name: "Invoices", href: "/guardian/invoices", icon: DollarSign, permission: "fees.view-own-invoices" },
            { name: "Monthly Fees", href: "/guardian/monthly-fees", icon: DollarSign, permission: "fees.view-own-invoices" },
```

Replace with:

```js
            ...(feeModule === 'termly' ? [
                { name: "Invoices", href: "/guardian/invoices", icon: DollarSign, permission: "fees.view-own-invoices" },
            ] : []),
            ...(feeModule === 'monthly' ? [
                { name: "Monthly Fees", href: "/guardian/monthly-fees", icon: DollarSign, permission: "fees.view-own-invoices" },
            ] : []),
```

- [ ] **Step 5: Build the frontend**

Run: `pnpm run build`
Expected: builds cleanly, no errors.

- [ ] **Step 6: Verify live in a browser — termly school**

Start (or confirm already running) the dev server, log in as an admin whose school has `fee_module: 'termly'` (the default — any existing demo admin already qualifies, since this migration defaults everyone to termly). Confirm:
- The "Fees" submenu shows Dashboard, Invoices, Transport Routes, Tuition Fees, Universal Fees, Fee Preferences — and does **not** show Monthly Fees.
- As a guardian at the same school, the sidebar shows "Invoices" and does **not** show "Monthly Fees".

- [ ] **Step 7: Verify live in a browser — monthly school**

Using `php8.4 artisan tinker --execute="App\Models\School::first()->update(['fee_module' => 'monthly']);"` (or via the Edit screen from Task 3) switch a school to `fee_module: 'monthly'`, then reload as an admin at that school. Confirm:
- The "Fees" submenu shows only Transport Routes and Monthly Fees — no Dashboard, Invoices, Tuition Fees, Universal Fees, or Fee Preferences.
- Clicking Monthly Fees works normally (the module built earlier this session).
- As a guardian at the same school, the sidebar shows "Monthly Fees" and does **not** show "Invoices".

Switch the school back to `'termly'` afterward if it was shared demo data used by earlier verification passes.

- [ ] **Step 8: Commit**

```bash
git add app/Http/Middleware/HandleInertiaRequests.php resources/js/Layouts/AuthenticatedLayout.jsx resources/js/Config/navigation.js
git commit -m "feat: split fee navigation by school.fee_module"
```

---

### Task 5: Final whole-branch review and full suite regression check

**Files:** none (verification only).

- [ ] **Step 1: Audit for stray links to a gated fee route outside `navigation.js`**

The spec flagged this as unverified: a guardian-dashboard widget or admin summary card could link directly to a termly or monthly fee page without going through the nav (which now correctly hides the wrong module), silently producing a 404 for a link nobody meant to gate. Run each of these searches from the repo root and inspect any hits outside `resources/js/Config/navigation.js` and the fee pages' own internal links (e.g. `resources/js/Pages/Fees/**`, `resources/js/Pages/Invoices/**`, which linking to each other is expected and fine):

```bash
grep -rn "href=\"/invoices\|href=\"/tuition-fees\|href=\"/universal-fees\|href=\"/fee-preferences\|href=\"/monthly-fees\|route('invoices\|route('tuition-fees\|route('universal-fees\|route('fee-preferences\|route('monthly-fees" resources/js/Pages --include="*.jsx" | grep -v "resources/js/Pages/Fees/\|resources/js/Pages/Invoices/\|resources/js/Pages/TuitionFees/\|resources/js/Pages/UniversalFees/\|resources/js/Pages/FeePreferences/\|resources/js/Pages/MonthlyFees/"
```

If this finds a genuine stray link (e.g. a guardian dashboard "Pay your fees" card), note it — fixing it is a judgment call based on what's found (likely: make that link's visibility conditional on `fee_module` the same way the nav is, using the same `school` prop already available via Inertia). If nothing turns up outside the expected fee-page-to-fee-page links, no action needed — record that the audit ran clean.

- [ ] **Step 2: Run the entire test suite**

Run: `php8.4 artisan test`
Expected: PASS — all pre-existing tests plus every test added across Tasks 1-4, all green, 0 failures.

- [ ] **Step 3: Run Pint on every file this plan touched**

Run: `./vendor/bin/pint app/Http/Middleware/CheckFeeModule.php app/Http/Middleware/HandleInertiaRequests.php app/Http/Controllers/SuperAdmin/SchoolController.php app/Models/School.php bootstrap/app.php routes/web.php tests/Feature/SchoolFeeModuleColumnTest.php tests/Feature/FeeModuleGatingTest.php tests/Feature/SuperAdmin/SchoolFeeModuleFormTest.php`
Expected: PASS, no style violations (or auto-fixed cleanly).

- [ ] **Step 4: If anything unrelated broke, stop and investigate before continuing**

Do not proceed to `finishing-a-development-branch` with a red suite.

---
