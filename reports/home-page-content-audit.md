# Home Page Content Audit

**Date:** 2026-08-29
**Scope:** `resources/js/Pages/Home.jsx` (public landing page) and directly related shared files (`resources/views/app.blade.php`, `public/robots.txt`). Report only — no code was changed as part of this audit.

---

## High — factual inaccuracies (customer-facing claims that don't match the code)

### 1. "Accountant" role doesn't exist

`resources/js/Pages/Home.jsx:95` — Teacher & Staff Management copy says "manage user accounts with role-based access (Admin, Teacher, Guardian, Accountant, etc.)". The actual role enum (`app/Enums/UserRole.php`) has exactly four roles: `super_admin`, `admin`, `teacher`, `guardian`. There is no Accountant role anywhere in the system.

### 2. "M-Pesa Integrated" overstates what's actually built

Appears twice: hero trust-badge (`Home.jsx:269`) and pricing feature list, "Multi-Payment Methods: Cash, M-Pesa, Bank Transfer, Cheque" (`Home.jsx:132`). Checked `app/Http/Controllers/MpesaController.php` directly:

- It calls Safaricom's **sandbox** endpoint (`sandbox.safaricom.co.ke`), not production.
- The passkey and business shortcode (`174379`) are hardcoded — and they're Safaricom's own publicly-documented test/sandbox values, used in virtually every Daraja API tutorial.
- No `MPESA_CONSUMER_KEY`/`MPESA_CONSUMER_SECRET` are even defined in `.env.example`.
- `payment_method` on `guardian_payments` includes `'mpesa'`, but that's just a manual dropdown tag an admin picks when logging a payment that happened *outside* the app — there's no in-app M-Pesa checkout (STK push) actually wired up to fee payment.

"M-Pesa Integrated" as a trust badge implies a working in-app payment gateway. What exists is a disconnected sandbox controller plus a manual record-keeping label.

### 3. Site-wide meta description contradicts the page's own positioning

`resources/views/app.blade.php`: `<meta name="description" content="Complete school management solution for Islamic schools following CBC curriculum">`. This is what shows in Google results and social previews. But Home.jsx's own hero explicitly says the product is "built for both regular schools and madrasahs" and mentions CBC/IGCSE only as *examples* of supported curricula, not the only one. The site's search-engine snippet undersells and mischaracterizes the product it's advertising.

---

## Medium — UX/clarity issues

### 4. Hero "Get Started" → `/login`, but there's no self-registration

`Home.jsx:253-259`. Per the Terms of Service and `CLAUDE.md`, accounts are admin-provisioned only — no signup flow exists. A brand-new prospect clicking the primary CTA lands on a login form they have no credentials for. Consider pointing it at `/demo-booking` instead, or relabeling it for existing customers.

### 5. Two pricing buttons, one destination

`Home.jsx:566-577` — "Buy Now" and "Request a Demo" both link to `/demo-booking`. There's no self-serve checkout, so "Buy Now" promises something that doesn't happen when clicked. Consider consolidating to a single CTA or relabeling "Buy Now" to something accurate.

### 6. No path to contact the company outside of booking a demo

Nav's "Contact" link (`Home.jsx:205`) goes straight to the demo-booking form. There's no support/contact email visible anywhere on the public pages — `info@school-ms.com` only appears inside the Privacy Policy/Terms legal text. An existing customer with a billing or support question has nowhere to go.

### 7. "Quran Tracking (Islamic Schools)" module label is broader than what the code actually gates

`Home.jsx:109`. Per `CheckMadrasahSchool` middleware and `CLAUDE.md`, the Quran module is restricted specifically to `school_type === 'madrasah'` — not the wider `islamic_school` type. An `islamic_school`-type prospect could reasonably expect Quran tracking based on this copy and not get it.

### 8. Pricing math likely surprises real customers

`Home.jsx:550-551` — "up to 50 active users (students · teachers · admin · staff · parents)" under the "Simple, transparent pricing" banner. Counting *students* against the 50-user cap means almost any real school blows past it immediately (a school with 200 students alone is already 150 users over, at +KES 100/user = +KES 15,000/month on top of the advertised KES 5,000). The headline price is likely to look misleading once a prospect does the math on the demo call. Worth either a worked example on the page or softer framing.

### 9. Minor internal tension

The demo-CTA section promises "Custom pricing and implementation timeline discussion" (`Home.jsx:635`) right below a page that already publishes a fixed flat rate under "Simple, transparent pricing." Likely leftover generic template copy — worth tightening for consistency.

---

## Low — polish / SEO

### 10. No Open Graph / Twitter Card tags

In `app.blade.php`. Links shared on WhatsApp (a very likely sharing channel for this market) show no title/description/image preview at all.

### 11. No `sitemap.xml`

`robots.txt` doesn't reference one either. Minor for a small site, not urgent.

### 12. Privacy Policy doesn't mention cookies

The app sets a session cookie + XSRF-TOKEN cookie, and uses `localStorage`/service-worker caching for the PWA. Worth a short disclosure line.

### 13. Mobile nav hamburger button has no `aria-label`

`Home.jsx:214` — icon-only, minor accessibility nit for screen readers.

---

## Pages that don't exist yet but arguably should

- **Contact/Support page** (or at minimum a visible support email in the footer) — right now the only contact path for anyone, existing customer or not, is the demo-booking form.
- **FAQ page** — would pre-answer common questions (data isolation between schools, contract terms, what happens if a school account is deactivated, cancellation/refunds) and reduce demo-request friction.
- **About/Company page** *(optional)* — schools entrusting student data to a vendor often want to know who's behind it; not required but builds trust.
- **Dedicated Security/Data-Protection page** *(optional)* — the Privacy Policy covers this, but a short standalone page reinforcing the multi-tenant isolation model could help close deals with security-conscious school administrators.
- **A worked pricing example** — not necessarily a new page, but tied to finding #8 above: showing "a school with 120 students + 10 staff pays X/month" would set expectations honestly upfront.
