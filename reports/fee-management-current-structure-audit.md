# Fee Management — Current Structure Audit

**Date:** 2026-09-08
**Scope:** Full, read-only inventory of how fee collection actually works today — the data model, the guardian/family "preference" mechanism, invoice generation, and payment settlement. No code was changed to produce this report. All claims below are verified directly against the current codebase (models, migrations, controllers), not inferred from naming.

**Companion reports:**
- `reports/monthly-fee-module-feasibility.md` — feasibility/complexity of adding a monthly billing cycle alongside this one.
- `reports/super-admin-billing-mode-toggle.md` — how a Super Admin per-school Termly/Monthly toggle would be wired in, using the existing `school_type` toggle as precedent.

---

## 1. Correcting a framing: this is not a "discount" system

Before this audit, the working assumption was that fee variance between guardians came from a **negotiated discount**. That's not what's built. What actually exists is a **preference/opt-in system**: each guardian picks, per child, per term, a combination of options — and the invoice is priced by summing whichever options were picked, off fixed rate catalogs. Nobody is discounted off a "standard" fee; there **is** no standard fee — the combination of choices *is* the fee. This matches the real operating model described: a new, adaptable school that would rather admit a family on a lighter combination than turn them away.

The three catalogs and how a guardian's picks price against them:

| Choice | Catalog it draws from | Model |
|---|---|---|
| Tuition tier: Full Day or Half Day | Per grade, per academic year, two fixed amounts (`amount_full_day`, `amount_half_day`) | `TuitionFee` |
| Transport: a specific route, One-Way or Two-Way, or none at all | Per route, per school, two fixed amounts (`amount_one_way`, `amount_two_way`) | `TransportRoute` |
| Food: opt in/out (boolean) | One fixed amount per academic year | `UniversalFee` (`fee_type = 'food'`) |
| Sports: opt in/out (boolean) | One fixed amount per academic year | `UniversalFee` (`fee_type = 'sports'`) |

The guardian's picks are stored **per student, per term** in `GuardianFeePreference` (`app/Models/GuardianFeePreference.php`, table `guardian_fee_preferences`), one row per child per term:

- `tuition_type`: `full_day` \| `half_day`
- `transport_route_id` (nullable) + `transport_type`: `one_way` \| `two_way` \| `none`
- `include_food`, `include_sports`: booleans
- `notes`: free text
- `updated_by` + `previous_values` (JSON snapshot of the row before the last edit) — a lightweight audit trail, `GuardianFeePreference.php:73-85`

Two siblings under the same guardian can absolutely land on different totals: one on Full Day + transport + food + sports, the other on Half Day with none of the add-ons. This is a faithful model of real school scenarios — one child takes transport and the other doesn't because a parent drops them off, one takes lunch and the other doesn't, one attends full day and the other only mornings — it is real flexibility, genuinely per-child, and it works today.

**Correction from an earlier pass of this audit:** it was initially reported that no field anywhere lets an admin type an arbitrary number. That's wrong, and the actual mechanism is described in full in §2.1 below — after an invoice is generated, an admin can open it, switch to edit mode, and directly overwrite the amount of any fee category, per child, to whatever was actually agreed, then save and collect payment against that number. So the catalog/preference picks (§1 above) set the *starting* amounts when an invoice is first generated, and a second, separate step (§2.1) lets the admin hand-correct those amounts afterward, per child, before any payment is taken. Read both sections together — neither one alone is the full picture.

---

## 2. Invoice generation: one invoice per guardian, per term

`app/Services/InvoiceGenerationService.php` is the single place invoices get built.

- **Trigger:** admin action only — either a single guardian (`InvoiceController.php:308`, `GuardianFeePreferenceController.php:361` after editing preferences) or a bulk run across many guardians (`FeeManagementController::processBulkGenerate()`, call site at `:263`). There is no automatic/scheduled generation — `routes/console.php` contains only the default `inspire` command; there is no `Kernel.php` schedule and no queued job that generates invoices on a timer.
- **One invoice per guardian per term, hard-enforced:** `guardian_invoices` has `unique(['guardian_id', 'academic_term_id'])` (migration `2025_12_01_000005_create_guardian_invoices_table.php:38`, named `guardian_term_invoice_unique`), and `generateInvoiceForGuardian()` throws before even trying if one already exists (`InvoiceGenerationService.php:65-71`).
- **One line item per child, not per fee:** `generateLineItems()` (`InvoiceGenerationService.php:118-235`) builds a single `InvoiceLineItem` per active student, with a JSON `fee_breakdown` column holding each priced component (`{"Tuition": {...}, "Transport": {...}, "Food": {...}, "Sports": {...}}`). `InvoiceLineItem`'s `saving` boot hook (`InvoiceLineItem.php:47-66`) sums that JSON into `total_amount` — this is the only place a line item's total is computed; nothing else can nudge it.
- **Preferences are mandatory, not optional:** if a guardian has no `GuardianFeePreference` row for a given student+term, invoice generation throws outright (`InvoiceGenerationService.php:217-222`: *"Guardian has no fee preferences set for this term. Please configure fee preferences before generating an invoice."*). There's no fallback "just charge Full Day" default.
- **Which children get included is subtly narrower than it looks:** `generateLineItems()` pulls students via `$guardian->students()` (`InvoiceGenerationService.php:125`) — this is `Guardian`'s **legacy** one-to-many relation (`Guardian.php:79-82`, comment: *"kept for backward compatibility"*). It does not include students linked only through the newer `guardian_student` pivot (`studentsMany()`, `Guardian.php:85-90`), which is how a second/non-primary guardian gets attached to a child. `Guardian::allStudents()`/`allStudentIds()` (`Guardian.php:103-119`) already exists and merges both paths — but `InvoiceGenerationService` doesn't use it. Practical effect: a student attached to a guardian **only** as a secondary/non-primary guardian will silently not appear on that guardian's invoice.
- **Invoice numbering is term-encoded:** format `INV-{year}-T{term_number}-{counter}`, counter reset per school+term (`InvoiceGenerationService.php:22-49`). This is the one place that would need to change shape for any non-termly cycle.
- **Due date is fixed, not policy-driven:** always `invoice_date + 14 days` (`InvoiceGenerationService.php:83`), no per-school configuration.

### 2.1 — After generation: admins can hand-edit each child's amounts directly

This is a real, already-shipped, and easy-to-miss capability: `InvoiceController::updateLineItems()` (`InvoiceController.php:347-401`, route `PUT /invoices/{invoice}/line-items`), driven by an "Edit" mode on the invoice detail page (`resources/js/Pages/Fees/Invoices/Show.jsx`).

- The page computes the union of every fee category that appears anywhere on the invoice ("Tuition", "Transport", "Food", "Sports" — whatever categories exist across all this guardian's children) and renders one numeric input per category, per child, in edit mode (`Show.jsx:32-43,276,295-310`).
- Critically, this input renders **even for a child whose original preference didn't include that category** — e.g. a child who opted out of transport still gets an editable "Transport" cell (defaulting to 0) if any sibling on the same invoice has transport. So an admin can genuinely type a fresh number into a category a specific child never had, not just adjust an existing one.
- On save, the new numbers are validated as plain non-negative numerics (`'line_items.*.fee_breakdown.*' => 'numeric|min:0'`, `InvoiceController.php:368`) and written straight into that line item's `fee_breakdown`, and `GuardianInvoice::recalculateTotals()` re-sums the total from the edited numbers (`InvoiceController.php:382-387`). Whatever the admin typed is what the guardian now owes and pays against.
- **The one real constraint: this only works while the invoice is still `pending`.** `updateLineItems()` explicitly blocks the edit once the invoice has moved past that status (`InvoiceController.php:353-355`: *"Can only edit pending invoices"*) — i.e. once any payment has been recorded and the status has flipped to `partial` or `paid`, the amounts are frozen. Practically: generate the invoice from preferences, correct the numbers to whatever was actually agreed, *then* start collecting payment. Renegotiating mid-payment isn't supported — the admin would have to delete and regenerate.
- This is a cleaner, already-working path to "whatever number was agreed" than reviving `GuardianFeeAdjustment` (§4) — no schema change needed, and it's already wired end-to-end from UI to database. `GuardianFeeAdjustment` remains relevant mainly as a place to *record why* an amount was changed (its `reason` field), which `updateLineItems()` has no equivalent for today — line-item edits carry no audit trail of who changed what or why, unlike `GuardianFeePreference`'s `updated_by`/`previous_values` fields (§1).

---

## 3. Payment settlement — and what "monthly installments" already means today

`payment_plan` (enum `full` \| `half_half` \| `monthly`, `guardian_invoices` migration line 25) is chosen by the admin when an invoice is created (`InvoiceController.php:292`, `FeeManagementController.php:224`, both `'required|in:full,half_half,monthly'`).

**Important: this field is a label only. Nothing in the codebase enforces it.** Grepping every controller and service that touches payments confirms there is no logic anywhere that checks `payment_plan` and requires, say, three equal payments for `monthly`, or blocks a payment that doesn't match the chosen plan. What actually happens:

- `PaymentController::store()` (`PaymentController.php:41-87`) accepts **any** amount from 0.01 up to the current `balance_due` (`:44-48`), on any date, as many times as needed, with no reference to `payment_plan` at all.
- Every `GuardianPayment` save/delete recalculates the invoice via `GuardianInvoice::recalculateTotals()` (`GuardianPayment.php:50-62`), which re-sums `payments()->sum('amount')` into `amount_paid` and derives `balance_due` and `status` (`pending` → `partial` → `paid`, or `overdue` past `due_date`) fresh each time (`GuardianInvoice.php:104-139`).

So "the monthly installment plan already exists" is accurate in exactly this sense: a guardian can pay a termly invoice in however many partial payments they like, over however long they like, and the system tracks the running balance correctly. What does **not** exist is a monthly **billing cycle** — a schedule that generates a smaller invoice (or line-item obligation) for each calendar month on its own. `payment_plan = 'monthly'` today only changes a label shown on the invoice (`resources/js/Components/Invoice/InvoiceHeader.jsx:110-114`); it does not create twelve records, does not set twelve due dates, and does not change how much can be paid at once.

---

## 4. A second, unused mechanism for per-guardian adjustments sits dormant in the schema

Beyond the working per-child override described in §2.1, there's a second table that was clearly built for a similar purpose and never connected to anything. `GuardianFeeAdjustment` (`app/Models/GuardianFeeAdjustment.php`, table `guardian_fee_adjustments`, migration `2025_12_01_000008_create_guardian_fee_adjustments_table.php`) has exactly the shape you'd design for "set this family's fee to whatever we agreed":

- `guardian_id` + `academic_term_id` (guardian-and-term scoped — **no `student_id` column**, so as built it's family-wide per category, not yet per individual child)
- `category_name` (free string — which fee line this touches, e.g. "Tuition")
- `adjustment_type`: enum `exclude` \| `custom_amount` \| `discount`
- `custom_amount` (nullable decimal) — for exactly the "type in whatever number we agreed" case
- `reason` (free text) + `created_by`

**It is never read or written anywhere.** A repo-wide search turns up exactly three references to `GuardianFeeAdjustment` in the whole codebase: the model file itself, and two inverse relationship declarations (`Guardian::feeAdjustments()` at `Guardian.php:174-177`, `AcademicTerm::guardianFeeAdjustments()` at `AcademicTerm.php:44-47`). No controller creates a row in this table. No React page has a form for it. `InvoiceGenerationService::generateLineItems()` never queries it. It was built and then the invoicing rewrite (the current preference-based `GuardianFeePreference` flow) shipped without wiring it in.

Separately, `GuardianInvoice` itself still carries `discount_percentage` and `discount_amount` columns (`GuardianInvoice.php:21-22`), but `recalculateTotals()` **hard-zeroes both on every call** (`GuardianInvoice.php:124-129`, with the source comment *"No discount applied"*). Any value ever written to those two columns is wiped the next time a payment is recorded or an invoice is touched.

**Practical implication:** since §2.1 already delivers the actual outcome (a specific typed number for a specific child), this table isn't necessary to build anything new — but it's worth knowing it's there if a future need arises for adjustments *before* an invoice is generated (rather than editing after), or for an auditable reason/history field that `updateLineItems()` currently lacks.

---

## 5. Admin/Super Admin surface

- There is no dedicated Super Admin "fee settings" area. `routes/super-admin.php:36-40` has commented-out placeholder routes for a `SettingsController` that doesn't exist, and `resources/js/Config/navigation.js:64` has a dead "Settings" nav entry pointing at a route that was never registered.
- The one precedent for a **school-level toggle that changes school behavior** is `school_type` (`islamic_school` \| `madrasah`), set at school creation and editable afterward by Super Admin (`SuperAdmin/SchoolController.php:75,217`). It's threaded through: a global Inertia shared prop (`HandleInertiaRequests.php:39-50`), a dedicated gating middleware (`CheckMadrasahSchool.php`), a derived boolean in the layout (`AuthenticatedLayout.jsx:35-36`), and conditional nav items (`navigation.js`). This is the exact pattern a `billing_mode` toggle would reuse — detailed in `reports/super-admin-billing-mode-toggle.md`.
- Academic terms themselves are Super-Admin/Admin managed with a hard ceiling: `AcademicTermController.php:35,84` validates `term_number` as `min:1|max:3` — the system assumes at most 3 terms/year everywhere a term is created.

---

## 6. Reporting & other places that assume "termly"

- `resources/views/invoices/pdf.blade.php:387-388` hardcodes the billing-period label as `"{year} - Term {term_number}"` — this string would need to change shape for a monthly invoice.
- `app/Http/Controllers/ReportController.php` (report cards, not fees) independently hardcodes `'term' => 'required|in:1,2,3'` in four places (`:96,382,425,476`) and has term-3-specific cumulative-average logic (`:156-222,228-286`). This is a separate module from fees, but it confirms "term" is a load-bearing concept elsewhere in the system, not something that can be quietly retired even if a school's *billing* moves to monthly.
- `FeeManagementController`'s "monthly collections" chart (`:83-120`) is a reporting view that buckets **existing termly invoices** by the calendar month they were generated/paid in — it does not represent a monthly billing cycle, just a monthly view over termly data.
- `MpesaController.php` is a 108-line disconnected sandbox stub (hardcoded credentials, placeholder account reference, empty `confirm()` callback) — not wired to the real `GuardianPayment`/`GuardianInvoice` flow at all. Not termly-specific, but worth knowing it isn't a working integration today regardless of billing cadence.

---

## 7. Test coverage

`tests/Feature/GuardianInvoiceOwnershipTest.php` is the **only** fee-related test in the 53-file suite, and it tests authorization (can a guardian view another guardian's invoice) — not generation, pricing, or payment logic. There is **no** test coverage on `InvoiceGenerationService`, `GuardianFeePreference`, `GuardianPayment`'s recalculation boot hooks, or the `payment_plan` field. Any change to this module — monthly or otherwise — is currently unguarded by regression tests.

---

## 8. Summary of what's real vs. what's a false lead

| Belief | Verdict |
|---|---|
| "Guardians get individually negotiated discounts" | **Reframe:** the starting price comes from each child's real-world scenario (full/half day, transport or not, food/sports or not) priced off catalogs — not a discount off a standard fee. |
| "An admin can type in whatever amount was actually agreed, per child" | **True** — via editing a pending invoice's line items (§2.1). Locked once payment starts; not available before the invoice exists. |
| "Some families pay less because they're struggling, as a charity gesture" | Achievable both by picking a cheaper combination up front (§1) **and** by hand-correcting the generated amount afterward (§2.1). |
| "Monthly installments already exist" | **True, but only at the payment layer** — any number of partial payments against one termly invoice, unscheduled, unenforced. No monthly billing *cycle* exists. |
| "There's a table for custom per-guardian amounts" | **True** (`GuardianFeeAdjustment`) — but it's dead code, unnecessary given §2.1 already does the job. |
| "Term is deeply load-bearing elsewhere" | **True** — report cards, invoice numbering, and academic-term management all hardcode term structure independent of fees. |
