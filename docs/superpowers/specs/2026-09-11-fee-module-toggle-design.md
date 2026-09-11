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

A new middleware, `CheckFeeModule`, structurally identical to `CheckMadrasahSchool`:

```php
class CheckFeeModule
{
    public function handle(Request $request, Closure $next, string $required)
    {
        $school = /* load the authenticated user's school fresh, same pattern as CheckMadrasahSchool */;

        if ($school?->fee_module !== $required) {
            abort(404);
        }

        return $next($request);
    }
}
```

Registered as two middleware aliases in `bootstrap/app.php`:

- `fee-module:termly`
- `fee-module:monthly`

### Route grouping (`routes/web.php`)

The existing single `Route::middleware(['user.active', 'permission:fees.manage'])->group(...)` block that currently holds every fee-related route (both termly and monthly, undifferentiated) splits into three:

```php
Route::middleware(['user.active', 'permission:fees.manage'])->group(function () {

    Route::middleware(['fee-module:termly'])->group(function () {
        // fees.*, invoices.*, tuition-fees.*, universal-fees.*, fee-preferences.*
    });

    Route::middleware(['fee-module:monthly'])->group(function () {
        // monthly-fees.*
    });

    // Transport Routes — NOT wrapped in either fee-module gate.
    // transport-routes.*
});
```

Guardian-facing routes (currently one `permission:fees.view-own-invoices` group mixing `invoices.*` and `guardian.monthly-fees`) get the identical split: `invoices.*` under `fee-module:termly`, `guardian.monthly-fees` under `fee-module:monthly`.

This is a routing reorganization only — no controller changes. `MonthlyFeeController` and the termly controllers (`FeeManagementController`, `InvoiceController`, `TuitionFeeController`, `UniversalFeeController`, `GuardianFeePreferenceController`) are already fully separate classes with no shared logic to untangle. `TransportRouteController` moves out of both gates entirely.

## Frontend

### Shared prop

`HandleInertiaRequests` middleware already selects and shares `school_type` inside the global `school` prop — `fee_module` gets added to that same `select()`/share call.

### Navigation (`resources/js/Config/navigation.js`)

`AuthenticatedLayout.jsx` reads `school?.fee_module` (alongside the existing `isMadrasah` read) and passes it into `getNavigation(...)`. The current single "Fees" submenu — which lists all 7 items unconditionally — becomes conditional, following the exact `...(isMadrasah ? [...] : [])` spread pattern already used for Quran nav entries:

- `Dashboard`, `Invoices`, `Tuition Fees`, `Universal Fees`, `Fee Preferences` → shown only when `fee_module === 'termly'`
- `Monthly Fees` → shown only when `fee_module === 'monthly'`
- `Transport Routes` → shown unconditionally, regardless of `fee_module` (same visibility rule as today — only gated by the `fees.manage` permission)

Guardian-facing nav gets the same split: `Invoices` only when `fee_module === 'termly'`, `Monthly Fees` only when `fee_module === 'monthly'`.

### Super Admin Create/Edit School form

A new "Fee Module" field — two radio options ("Termly" / "Monthly") — added to `SuperAdmin/Schools/Create` and `Edit` pages, alongside the existing "School Type" field. Backend validation on `SchoolController::store()`/`update()`: `'fee_module' => ['required', 'in:termly,monthly']`.

## Error handling

A school hitting a route outside its `fee_module` (e.g. a stale bookmark, a guardian on a `monthly` school clicking an old `/invoices` link) gets a plain 404 — identical to how the Quran module already 404s for non-madrasah schools today. No redirect, no friendly "wrong module" message. This keeps the implementation and behavior consistent with the one existing precedent in the codebase, and 404 is the correct signal here (the resource genuinely doesn't exist for this school).

## Testing

Mirrors the existing tenant-isolation/madrasah-gating test style already in this codebase:

- A school on `fee_module: 'monthly'` gets 404 on every termly route (`/fees`, `/invoices`, `/tuition-fees`, `/universal-fees`, `/fee-preferences`, and their guardian-facing equivalents).
- A school on `fee_module: 'termly'` gets 404 on every monthly-fees route (`/monthly-fees` and its sub-actions, `/guardian/monthly-fees`).
- Both types of school get 200 on `/transport-routes` regardless of `fee_module`.
- Existing schools (created via factory with no explicit `fee_module`) default to `'termly'`.
- Super admin can create a school with either `fee_module` value, and can change an existing school's value via the Edit screen at any time, with no restriction.
- Nav.js: existing school_type/madrasah conditional-nav tests (if any exist) serve as the pattern for a parallel `fee_module` nav test, if the project has frontend nav tests — otherwise this is verified manually via live browser check, matching how nav changes were verified earlier this session.

## Open assumptions carried into implementation

- The exact route-name list per bucket (termly vs. monthly vs. shared) should be re-verified against the actual current `routes/web.php` at implementation time — the list in this spec reflects what was found during this session's research pass and could have shifted slightly.
- Whether any guardian-dashboard widget or admin-dashboard summary card (outside of `navigation.js`) links directly to a termly or monthly fee page should be audited during implementation planning, so no stray link silently 404s for a guardian who never even sees it in their nav.
