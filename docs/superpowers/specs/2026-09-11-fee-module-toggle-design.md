# Per-School Fee Module Toggle — Design Spec

## Context

schoolMS now has two entirely separate, complete fee-billing systems living side by side in every school's navigation:

- **Termly** — the original system: a Fees Dashboard (`/fees`), Invoices, Tuition Fees, Universal Fees, and Fee Preferences.
- **Monthly Fees** — the module built earlier this session: arrears settlement, prepayment/credit, cash-basis analytics.

Today every school sees all of it, all the time — there is no separation. A school genuinely only needs one of the two; showing both is confusing and meaningless (a school billing termly has no use for the Monthly Fees ledger, and vice versa).

This spec adds a per-school toggle, set by the super admin when creating (or later editing) a school, that determines which one fee module that school uses. It follows the exact precedent already established in this codebase for `school_type` (`islamic_school` / `madrasah`), which already gates the Quran module the same way.

## Goals

- Every school has exactly one active fee module: `termly` or `monthly` — never both, never neither.
- A super admin picks the module when creating a school, and can change it later at any time (no confirmation/warning needed — matches how `school_type` already works).
- A school on the wrong module for a given route gets a 404, identical to how a non-madrasah school 404s on Quran routes today.
- Existing schools (all of which have been using the termly system, since Monthly Fees didn't exist as a choice before now) default to `termly` automatically — nothing changes for them until a super admin deliberately switches a specific school.
- Transport Routes is **not** part of either bucket — it's shared infrastructure both fee modules' guardian fee-preference flows read from, and stays visible/reachable regardless of a school's `fee_module`.

## Non-goals (explicitly out of scope for this spec)

- A general "bundle of feature toggles per school" (the user raised this as a related but separate idea, generalizing this same pattern to Quran/other modules). Worth its own future spec; not built here.
- Any change to M-Pesa integration — nothing in the current route/controller structure ties M-Pesa to fee-module selection, so this spec doesn't touch it.
- Data migration/merging between the two fee systems if a school switches — switching only changes which module is *reachable*; historical records under the old module stay in the database untouched and become reachable again if switched back.

## Data model

One new column on `schools`:

```php
$table->enum('fee_module', ['termly', 'monthly'])->default('termly');
```

A plain add-column migration, mirroring `2025_11_22_100000_add_school_type_to_schools_table.php` exactly. The `default('termly')` means every existing row gets the correct value automatically — no manual backfill script needed.

## Backend enforcement

A new middleware, `CheckFeeModule`, mirroring the actual current `app/Http/Middleware/CheckMadrasahSchool.php` structure exactly (verified by reading it directly — not paraphrased):

```php
class CheckFeeModule
{
    public function handle(Request $request, Closure $next, string $required): Response
    {
        if (! auth()->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user();

        if ($user->isSuperAdmin()) {
            abort(404);
        }

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

Registered as **one** middleware alias in `bootstrap/app.php` (not two — this takes a parameter, exactly like the existing `'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class` alias already does):

```php
'fee-module' => CheckFeeModule::class,
```

Used in routes as `fee-module:termly` / `fee-module:monthly`.

### Route grouping (`routes/web.php`)

Verified against the actual current route block (lines 640-706, admin; 708-712, guardian). The full, exact route-name inventory per bucket:

**Termly bucket** (`fee-module:termly`):
`fees.index`; `tuition-fees.index/store/bulk-store/update/destroy/toggle-status`; `universal-fees.index/store/bulk-store/update/destroy/toggle-status`; `fee-preferences.index/edit/update/destroy/bulk-apply-defaults/history`; `invoices.index/create/preview/store/clearAll/show/updateLineItems/pdf/destroy`; `payments.create/store/show/destroy` (a `PaymentController`, found during this scan — was missing from the spec's original route list); guardian-facing: `guardian.invoices`, `guardian.invoices.show`, `guardian.invoices.pdf`.

**Monthly bucket** (`fee-module:monthly`):
`monthly-fees.index/open-next-month/update-expected/mark-paid/undo/update-collected/record-payment/apply-credit`; guardian-facing: `guardian.monthly-fees`.

**Shared, ungated** (stays exactly where it is today, outside both `fee-module` gates — per the Transport Routes clarification):
`transport-routes.index/store/update/destroy/toggle-status`.

Both the admin block (currently one `Route::middleware(['user.active', 'permission:fees.manage'])->group(...)`) and the guardian block (currently one `Route::middleware(['user.active', 'permission:fees.view-own-invoices'])->group(...)`) split the same way: two new nested `fee-module:*` sub-groups, with Transport Routes left at the outer level, untouched.

This is a routing reorganization only — no controller changes. Every controller involved (`FeeManagementController`, `InvoiceController`, `PaymentController`, `TuitionFeeController`, `UniversalFeeController`, `GuardianFeePreferenceController`, `TransportRouteController`, `MonthlyFeeController`) is already a fully separate class with no shared logic to untangle.

## Data model — model layer

`App\Models\School`'s `$fillable` array needs `'fee_module'` added (verified: `school_type` is already there; `fee_module` must be added alongside it or `SchoolController::store()`/`update()`'s mass-assignment will silently drop the field).

## Frontend

### Shared prop

`HandleInertiaRequests.php` (verified, lines ~39-50): both the `School::select(...)` column list and the `$schoolData` array it builds need `'fee_module'` added, alongside the existing `'school_type'` entries in each.

### Navigation (`resources/js/Config/navigation.js`)

Verified: the "Fees" submenu with all 7 items appears in exactly **one place** — the `admin` role's nav array (lines 99-109). Neither `teacher` nor `head_teacher` has a Fees section at all. The `guardian` role has two flat top-level items (lines 230-231: `Invoices`, `Monthly Fees`) rather than a submenu. So exactly two edits are needed, not a broad sweep:

- Admin's "Fees" submenu splits its `submenu` array using the same `...(isMadrasah ? [...] : [])` spread pattern already used for the Quran entries in this same file: `Dashboard`, `Invoices`, `Tuition Fees`, `Universal Fees`, `Fee Preferences` spread in only when `feeModule === 'termly'`; `Monthly Fees` spread in only when `feeModule === 'monthly'`; `Transport Routes` stays unconditional.
- Guardian's two flat items become conditional: `Invoices` only when `feeModule === 'termly'`, `Monthly Fees` only when `feeModule === 'monthly'`.

`AuthenticatedLayout.jsx` (verified, line 35: `const isMadrasah = school?.school_type === "madrasah";`) gets a parallel `const feeModule = school?.fee_module;` line, and `getNavigation(role, isMadrasah, can, canAny)` (line 57 of navigation.js) gains a new `feeModule` parameter passed alongside `isMadrasah`.

### Super Admin Create/Edit School form

Verified: `school_type` renders as a `<select>` dropdown (not radio buttons — correcting this spec's earlier draft) in both `resources/js/Pages/SuperAdmin/Schools/Create.jsx` (~line 260) and `Edit.jsx` (~line 278), each with an `<InputLabel>`, the `<select>` itself, an `<InputError>`, and a one-line helper `<p>` underneath explaining the choice. The new "Fee Module" field matches this exact same markup shape — a `<select>` with `<option value="termly">Termly</option>` / `<option value="monthly">Monthly Fees</option>`, plus a helper line explaining what each does — placed directly next to the existing "School Type" field. Both pages' `useForm` initial `data` objects need a `fee_module` key (`Create.jsx` defaults it to `'termly'`; `Edit.jsx` defaults it to `school.fee_module || 'termly'`, mirroring exactly how `school_type` is initialized in each).

Backend validation, added to both `store()` and `update()` in `SchoolController.php`: `'fee_module' => 'required|in:termly,monthly'` (matching the existing `'school_type' => 'required|in:islamic_school,madrasah'` line's exact style), and `'fee_module' => $validated['fee_module']` added to the `School::create([...])` array in `store()` (verified `update()` needs no equivalent addition — it already does `$school->update($validated)` with the whole validated array, so adding the validation rule is sufficient there).

## Error handling

A school hitting a route outside its `fee_module` (e.g. a stale bookmark, a guardian on a `monthly` school clicking an old `/invoices` link) gets a plain 404 — identical to how the Quran module already 404s for non-madrasah schools today. No redirect, no friendly "wrong module" message. This keeps the implementation and behavior consistent with the one existing precedent in the codebase, and 404 is the correct signal here (the resource genuinely doesn't exist for this school).

## Testing

Mirrors the existing madrasah-gating test style already in this codebase (verified via `tests/Feature/QuranDashboardAccessTest.php`, which creates schools with an explicit `School::factory()->create(['school_type' => 'islamic_school'])` override — the same override pattern works for `fee_module` with no new factory state needed):

- A school on `fee_module: 'monthly'` gets 404 on every termly route, including `payments.*` (easy to miss — it's a separate `PaymentController`, not folded into `invoices.*`).
- A school on `fee_module: 'termly'` gets 404 on every monthly-fees route (`/monthly-fees` and its sub-actions, `/guardian/monthly-fees`).
- Both types of school get 200 on `/transport-routes` regardless of `fee_module`.
- Existing schools (created via factory with no explicit `fee_module`) default to `'termly'` — assert this via `->fresh()` after create, not the in-memory model immediately post-`create()`, since Eloquent doesn't reflect a DB-level column default on the in-memory instance without a refresh (the exact lesson this session already hit once with `credit_balance`/`credit_applied` defaults on `MonthlyFeeSetting`/`MonthlyFeeEntry`).
- Super admin can create a school with either `fee_module` value, and can change an existing school's value via the Edit screen at any time, with no restriction.
- Nav.js has no existing frontend test suite (verified earlier this session — no Jest/RTL/Vitest present in this repo) — the nav split is verified via a live browser check instead, same as every other frontend change made this session.

## Open items for the implementation plan

- Double-check no other page (a guardian-dashboard widget, an admin summary card) links directly to a termly or monthly fee route outside of `navigation.js` — a quick grep for `/invoices`, `/tuition-fees`, `/universal-fees`, `/fee-preferences`, `/monthly-fees` across `resources/js/Pages` during planning is enough to rule this in or out; nothing found so far suggests it's a problem, but it wasn't exhaustively checked.
- `routes/api.php` was checked and confirmed to have no fee/invoice/monthly/payment routes — no API-layer gate needed.
