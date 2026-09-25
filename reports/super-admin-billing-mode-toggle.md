# Super Admin — Termly / Monthly Billing Mode Toggle

**Date:** 2026-09-08
**Scope:** How a Super Admin selects, per school, whether that school runs the existing termly invoicing system (`reports/fee-management-current-structure-audit.md`) or the new monthly ledger (`reports/monthly-fee-module-feasibility.md`) — set at school creation, editable later, and respected everywhere that school's staff work with fees. Read-only analysis; no code was written for this report.

---

## 1. There's already a proven precedent for exactly this — `school_type`

This system already has a school-level toggle that changes what an entire school's staff see and can do: `school_type` (`islamic_school` \| `madrasah`). It's set once at creation and editable afterward by Super Admin, and it's threaded through every layer a `billing_mode` toggle would need:

| Layer | What `school_type` does there | File |
|---|---|---|
| Schema | Plain enum column on `schools` | `2025_11_22_100000_add_school_type_to_schools_table.php` |
| Creation | Required `<select>` field, validated `required\|in:islamic_school,madrasah` | `SuperAdmin/SchoolController.php:75`, `resources/js/Pages/SuperAdmin/Schools/Create.jsx:260-274` |
| Edit | Same field, editable post-creation | `SuperAdmin/SchoolController.php:217`, `resources/js/Pages/SuperAdmin/Schools/Edit.jsx:278-293` |
| Shared to every page | Selected columns pulled onto the global Inertia shared prop on every request | `HandleInertiaRequests.php:39-50` |
| Derived flag in the layout | `const isMadrasah = school?.school_type === "madrasah"` | `AuthenticatedLayout.jsx:35-36` |
| Route gating | Dedicated middleware, `abort(404)` for schools not in that mode | `CheckMadrasahSchool.php`, aliased `madrasah.only` in `bootstrap/app.php:46` |
| Nav gating | Conditional menu injection based on the derived flag | `navigation.js` (`getNavigation(role, isMadrasah, ...)`) |

This is a complete, working reference implementation for "one enum on `School`, set by Super Admin, that changes what a school's staff experience" — a `billing_mode` toggle is the same shape of problem, solved the same way, twice already proven correct in this codebase (once for `school_type`, and the pattern is old enough to be a stable convention rather than a one-off).

---

## 2. Recommendation: `billing_mode` lives directly on `School`, not a separate `FeeSettings` model

Add it as a sibling column to `school_type`, not a new related table:

```
$table->enum('billing_mode', ['termly', 'monthly'])->default('termly');
```

**Why not a separate `FeeSettings` model:** the only reason to split billing config into its own table is if it's expected to grow into many related settings (a due-day-of-month, a grace period, a late-fee policy, etc.). None of that exists today, and `reports/monthly-fee-module-feasibility.md` deliberately scoped the monthly module to need **no configuration at all** beyond the mode itself — it's a manual ledger, not a policy-driven billing engine. Following the `school_type` precedent (a single column, not a settings table) keeps this consistent with how the one other school-level mode toggle in this codebase is actually built, and avoids introducing a second pattern for the same kind of decision. If billing-specific configuration genuinely grows later (e.g. a monthly due-day, per-school), it's a cheap follow-up migration to add columns to `School` or to split off a settings table then — not a reason to over-build now.

**Default `termly` on the migration** backfills every existing school automatically to its current (only) mode — no data migration script needed, no school's behavior changes on deploy.

---

## 3. Where it needs to be threaded — mirroring `school_type` exactly

- **`SuperAdmin/SchoolController.php`** — add `'billing_mode' => 'required|in:termly,monthly'` to both `store()` (`:75`) and `update()` (`:217`) validation, alongside the existing `school_type` rule, and pass it through to `School::create()`/`update()`.
- **`Create.jsx` / `Edit.jsx`** — clone the `school_type` `<select>` block (`Create.jsx:260-274`, `Edit.jsx:278-293`) for `billing_mode`. Two options, not a pair of independent checkboxes — the brief specifically asked for mutually-exclusive selection, and an enum `<select>` (or two radio buttons) enforces that at the form level, matching how `school_type` is already presented.
- **`HandleInertiaRequests.php:39-50`** — add `billing_mode` to the `School::select(...)` column list and the shared `school` prop, exactly where `school_type` already sits.
- **`AuthenticatedLayout.jsx:35-36`** — add `const isMonthlyBilling = school?.billing_mode === "monthly"`, next to the existing `isMadrasah` derivation, and pass it down anywhere fee-related nav or pages need to branch (mirroring how `isMadrasah` is threaded to lines 109/129/148/167 today).
- **`navigation.js`** — if the two modes need visibly different menu items (e.g. "Invoices" vs. "Monthly Ledger" as the label/route under the Fees section), branch here the same way the Quran submenu is conditionally injected for `isMadrasah`.
- **Route gating (only if needed):** if some routes should be entirely unreachable in the "wrong" mode (e.g. a monthly-only school shouldn't be able to hit `/invoices/create`), add a small middleware mirroring `CheckMadrasahSchool.php` — checks `billing_mode` on the request's school, `abort(404)` otherwise. Whether this is needed depends on a product decision: should both systems stay reachable for every school regardless of mode (softer, more forgiving), or should the "off" mode's routes be hard-blocked (cleaner, matches the `madrasah.only` precedent)? Recommend mirroring the existing precedent (hard `404` gate) for consistency, since that's exactly how `school_type` already behaves for the Quran module.
- **Controllers that currently assume termly** (`InvoiceController`, `FeeManagementController`, `GuardianFeePreferenceController`, `PaymentController`) — these stay as-is; they simply become "the code that runs for `billing_mode = 'termly'` schools." No branching needs adding *inside* them — the branching happens at the route/nav layer (a monthly-mode school never reaches these controllers if gated as above), which is the same reason `TimetableTemplateController` etc. don't need internal `if ($school->isMadrasah())` checks scattered through them — `CheckMadrasahSchool` keeps that logic out of business code entirely.

---

## 4. What happens to schools that switch mode after they already have data

This is the one genuinely new question `school_type` never had to answer, since switching a school between `islamic_school` and `madrasah` doesn't orphan any existing records — but switching `billing_mode` could leave open termly invoices or partially-filled monthly ledger months behind. Recommended rule, matching the "prospective-only" simplification already recommended in the monthly-module feasibility report (§2.6 there):

- **A mode switch only affects new billing activity going forward.** Existing `GuardianInvoice` records (if switching away from termly) remain fully visible and payable exactly as before — a switch doesn't delete, lock, or migrate them. Existing `monthly_fee_entries` rows (if switching away from monthly) likewise stay untouched and viewable.
- **The route-gating middleware (§3) should key off `billing_mode` for what an admin can *do next*, not hide what already happened.** In practice this likely means: even after a switch, still allow *viewing* historical records from the old mode (invoice history, past ledger months) — only new generation/entry actions get redirected to the new mode's screens. This keeps the gate simple (no dual-mode business logic, no data migration) while not stranding an admin's history.
- This sidesteps proration entirely, at the cost of a school having a visible "seam" in its records at the switch date — which is an honest, low-risk trade-off for a toggle that (per the interviews so far) is expected to be set once at onboarding and rarely changed afterward, not flipped repeatedly.

---

## 5. Effort estimate

This is the cheapest of the three pieces of work, because it's copying a pattern that already exists twice in this codebase rather than designing something new:

| Piece | Estimate |
|---|---|
| Migration + `School` fillable/cast update | 0.25 day |
| `SuperAdmin/SchoolController` validation + `Create.jsx`/`Edit.jsx` fields | 0.5 day |
| `HandleInertiaRequests` shared prop + `AuthenticatedLayout` derived flag | 0.25 day |
| `navigation.js` conditional menu items | 0.5 day |
| Route-gating middleware (mirroring `CheckMadrasahSchool`) | 0.5 day |
| QA across both modes (school creation, switching, nav, route gating) | 1 day |
| **Total** | **~3 dev-days**, separate from and in addition to the monthly ledger module itself (`reports/monthly-fee-module-feasibility.md`, ~8–10 dev-days). |

**Combined total for the whole initiative** (toggle + monthly ledger module, termly system untouched): **~11–13 dev-days, roughly 2–2.5 weeks**, for one full-stack developer familiar with this codebase.
