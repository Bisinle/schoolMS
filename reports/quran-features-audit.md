# Quran Module — Feature Comparison

**Date:** 2026-08-21
**Scope:** Compares the 7 target features against what's actually implemented, per `reports/quran-functionality-audit.md`. Read-only; no redesign proposed here.

**Data source note:** the target feature set names `api.quran.com v4` (Quran Foundation Content API) as the confirmed data source going forward. Two clarifications from the audit worth flagging before scoring against it:
- The codebase currently has **two separate** integrations that could both be called "the Quran Foundation API": `QuranApiService` talks to `apis.quran.foundation` (the *authenticated* Quran Foundation Content API, currently broken — see `quran-module-audit.md`), while `QuranComApiClient` talks to the *public, unauthenticated* `api.quran.com` (same publisher, different host/product). If "api.quran.com v4" is the intended target, that's closer to the second integration, not the first — worth confirming which one you mean before any future work, since they have different auth models.
- Neither integration is currently used to fetch or display `text_uthmani` (Arabic verse text) for rendering — it's requested once, in one place, and discarded (§10 of the functionality audit).

---

## 1. Quran structure & source data (Arabic text, Juz/Hizb/page, via Quran Foundation Content API)

**⚠️ Partially implemented.**

- Page-level structure: ✅ present (`page_from`/`page_to`, 1–604, consistent numbering across both integrations).
- Juz: ⚠️ computed as a *derived count* (`juz_memorized`), not a selectable/stored structural unit — there's no `juz_from`/`juz_to`.
- Hizb: ❌ not present anywhere.
- Arabic text (Uthmani): ❌ not rendered anywhere. `text_uthmani` is fetched by `QuranComApiClient::getPageForAyah()` (`app/External/QuranComApiClient.php:151-153`) but only `page_number` is read from the response — the Arabic text itself is discarded. `QuranApiService::getVerseText()` (`app/Services/QuranApiService.php:428-434`) can return it but is unreachable today (constructor crash) and unused by any controller action or view.
- Translations/tafsir: ❌ not present in the app at all (confirmed absent from both `QuranApiService` and `QuranComApiClient` — neither exposes a translation/tafsir fetch path to any controller).

**Conflict with your description worth flagging:** you described `api.quran.com v4` as "our data source confirmed earlier" — that confirmation happened in a separate chat-only exploration of the `mcp.quran.ai` MCP server (which is itself backed by quran.com data), not a decision that's been implemented in the app. The app's actual working integration to that family of APIs is `QuranComApiClient`, and it is currently used **only** for juz/page-from-verse math — never for text, translations, or tafsir.

## 2. Page rendering (CDN images vs. reconstructed text/layout)

**✅ Already implemented — as CDN images, not reconstructed text.**

- Confirmed approach: static PNG images from `cdn.qurancdn.com/images/{quality}/page{NNN}.png`, implemented independently in `QuranApiService::getPageImageUrl()` (`app/Services/QuranApiService.php:110-127`) and again client-side in `PageImageViewer.jsx::getImageUrl()` (`resources/js/Pages/Quran/Shared/PageImageViewer.jsx:51-63`).
- Tradeoffs, as currently built:
  - *Pro:* zero rendering work, exact visual fidelity to the printed Mushaf, no font/shaping concerns.
  - *Con:* the image is an opaque bitmap — no selectable text, no highlighting a specific ayah on the page, no accessibility (screen readers), no search-within-page, and it depends on an external CDN staying up with no fallback if it's unreachable.
  - *Con:* the URL-building logic is duplicated (backend + frontend) rather than served from one source — a maintenance/drift risk already present today, independent of any future redesign.
- Reconstructed text/HTML layout matching the 604-page Mushaf: not implemented anywhere.

## 3. Assignments with partial-page precision (e.g. "pages 1–2.5")

**⚠️ Partially implemented — whole assignments exist, fractional precision does not.**

- ✅ Teacher-to-student assignment exists: `QuranHomework` (`app/Models/QuranHomework.php`), created via `QuranHomeworkController::store()`, with surah/verse range, optional page range, due date, and instructions.
- ❌ Partial-page precision: `page_from`/`page_to` are SQL `integer` columns on both `quran_tracking` and `quran_homework` (confirmed in both migrations) — there is no decimal/fractional page column or half-page concept anywhere in the schema, models, or validation rules. "Pages 1–2.5" as described is not representable today; the closest available precision is a whole page, or a verse-level range within a page (`verse_from`/`verse_to`), which is finer-grained than half-pages but isn't the same unit you described.

## 4. Parent visibility of assignments (current/past)

**⚠️ Partially implemented — backend allows it, but there's no way for a parent to reach it.**

- Route-level access exists: `quran-homework.show` and `quran-homework.student` are both open to the `guardian` role (`routes/web.php`, Quran Homework read-only group).
- But `resources/js/Config/navigation.js` guardian submenu (lines ~148–157) has no "Homework" entry — only Dashboard, Tracking, and Home Practice are linked. A guardian has no in-app path to browse their child's homework; the route only works if reached by a direct URL they don't have a link to.
- Separately, and worth flagging on its own: `QuranHomeworkController`'s `show`/`student` actions have no ownership or school check (documented in `quran-module-audit.md` §16) — so even once reachable, the authorization behind this feature doesn't verify the homework/student actually belongs to that guardian's own child. This isn't a features-audit finding so much as a pre-existing gap that any UI fix for this item would be built on top of.
- What guardians *can* currently see for certain: their child's tracking session history, via the dedicated `GuardianQuranTrackingController` (`/guardian/quran-tracking`, correctly linked in nav) — but tracking sessions are teacher-logged completed work, not forward-looking assignments.

## 5. Progress tracking (pages studied/memorized over time)

**✅ Already implemented.** `QuranTrackingObserver` (`app/Observers/QuranTrackingObserver.php`) computes `pages_memorized`, `surahs_memorized`, `juz_memorized` per session via `QuranTrackingCalculator` (`app/Services/QuranTrackingCalculator.php`) on every `QuranTracking` create/update. `QuranTrackingController::studentReport()` and `QuranController::index()` both aggregate these over time (totals, monthly trend charts). `QuranSchedule::getProgressPercentageAttribute()`/`getCurrentProgressAttribute()` separately track progress against a pace target. Guardians see their own child's history via `GuardianQuranTrackingController`.

## 6. Circular/rotation group reading (halaqah-style turn-taking)

**❌ Not implemented.** Confirmed by a repo-wide grep across `app/`, `resources/`, and `database/` for `halaqah`, `halqa`, `rotation`, `circular`, `sabaq`, and `maqra` — no matches relate to this feature (the few hits that exist are unrelated: code comments about circular DB references, day-of-week rotation in the timetable generator, and CSS chevron rotation). The only codebase terminology anywhere near this concept is the `subac`/`subac_participation` field on `QuranTracking` — but that's a boolean flag on one student's one session row, not a multi-student group/turn-taking construct, and there's no schema support for grouping multiple students into one session or sequencing turns.

## 7. Teacher review/grading per student page

**⚠️ Partially implemented — grading exists, but scoped to a session, not a page or an assignment.**

- ✅ `QuranAssessment` (`app/Models/QuranAssessment.php`) lets a teacher rate `fluency_rating`/`tajweed_rating` (1–5), `mistakes_count`, and free-text notes, created/updated inline in `QuranTrackingController::store()`/`update()` (`app/Http/Controllers/QuranTrackingController.php:203-219`, `370-393`).
- ⚠️ Gap vs. your description ("completed pages per student and assign a grade to each"): grading is 1:1 with a `QuranTracking` **session** (`hasOne`), not with a page or a `QuranHomework` assignment. A teacher can't currently pull up "all completed pages for Student X" and grade each page independently — they see and grade sessions, and a session's page range is whatever the teacher logged, not a fixed page-by-page unit. `studentReport()` does aggregate assessment analytics (avg fluency/tajweed/mistakes) across a student's sessions, which is close to a review view but isn't page-indexed.

---

## Summary Table

| # | Feature | Status | Key gap |
|---|---|---|---|
| 1 | Structure & source data (Arabic/Juz/Hizb/page) | ⚠️ | No Hizb, no Arabic text rendered, no translations/tafsir; juz is derived-only |
| 2 | Page rendering | ✅ (images) | Not reconstructed text; duplicated URL logic backend+frontend |
| 3 | Assignments w/ partial-page precision | ⚠️ | Assignment exists; no fractional page precision (int columns only) |
| 4 | Parent visibility of assignments | ⚠️ | Route allows it; no nav link; no ownership check behind it |
| 5 | Progress tracking | ✅ | — |
| 6 | Circular/rotation group reading | ❌ | No terminology, schema, or logic found anywhere |
| 7 | Teacher review/grading per page | ⚠️ | Grading exists per-session, not per-page or per-assignment |
