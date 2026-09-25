# Monthly Fee Collection Module — Feasibility & Complexity Analysis

**Date:** 2026-09-08
**Scope:** Feasibility of adding a monthly fee-tracking module, scoped exactly as specified: **a manual ledger, not an invoicing system.** No invoice objects, no line-item breakdowns, no PDF, no generation step. One flat, spreadsheet-shaped record per student per month — expected amount if paid, blank/crossed if not — with each month's column summing to a total collected. Read-only analysis; no code was written for this report.

**Read this after** `reports/fee-management-current-structure-audit.md` — in particular §2.1 of that report, which found that admins already hand-type per-child agreed amounts into the existing termly system (by editing a pending invoice's line items). That confirms the underlying instinct here: **the school doesn't want a system to compute the fee — it wants a place to record what was agreed and whether it was paid.** The monthly module described below is that idea taken to its simplest possible form, deliberately without an invoicing layer on top of it.

---

## 1. The requirement, restated precisely

A spreadsheet-shaped tracker, one row per student:

| Student Name | Guardian Name | Guardian Phone | Jan | Feb | Mar | ... | Dec |
|---|---|---|---|---|---|---|---|
| Amina Yusuf | Fatuma Ali | 0712 345 678 | 4,000 | 4,000 | — | ... | |
| Hassan Yusuf (sibling) | Fatuma Ali | 0712 345 678 | 3,000 | — | 3,000 | ... | |
| **Column total** | | | **7,000** | **4,000** | **3,000** | ... | |

- Each month's cell holds a **number** if that student's guardian paid for that month (the amount actually collected — which, per the current-structure audit, may be a different figure for each sibling because it's whatever was agreed for that specific child).
- A blank/crossed cell means not paid for that month. No separate "expected vs. paid" distinction is required — the cell **is** the record: present = paid this amount, absent = not paid.
- Each month column sums to a running total collected for the school that month.
- Siblings under the same guardian appear as separate rows (each can have a different monthly amount, matching real scenarios — different transport/food/hours per child) but share the same guardian name/phone, so they read as a family group.

This is materially simpler than the termly invoicing system, on purpose. There is no line-item breakdown to compute, no invoice number, no PDF, no due-date policy, no "generate" step at all — an admin just opens the sheet and types.

---

## 2. Data model this actually needs

One new table is enough. No invoice-shaped concepts (numbering, line items, PDF templates) are needed anywhere in this module.

**`monthly_fee_entries`** (new table, `BelongsToSchool`-scoped like every other tenant table in this app):

| Column | Purpose |
|---|---|
| `school_id` | tenant scope, per `BelongsToSchool` |
| `student_id` | which child this row is for |
| `year` (int) + `month` (tinyint 1–12) | which month this cell belongs to |
| `amount` (nullable decimal) | the amount recorded as paid for that student, that month. `null` = the "blank/crossed" unpaid state. |
| `paid_date` (nullable date) | when it was actually paid, if known — optional but cheap to add and useful later |
| `recorded_by` (FK to `users`) | who entered it — mirrors `GuardianPayment.recorded_by` from the existing termly module |
| `notes` (nullable text) | free text, mirrors the existing pattern on `GuardianFeePreference`/`GuardianPayment` |

Unique constraint on `(student_id, year, month)` — exactly one cell per student per month, same shape as `guardian_fee_preferences`' `(student_id, academic_term_id)` uniqueness in the termly system.

**Guardian name/phone for the row** doesn't need to be duplicated into this table — it's read live off `Student::guardian` (or the primary row of `Student`'s `guardian_student` pivot, `can_receive_invoices = true`) exactly the way the termly system already resolves "this student's guardian" today. **Column totals** are a single `SUM(amount) WHERE year = ? AND month = ? AND school_id = ?` grouped by month — no stored aggregate needed, computed on read.

That's the entire backend. Contrast with the termly system's `GuardianInvoice` + `InvoiceLineItem` + `GuardianPayment` + `InvoiceGenerationService` + PDF template — this module needs **one table and no service class**, because there's no generation step to orchestrate: the admin is the one filling in the amount, not a pricing engine deriving it from a catalog.

---

## 3. Feasibility scores (1 = trivial, 10 = major rearchitecture)

### 3.1 — The core ledger (table + read/write of one cell)
**Score: 2/10.** A single new Eloquent model with `BelongsToSchool`, a controller with an index (return the grid data for a year) and an upsert endpoint (`student_id`, `year`, `month`, `amount` → `updateOrCreate`). This is one of the most standard CRUD shapes in the whole codebase — closely mirrors what `GuardianFeePreferenceController::update()` already does (`updateOrCreate` keyed on student+period), just without the catalog-pricing step in between.

### 3.2 — Per-child arbitrary amount (the actual "agreed" number)
**Score: 1/10.** This isn't a feature to build — it's the entire shape of the `amount` column. There is no catalog, no menu, no preference lookup standing between "what the admin types" and "what's stored." This is strictly simpler than even the corrected termly system in report 1, where a starting amount still gets computed from catalogs before an admin can override it (§2.1 of that report). Here there's no starting amount to override — the field starts empty and the admin fills it directly.

### 3.3 — Grouping siblings under one guardian, in the grid
**Score: 2/10.** `Student::guardian` (or the primary pivot row) already resolves each student's guardian and phone number today (`Guardian::getPhoneAttribute()`, current-structure audit §1). Grouping by guardian for display (sorting siblings adjacently, or visually merging the guardian-name/phone cells across sibling rows) is a query/rendering concern, not a data-model one — the underlying rows stay one-per-student regardless of how they're visually grouped.

### 3.4 — Column totals & basic reporting (who hasn't paid this month, total collected)
**Score: 2/10.** A `SUM ... GROUP BY month` query for totals; "who hasn't paid" is just "students with no row, or a null-amount row, for the selected month" — a straightforward `NOT EXISTS`/left-join query. No new concepts beyond what the ledger table already stores.

### 3.5 — Admin UI: the grid itself, and making it work on a phone
**Score: 5/10.** This is where essentially all the real effort in this module lives — covered in depth in §4 below. It's UI-only work (no backend blockers), but genuinely needs care: a 12-month-wide grid is wide by nature, and it needs to stay legible and editable on a small screen without turning into unreadable micro-text or forcing awkward pinch-zooming.

### 3.6 — Overall combined score for shipping this as a stable feature
**Score: 3/10 — small, and safe to ship.** Once the requirement is understood as "a ledger, not an invoicing system" (which is what was clarified above), this is one new table, a handful of straightforward endpoints, and a UI component — not a second billing engine. The only piece that carries real design weight is making the spreadsheet-shaped grid usable on a phone, which is a solvable, well-understood front-end problem (§4), not a data-model or business-logic risk. This is a much smaller, much safer piece of work than the invoicing-style module originally scoped in an earlier pass of this analysis.

---

## 4. Making the Excel-shaped grid work on a phone

The literal shape wanted — Student | Guardian | Phone | Jan…Dec, with a totals row — is a real, standard spreadsheet layout, and it's the right shape for an admin sitting at a desk reconciling a whole school's collections at once. The problem is exactly the one already flagged: 12 month columns plus 3 identity columns is wide, and a phone screen isn't. The fix is not to abandon the grid — it's to freeze what needs to stay visible and let the rest scroll, then swap to a different arrangement of the *same data* only on the smallest screens.

**Desktop / tablet (the primary admin-office view) — literal spreadsheet, with frozen identity columns:**
Student Name, Guardian Name, and Guardian Phone form a **sticky left block** (`position: sticky; left: 0`, stacked) that never scrolls out of view. The 12 month columns sit in their own horizontally-scrolling region (`overflow-x: auto`, contained — never letting the whole page scroll sideways, matching this app's general responsive convention). Each month column gets a fixed minimum width (enough for a 5-digit number, comfortably tappable). The totals row sticks to the bottom of the table (or repeats at the top) so it's visible without scrolling to the end. This is the direct implementation of the Excel-sheet layout that was asked for — nothing about it needs to be reinvented, only made scrollable instead of letting the browser force horizontal overflow on the whole page.

**Phone — same data, a narrower presentation, reachable by a view toggle:**
Below a chosen breakpoint, collapse the identity columns into a single compact header per row (student name, with guardian name + phone as a smaller second line underneath), and instead of 12 columns, show months as a short horizontal strip of tappable chips (Jan Feb Mar … ) that wrap or scroll within just that row — tapping a chip opens the amount for that month (editable inline or in a small sheet/modal). This keeps one student fully readable per screen-width, rather than shrinking 12 numeric columns down to unreadable text. It's the same underlying grid — just re-flowed per row instead of laid out as true columns, exactly the way responsive tables in this app already fall back to stacked cards elsewhere (the termly invoice's own mobile view already does this — `Fees/Invoices/Show.jsx`'s "Mobile Cards" section, current-structure audit §2.1, is a directly reusable precedent for this exact pattern in this exact codebase).

Both views read and write the same `monthly_fee_entries` rows — this is purely a rendering decision, not two different backends, so it adds UI work but no backend branching.

---

## 5. Net effort estimate

Assuming one full-stack Laravel/Inertia/React developer, familiar with this codebase:

| Piece | Estimate |
|---|---|
| `monthly_fee_entries` migration + model (`BelongsToSchool`) | 0.5 day |
| Controller: grid-read endpoint (year → all students × 12 months, with guardian info) + cell upsert endpoint | 1–1.5 days |
| Desktop grid UI: sticky identity columns, scrollable month columns, inline-editable cells, totals row | 2–3 days |
| Mobile fallback view: per-student stacked card with month chips (§4) | 1.5–2 days |
| Basic reporting: "who hasn't paid this month," month totals, simple export | 1 day |
| QA pass + a handful of feature tests for the upsert/uniqueness/totals logic (this module gives an easy opportunity to actually have test coverage, unlike the untested termly system — current-structure audit §7) | 1.5–2 days |
| **Total** | **~8–10 dev-days (roughly 1.5–2 weeks)** |

This is on top of, not instead of, the Super-Admin toggle work covered in `reports/super-admin-billing-mode-toggle.md` — that report covers how a school gets routed to this module instead of the termly one in the first place.
