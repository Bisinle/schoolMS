# Automatic Fee Payment — M-Pesa STK Push Integration

**Date:** 2026-09-08
**Scope:** Brainstorm + research on wiring M-Pesa STK Push ("Pay Here" → phone prompt → PIN → payment reconciled automatically) into both fee modes — the existing termly invoicing system and the new monthly ledger. Covers how Safaricom's Daraja API actually handles reconciliation (this directly answers the till-number/phone-mismatch concern raised), what's already half-built in this codebase, and the aggregator landscape (Pesapal, IntaSend, Paystack) as an alternative to integrating directly. Live web research was used for the parts of this report describing external M-Pesa/aggregator behavior — sources are linked throughout and at the bottom.

**Read alongside:**
- `reports/fee-management-current-structure-audit.md` — the existing `GuardianPayment`/`GuardianInvoice` model this needs to plug into for termly.
- `reports/monthly-fee-module-feasibility.md` — the `monthly_fee_entries` ledger this needs to plug into for monthly, with one required addition noted in §4 below.

---

## 1. The core question, answered directly: reconciliation does not depend on matching phone numbers

The worry — "the payer might use the father's phone, a sibling's phone, any number, not the one on file, and a till number has no field for them to type a guardian/school ID" — is a real limitation, but **it only applies to payments a parent makes independently, outside your system** (opening their own M-Pesa app and paying your till/paybill directly, unprompted). It does **not** apply to the flow actually being described: guardian taps **Pay Here** in the portal → your server initiates the STK push → PIN prompt appears on their phone.

That distinction matters because in the STK Push flow, **your server is the one calling Safaricom, not the parent** — and the field that identifies the transaction is not the phone number, it's an ID your server generates and controls:

1. Guardian taps **Pay Here**. The portal shows the amount owed (from `GuardianInvoice.balance_due` for termly, or the month's expected amount for monthly — see §4) and a phone number field pre-filled from `Guardian::getPhoneAttribute()` (already exists — falls back from the linked `User.phone` to `Guardian.phone_number`), editable exactly as described.
2. Your server calls Safaricom's **STK Push (`/mpesa/stkpush/v1/processrequest`)** endpoint with that phone number, the amount, and an `AccountReference` — a short (≤12 character) label your server chooses, shown on the guardian's PIN-prompt screen. This is a value **you** supply server-side; the guardian never types anything for it. Whether your shortcode is a Paybill or a Till, this call works the same way (`TransactionType` is `CustomerPayBillOnline` for Paybill, `CustomerBuyGoodsOnline` for Till — the `AccountReference` field exists on both).
3. Safaricom responds **synchronously, immediately** — before the guardian has even entered their PIN — with a `CheckoutRequestID` and `MerchantRequestID`. **This is the reconciliation key.** Your server stores a row right here: `{checkout_request_id, guardian_id, amount, what_theyre_paying_for}` — tied to the guardian by the ID your system already knows, not by whatever phone number ends up completing the payment.
4. Safaricom then calls your **callback URL** once the guardian enters their PIN (success or failure), and that callback payload is keyed by the same `CheckoutRequestID`. Your server looks up the row you created in step 3 by that ID, marks it complete, and records payment against the correct guardian — regardless of which phone number actually paid. The phone number M-Pesa reports back is worth storing for the audit trail ("paid via 07XX — a different number from the one on file"), but it is never used to *identify* who paid.

So the exact scenario described — "number 123 is registered, but they pay from 456, it's alright, I take that payment and reconcile it with the guardian ID" — is precisely how STK Push reconciliation is supposed to work, and it requires no clever workaround on your part. **Which number actually completes the payment is irrelevant to reconciliation**, because you never identify the payer by phone number in the first place — you identify the *request* you made, by an ID Safaricom itself hands you before the guardian even sees the prompt.

Till-vs-Paybill genuinely only matters for a second, separate scenario: **a guardian paying independently, without using your portal's Pay Here button at all** — e.g. they've saved your till/paybill number in their own M-Pesa favorites and pay directly. There, a Paybill lets them type an account reference (their name, a guardian ID) that your system can try to match against later; a Till has no such field, so an unprompted till payment arrives with no way to identify the payer beyond the amount and a name that comes from the payer's own registered M-Pesa name — not something your system controls or can rely on. If accepting these "off-portal" payments matters at all (worth asking, not assuming), recommend registering a **Paybill**, not a Till, specifically to keep that door open — Paybill is also the conventional choice for schools/institutions in Kenya generally, versus Till being aimed at retail point-of-sale.

*Sources: [django-daraja STK Push docs](https://django-daraja.readthedocs.io/en/latest/pages/apis/stk_push.html), [Mark Aloo — Integrating M-Pesa Express/STK the right way](https://medium.com/codeinfluence/integrating-payments-with-lipa-na-m-pesa-online-m-pesa-express-stk-push-api-the-right-way-3ded1166d452), [Paybill vs Till differences](https://helloduty.com/blogs/what-is-the-difference-between-buygoods-and-paybill), [Nashthuo — Paybill vs Till](https://nashthuo.com/mpesa-paybill-vs-till/).*

---

## 2. Reliability: the callback alone is not enough

Independent research on this specifically (not just theory) confirms something worth planning for up front: **neither the callback nor Safaricom's own status-check API is 100% reliable.** Callbacks can fail to arrive if Safaricom is under load or your server was briefly unreachable at the moment it tried to deliver; Daraja retries a limited number of times and then gives up silently.

The documented mitigation, and the recommended design here:
- Treat every STK initiation as **`pending`** the moment you get a `CheckoutRequestID` back (§1 step 3).
- Run a background check (a queued job, delayed 3–5 minutes) that calls the **STK Push Query API** (`/mpesa/stkpushquery/v1/query`) for any transaction still `pending` past that window, to catch the cases where the callback never arrived.
- Make callback handling **idempotent** — if a `CheckoutRequestID` you've already marked `success` gets a second callback (Safaricom retries deliveries), recognize it's already processed and return `200` without double-recording a payment. This matters a lot here specifically because `GuardianPayment`'s save hook (`GuardianPayment.php:50-62`) recalculates the whole invoice on every insert — a duplicate payment row would double-count.

*Source: [M-Pesa Transaction Reconciliation guide](https://www.mctaba.com/learn/mpesa/transaction-reconciliation).*

---

## 3. What already exists in this codebase — and why it needs a rewrite, not a patch

`app/Http/Controllers/MpesaController.php` is a genuine attempt at this that was abandoned mid-way. Read in full, it has several serious problems beyond "incomplete":

- **`AccountReference` is hardcoded to a fixed string** (`"Simon's Tech School Payment"`, `MpesaController.php:75`) — every payment, from every guardian, would show the identical label. This is the literal version of the reconciliation gap described — but it's a bug in this specific unfinished code, not a limitation of STK Push itself (§1 shows the fix: pass a `guardian_id`/`invoice_id`-derived reference instead of a constant).
- **The shortcode and passkey are hardcoded** (`174379` and a passkey string at `MpesaController.php:20-21` — these happen to be Safaricom's well-known public *sandbox* test values, not a real production paybill, but hardcoding them at all means there's no path to switching to a real production shortcode without editing source).
- **The callback URL is a dead, expired ngrok tunnel** (`MpesaController.php:74`) — not reachable, and even if it were, the registered route for it calls a method that doesn't exist:
- **The callback handler is entirely unimplemented.** `routes/api.php:33` registers `POST /stk/push/callback/url` → `MpesaController::MpesaRes`, but `MpesaRes()` exists only as a **commented-out** stub (`MpesaController.php:93-100`). Calling this route today would throw a "method does not exist" error. The separate `confirm()` method (`:102-107`) is also just comments describing what it should do — no logic at all.
- **The STK initiation response is thrown away.** `stkPush()` calls `curl_exec()` and immediately discards the result (`MpesaController.php:89-90`) — the `CheckoutRequestID` that §1 depends on for reconciliation is never captured or stored anywhere. There is no `MpesaTransaction` table (a commented-out `use App\MpesaTransaction;` at the top of the file, `:11`, shows one was once planned, but the model was never created).
- **The routes are completely unauthenticated.** All four M-Pesa routes sit in `routes/api.php` with zero middleware (`routes/api.php:30-33`) — no login required, no CSRF, no guardian-ownership check. `stkPush()` reads `user`, `amount`, and `phone` straight off an unvalidated request body — as it stands today, anyone on the internet could hit `POST /api/mpesa/stk/push` and trigger a real STK prompt (charging a real amount) to any phone number they supply, with no relationship to this system's guardians or invoices at all.

**Recommendation: treat this file as a reference for "the shape of a Daraja call in this stack," not a starting point to extend.** None of its five problems are quick patches — they're the entire feature (persistence, auth, real reconciliation, real callback handling) simply not having been built yet. A rewrite should keep the general idea (Laravel's `Http` facade already used correctly in `newAccessToken()`) but discard the rest.

---

## 4. One required addition to the monthly ledger: an "amount owed" needs to exist before payment

`reports/monthly-fee-module-feasibility.md` deliberately designed the monthly ledger as retrospective — an admin fills in a cell *after* money changes hands; there's no concept of "amount currently due" sitting in the system beforehand. That works fine for manual entry, but it doesn't work for a guardian-facing **Pay Here** button: the portal needs *something* to display as "you owe X this month" and to pre-fill into the STK amount field, before any payment has happened.

This is a small, contained addition, not a redesign: when an admin does the "generate a new month" action described, that action should **carry forward an expected amount per student** — either the same amount as their most recent recorded month, or a per-student standing monthly figure set once (an obvious small addition to `monthly_fee_entries`: distinguish an `expected_amount` set at month-open from the `amount` actually recorded once paid, rather than reusing one column for both meanings). Concretely:

- `monthly_fee_entries` gains a status distinction: a row can exist in an **unpaid/due** state (an `expected_amount` was set by the "generate new month" action, `amount` is still null) or a **paid** state (`amount` set, either by an admin typing it manually — unchanged from report 2 — or by a successful M-Pesa payment).
- The guardian portal, for a monthly-mode school, shows whatever `expected_amount` is currently due and unpaid, with **Pay Here** next to it — same button, same STK flow, same phone-prefill/edit, same reconciliation mechanics as §1.
- On a successful STK payment, the reconciliation adapter (§5) fills in that same row's `amount` (and `paid_date`), exactly mirroring what an admin manually typing the number into that cell would have done — the ledger's shape from report 2 doesn't change, it just also gets written by a second, automated path in addition to the manual one.

This doesn't change report 2's cost estimate meaningfully (it's a couple of extra columns and one small piece of "generate new month" logic that didn't strictly need to exist for manual-only use) — it's called out here because it's a genuine dependency: **the Pay Here button cannot work for the monthly module until this exists**, since there would otherwise be nothing for the guardian to see or pay against.

---

## 5. Recommended shape: one payment engine, two thin adapters

Both fee modes already reduce to the same underlying question — "how much does this guardian currently owe, and where does a successful payment get recorded" — so the STK integration should be built **once**, not twice:

**New table, `mpesa_transactions`** (`BelongsToSchool`-scoped): `guardian_id`, `payable_type` + `payable_id` (polymorphic — points at either a `GuardianInvoice` for termly or the relevant `monthly_fee_entries` row for monthly), `amount_requested`, `phone_number_used`, `checkout_request_id`, `merchant_request_id`, `status` (`initiated` → `pending` → `success`/`failed`/`cancelled`), `mpesa_receipt_number`, `result_desc`, timestamps. This is the table the abandoned `MpesaController` was clearly reaching for with its commented-out `MpesaTransaction` reference (§3).

**One `MpesaPaymentService`**, mirroring how `InvoiceGenerationService` is the single place termly invoices get built:
- `initiate(Guardian $guardian, Payable $target, float $amount, string $phone)` — calls Daraja, stores the `mpesa_transactions` row from the synchronous `CheckoutRequestID` response (§1 step 3).
- `handleCallback($payload)` — looks up the row by `CheckoutRequestID`, applies the idempotency check (§2), and on success calls one of two small, mode-specific adapters:
  - **Termly adapter:** creates a `GuardianPayment` row exactly as `PaymentController::store()` does today (`PaymentController.php:63-73`) — this means the existing `recalculateTotals()` boot-hook chain (current-structure audit §3) needs zero changes; an M-Pesa-sourced payment looks identical to a manually-recorded one from the invoice's point of view.
  - **Monthly adapter:** fills in the matching `monthly_fee_entries` row's `amount`/`paid_date` (§4) — identical in effect to an admin typing the number into that cell by hand.

This keeps the actual Daraja integration — the genuinely fiddly, security-sensitive part (OAuth token handling, idempotent callbacks, the query-polling fallback) — as one piece of code, regardless of which fee mode a school is on, and keeps each fee mode's own data model exactly as already designed in the other two reports.

**Guardian portal UI:** one `Pay Here` component, reused by both modes, since it's just "show an amount, show an editable phone field pre-filled from the guardian's number, POST to `initiate`, then show a pending/success/failed state" — the only thing that differs between termly and monthly is *what number gets shown* as owed, which is already a per-mode concern (`GuardianInvoice.balance_due` vs. the current month's `expected_amount`).

**Routing/security:** these routes must sit behind the same guardian-authenticated, ownership-checked middleware the rest of the guardian portal already uses (`routes/web.php:697` group, `permission:fees.view-own-invoices`) — not in the unauthenticated `routes/api.php` the current stub uses (§3). A guardian must only ever be able to initiate a payment against their **own** invoice/ledger row, verified server-side, not merely by what the frontend happens to display.

---

## 6. Build it directly on Daraja, or go through an aggregator?

Two real paths, and the reconciliation mechanics in §1 work identically either way — the choice is about who carries the integration/reliability burden, not about whether guardian-ID-based reconciliation is possible.

### Direct Daraja integration
Register your own Paybill (or Till) with Safaricom, get a Daraja app (consumer key/secret + passkey), and build exactly what §5 describes. **2026 context:** Daraja is now on version 3.0, described in current developer write-ups as a meaningfully smoother experience than the older API generations most existing tutorials (including likely whatever the abandoned `MpesaController` was written against) were built on — worth checking Safaricom's current Daraja 3.0 docs specifically rather than following an older guide verbatim. You own 100% of the transaction fee arrangement with Safaricom directly (a separate business/banking relationship, not a software cost), but you also own 100% of the reliability engineering (§2) and the security hardening (§3, §5).

### Aggregators — Pesapal, IntaSend, Paystack, iPay
These sit in front of Daraja (and often other rails — cards, bank transfers) behind one simplified API, in exchange for a per-transaction fee, and all of them support attaching your own reference/metadata at initiation, so §1's reconciliation design carries over unchanged regardless of which one is picked:

- **Pesapal** is worth evaluating first specifically because it already runs **"Schoolpay,"** a payment product purpose-built for Kenyan school fee collection — this is the one option here that isn't a generic payments API being adapted to schools, it's already shaped for exactly this problem, and would be worth a direct conversation with them before building anything custom.
- **IntaSend** offers M-Pesa Express STK Push specifically, with webhooks for status updates, and explicitly markets "accept M-Pesa via STK Push without applying for your own Paybill" — useful if getting a Paybill provisioned directly with Safaricom is a slow/blocking step.
- **Paystack** went live for all Kenyan merchants and supports M-Pesa as a payment channel (`mobile_money` channel, amounts in KES) alongside cards and Pesalink bank transfers — reasonable if there's any chance the school later wants card or bank-transfer payments (e.g. from a diaspora parent) through the same integration, since Paystack would cover all three without a second integration.
- **PayPal**, raised in the original question, is not a realistic fit here — it has no meaningful M-Pesa rail and isn't how Kenyan guardians would expect to pay by phone; it would only be relevant as a side option for a parent paying from outside Kenya by card/PayPal balance, not as the core solution.

*Sources: [Pesapal Schoolpay launch](https://www.businessdailyafrica.com/bd/corporate/technology/pesapal-launches-school-fees-payment-platform-1977264), [IntaSend M-Pesa API](https://intasend.com/mpesa-api/), [Paystack Pay with M-Pesa](https://support.paystack.com/en/articles/2128322), [Paystack live in Kenya](https://paystack.com/blog/company-news/kenya), [Paystack Kenya channels guide](https://www.mctaba.com/learn/paystack/payment-methods-available-on-paystack-in-kenya).*

**Recommendation:** talk to Pesapal about Schoolpay first, as a build-vs-buy comparison point, before committing engineering time to a direct Daraja integration — it may cover this entire report's scope (including the reconciliation design in §1, which any competent M-Pesa aggregator will already have solved) out of the box. If a direct integration is still preferred (more control, no per-transaction aggregator fee, or Pesapal doesn't fit some other requirement), §5's architecture is the recommended shape to build it in.

---

## 7. Effort estimate (if building directly, not via an aggregator)

Assuming one full-stack developer, and that a real production Paybill/Till and Daraja app credentials are already available (the business/compliance side of getting one from Safaricom is outside engineering effort and can take longer than the code):

| Piece | Estimate |
|---|---|
| `mpesa_transactions` table + `MpesaPaymentService` (OAuth token handling, STK initiation, idempotent callback handling) | 3–4 days |
| STK Query polling fallback job (§2) | 1 day |
| Termly adapter (`GuardianPayment` creation on success) | 0.5 day |
| Monthly adapter + the `expected_amount`/status addition to `monthly_fee_entries` (§4) | 1–1.5 days |
| Guardian portal "Pay Here" UI (phone prefill/edit, pending/success/failed states) — one shared component per §5 | 2 days |
| Security: move routes to authenticated/guardian-scoped middleware, env-driven credentials, remove the existing unauthenticated stub (§3) | 1 day |
| Sandbox-to-production cutover testing + basic automated tests around reconciliation idempotency (currently zero coverage anywhere in the fee module — current-structure audit §7) | 2–3 days |
| **Total** | **~11–13 dev-days (roughly 2–2.5 weeks)**, in addition to whichever of the termly or monthly modules it's layered onto. |

If an aggregator (Pesapal Schoolpay in particular) turns out to cover this well, most of the above collapses into integrating their SDK/webhook instead of building the Daraja plumbing directly — likely **3–5 dev-days** instead, at the cost of a per-transaction fee and less control over the flow.

---

## Sources

- [django-daraja — STK Push API docs](https://django-daraja.readthedocs.io/en/latest/pages/apis/stk_push.html)
- [Mark Aloo — Integrating M-Pesa Express (STK Push) the right way](https://medium.com/codeinfluence/integrating-payments-with-lipa-na-m-pesa-online-m-pesa-express-stk-push-api-the-right-way-3ded1166d452)
- [HelloDuty — Paybill vs Buy Goods (Till) differences](https://helloduty.com/blogs/what-is-the-difference-between-buygoods-and-paybill)
- [Nashthuo — M-Pesa Pay Bill vs Till Number](https://nashthuo.com/mpesa-paybill-vs-till/)
- [M-Pesa Transaction Reconciliation guide](https://www.mctaba.com/learn/mpesa/transaction-reconciliation)
- [STK Push Timeout Handling compared across providers](https://www.mctaba.com/learn/paystack/m-pesa-stk-push-timeout-handling-compared-across-providers)
- [Pesapal launches school fees payment platform — Business Daily](https://www.businessdailyafrica.com/bd/corporate/technology/pesapal-launches-school-fees-payment-platform-1977264)
- [IntaSend — M-Pesa API Integration](https://intasend.com/mpesa-api/)
- [Paystack — Pay with M-Pesa](https://support.paystack.com/en/articles/2128322)
- [Paystack is live for all merchants in Kenya](https://paystack.com/blog/company-news/kenya)
- [Paystack Kenya — payment methods guide](https://www.mctaba.com/learn/paystack/payment-methods-available-on-paystack-in-kenya)
