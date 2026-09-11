# Monthly Fees — Holiday Months Design Spec

## Context

Some schools using the Monthly Fees module have recurring months where no teaching happens at all — a summer break, for example — and correspondingly no fee is expected or collected for that month. Today the module has no concept of this: every month `syncMonth()` opens gets a real `expected_amount` derived from the guardian's standing rate, and if that rate happens to be zero, the entry's status computes to `'needs_fee'` (a red "Set fee" alert) — the system currently has no way to distinguish "nobody configured this guardian's fee yet" from "this month is legitimately fee-free by design."

This spec adds a per-school, per-guardian-independent "holiday months" configuration: a set of calendar month numbers (1–12) a school's admin marks as fee-free, recurring every year. When `syncMonth()` opens a designated holiday month, every guardian's entry for that month is created with zero expected amount and a distinct `'holiday'` status — never treated as a data gap, never consuming prepaid credit.

## Confirmed decisions (from brainstorming)

- **Configuration shape:** a fixed, recurring set of month numbers per school (e.g. `[7, 8]`), not explicit per-year date ranges. Re-used every year automatically; a school updates the set only when its own calendar actually changes.
- **Months need not be contiguous.** A school with holidays in April, August, November, and December is exactly as valid as one with a single contiguous July–August block. The configuration UI (a checkbox per month, Jan–Dec) supports this natively — there's no "start/end" range constraint anywhere in this design.
- **Partial/mid-month holidays are explicitly out of scope.** Confirmed directly: schools never actually hold classes for part of a month and skip billing for that period — if real teaching happened, the fee is always collected for it. A "holiday month" is therefore always a whole, clean month with zero teaching days. No day-level or proration logic is needed anywhere in this design.
- **Ledger mechanics:** a holiday month still gets a real `MonthlyFeeEntry` for every guardian (not skipped) — this keeps `latestMonth()`, prev/next browsing, and the month sequence itself exactly as simple and continuous as it is today. The entry is just flagged, with `expected_amount = 0` and a new `is_holiday` boolean set permanently at creation time (never recomputed later, so a school changing its holiday configuration afterward doesn't retroactively rewrite what a past month actually was).
- **Credit consumption must skip holiday months.** `syncMonth()`'s existing auto-consumption step (spending a guardian's prepaid `credit_balance` against the new month's `expected_amount`) must not run at all for a holiday-month entry — there's nothing real to consume credit against, and doing so would silently waste a guardian's real prepaid balance.
- **Arrears/outstanding-balance math needs no changes.** A holiday month's `expected_amount` is genuinely `0`, so it naturally contributes nothing to any existing shortfall sum without any special-casing.
- **"Record Payment" stays fully available on a holiday-month row.** A guardian who pays during the holiday is simply prepaying — it becomes ordinary credit, consumed automatically the moment the next real (non-holiday) month opens. No new code path is needed for this; it already works exactly like paying ahead for any future month.
- **Who configures it:** the school's own admin, via a new control on the Monthly Fees page itself — not the super admin, and not the Create/Edit School screens. This is the school's own calendar, and super admins shouldn't need to hand-configure it for every school they manage.
- **Not integrated with `AcademicYear`/`AcademicTerm`.** Investigated directly: those models are the termly fee module's own backbone (explicit per-year date ranges, heavily consumed by `TuitionFeeController`/`InvoiceController`/etc.), have no holiday/break concept of their own (only an *implicit, unlabeled* gap between term dates that would need inference, not lookup), and — per the just-shipped fee-module toggle — only exist meaningfully for `fee_module: 'termly'` schools. A `fee_module: 'monthly'` school has no reason to ever touch them. Holiday months are built as their own simple, separate setting.

## Data model

### `schools` gets one new column

```php
$table->json('holiday_months')->nullable();
```

Stores a JSON array of integers 1–12 (e.g. `[7, 8]`), or `null`/absent meaning "no holiday months configured — every month is billed normally," matching today's behavior exactly for every existing school with no migration backfill needed.

### `monthly_fee_entries` gets one new column

```php
$table->boolean('is_holiday')->default(false);
```

Set once, by `syncMonth()`, at the moment the entry is created. Never updated afterward by any other code path.

## Backend logic

### `MonthlyFeeLedgerService::syncMonth()`

Currently (verified against the live file, `app/Services/MonthlyFeeLedgerService.php`), the per-guardian loop:
1. Looks up the guardian's `MonthlyFeeSetting` (locked), computes `expectedAmount` from `expected_fee`.
2. Creates the `MonthlyFeeEntry` with that `expectedAmount`.
3. If the guardian has `credit_balance` available, auto-consumes `min(creditBalance, expectedAmount)` against the new entry.

This changes to: before step 1's `expectedAmount` computation, check whether `$month` is present in the school's `holiday_months` array. If so:
- Create the entry with `expected_amount = 0` and `is_holiday = true`.
- Skip the credit-consumption step entirely for this entry (steps depending on `expectedAmount` never run) — the guardian's `credit_balance` is left completely untouched.

If the month is not a holiday month, behavior is unchanged from today.

### `MonthlyFeeEntry::getStatusAttribute()`

Currently: `expected_amount <= 0` unconditionally returns `'needs_fee'`. This is checked **first**, before that check: if `is_holiday` is true, return the new status `'holiday'` immediately, regardless of `expected_amount`'s value. Every other branch (`unpaid`/`partial`/`paid`) is unchanged.

### `MonthlyFeeController` — new action

`updateHolidayMonths(Request $request)`: validates `holiday_months` as an array of integers each `between:1,12`, persists it onto the acting admin's own school (`$request->user()->school_id`), redirects back. Exposed as a new route `PUT /monthly-fees/holiday-months` → `monthly-fees.update-holiday-months`, inside the existing `fee-module:monthly`-gated route group (this setting is meaningless for a termly-module school and should never be reachable by one).

`index()` gains one new prop: `holidayMonths` — the acting school's current `holiday_months` array (or `[]` if unset), so the frontend settings control can render its current state.

## Frontend

### New "Holiday Months" control on the Monthly Fees page

A small button in the existing Toolbar area (next to "Open next month →"), opening a new modal (`HolidayMonthsModal.jsx`, built on the same `Modal.jsx` primitive already used by `RecordPaymentModal.jsx`) with 12 checkboxes, one per calendar month (January–December), pre-checked according to the `holidayMonths` prop. Saving submits the full new set to `monthly-fees.update-holiday-months`.

### Ledger display

A holiday-month row's status renders as a new "Holiday" badge (a distinct, neutral color — not the red "needs fee" styling, since nothing is wrong) instead of the current needs-fee/unpaid styling. The existing "Set fee"/red-alert treatment must not appear for a holiday row. "Record Payment" (the green plus button) remains visible and functional, unchanged.

## Testing

- `syncMonth()` on a designated holiday month creates every guardian's entry with `expected_amount = 0`, `is_holiday = true`, and does not touch `credit_balance` even when the guardian has credit available.
- `syncMonth()` on a non-holiday month is completely unaffected (regression guard against the new check accidentally firing when it shouldn't).
- A holiday-month entry's computed `status` is `'holiday'`, not `'needs_fee'`, even though `expected_amount` is `0`.
- A guardian with a real, non-zero `expected_fee` who is also configured with a holiday month still gets `is_holiday = true`/`expected_amount = 0` for that specific month — the holiday flag overrides the guardian's standing rate, it doesn't require the rate to already be zero.
- `recordPayment()` still works normally against a holiday-month entry (a guardian can still prepay during the holiday) and the resulting credit is correctly available and auto-consumed the next time a real (non-holiday) month opens.
- Outstanding-balance/arrears calculations correctly exclude a holiday month's zero shortfall — verified by an explicit regression test, not just reasoned about.
- `MonthlyFeeController::updateHolidayMonths()` persists a valid month set, rejects out-of-range values (e.g. `0`, `13`), and is unreachable (404) for a `fee_module: 'termly'` school, matching the existing `fee-module:monthly` gate.
- Non-contiguous month sets (e.g. `[4, 8, 11, 12]`) work identically to contiguous ones — no code path anywhere assumes a single start/end range.

## Out of scope

- Any annual/yearly rollup analytics — none exist in this module today; this spec only ensures the underlying data (`is_holiday`, `expected_amount = 0`) is correct so a future yearly report can exclude holiday months correctly, without designing that report itself.
- Partial/mid-month holidays and day-level proration — confirmed not a real scenario for this module's schools.
- Any change to the termly fee module or `AcademicYear`/`AcademicTerm` — this feature is Monthly Fees-only.
