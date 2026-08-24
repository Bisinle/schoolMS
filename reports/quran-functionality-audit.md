# Quran Module — Functionality Audit

**Date:** 2026-08-21
**Scope:** Full inventory of what currently exists in the Quran module — data models, API integrations, structural units, assignment/tracking/grading logic, role-facing views, and group/rotation-reading support. Read-only investigation; no code was changed to produce this report.

**Related report:** `reports/quran-module-audit.md` covers a separate investigation into why every Quran route returns a 500 in production (root cause: `QuranApiService` constructor crash from missing `QURAN_API_CLIENT_ID`/`QURAN_API_CLIENT_SECRET` env vars). This report does not re-derive those findings but references them where an operational bug affects a feature described below.

---

## 1. Data Models

| Model | Table | Purpose | Key fields |
|---|---|---|---|
| `QuranTracking` | `quran_tracking` | One row per reading/memorization session logged by a teacher | `student_id`, `teacher_id`, `school_id`, `date`, `reading_type` (enum: `new_learning`, `revision`, `subac`), `surah_from`, `surah_to`, `verse_from`, `verse_to`, `page_from`/`page_to` (nullable int), `difficulty` (enum: `very_well`, `middle`, `difficult`), `pages_memorized`, `surahs_memorized`, `juz_memorized` (all computed), `subac_participation` (bool), `notes` |
| `QuranHomework` | `quran_homework` | Teacher-assigned homework/portion for a student | `student_id`, `teacher_id`, `school_id`, `assigned_date`, `due_date`, `homework_type` (enum: `memorize`, `revise`, `read`), `surah_from`/`surah_to`, `verse_from`/`verse_to`, `page_from`/`page_to` (all int, `page_*` nullable), `completed`, `completion_date`, `teacher_instructions`, `completion_notes` |
| `QuranSchedule` | `quran_schedules` | Recurring target-pace schedule per student (not a specific assignment — a rate target) | `student_id`, `teacher_id`, `school_id`, `schedule_type` (`daily`/`weekly`/`monthly`), `target_pages_per_period`, `target_verses_per_period`, `start_date`, `expected_completion_date`, `target_total_pages`, `is_active` (only one active schedule per student, enforced in model `boot()`), `notes` |
| `QuranHomePractice` | `quran_home_practice` | Guardian-logged practice sessions done at home (parent self-reports, not teacher-assigned) | (not re-read in this pass; see `reports/quran-module-audit.md` §6 for full field list — unchanged since that audit) |
| `QuranAssessment` | `quran_assessments` | Teacher's grading of a single `QuranTracking` session (`hasOne` on tracking, not a standalone gradebook) | `quran_tracking_id`, `fluency_rating` (1–5), `tajweed_rating` (1–5), `mistakes_count`, `assessment_notes`. Computed: `average_rating` (mean of the two ratings), `performance_level` (Excellent/Very Good/Good/Fair/Needs Improvement banding) |

**Relationships:** `Student` has `quranTracking()`, `quranHomework()`, `pendingQuranHomework()`, `quranHomePractice()`, `quranSchedules()`, `activeQuranSchedule()`. `Guardian` has `quranHomePractice()` only. `QuranTracking` has `hasOne(QuranAssessment)`.

Only `QuranTracking` uses the `BelongsToSchool` trait (auto school-scoping); the other four models do not — a pre-existing cross-tenant access gap documented in `reports/quran-module-audit.md` §16, unrelated to feature completeness.

---

## 2. API Integrations

Two independent external integrations exist, confirmed unchanged from the prior audit:

1. **`app/Services/QuranApiService.php`** — talks to the Quran Foundation API (`oauth2.quran.foundation` for OAuth2 client-credentials tokens, `apis.quran.foundation/content/api/v4` for content). Currently **fatal on construction** in production because `QURAN_API_CLIENT_ID`/`QURAN_API_CLIENT_SECRET` env vars are unset (non-nullable typed properties assigned `null`). Injected into `QuranTrackingController`, `QuranHomeworkController`, `QuranHomePracticeController` constructors — this is what makes those three controllers 500 on every action. See `reports/quran-module-audit.md` for the full trace.
2. **`app/External/QuranComApiClient.php`** (implements `QuranApiClient` interface, bound in `AppServiceProvider`) — talks to the public, unauthenticated `api.quran.com/api/v4`. Used internally by `QuranTrackingCalculator` to compute juz coverage and derive pages from verses. Every call uses `Http::timeout(10)` and falls back to a hardcoded 30-entry juz table on failure. Not directly exposed to controllers/views.

Both integrations return/consume **the same 604-page Mushaf page-numbering convention** — confirmed by cross-checking a fixed known reference point (juz 1 = pages 1–21) against both the app's hardcoded fallback table and an independent source during a separate session.

---

## 3. Structural Units Actually Used (verbatim from code, not assumed)

| Unit | Present? | Where |
|---|---|---|
| Surah (`surah_from`/`surah_to`) | ✅ | `quran_tracking`, `quran_homework` |
| Ayah/verse (`verse_from`/`verse_to`) | ✅ | `quran_tracking`, `quran_homework` |
| Page (`page_from`/`page_to`, 1–604, nullable, integer only) | ✅ | `quran_tracking`, `quran_homework` |
| Juz | ⚠️ Computed only — `juz_memorized` is a derived count column on `quran_tracking`; there is no `juz_from`/`juz_to` or juz-scoped assignment anywhere. `QuranTrackingCalculator::computeJuzByPages()` counts how many juz a page range overlaps. |
| Hizb | ❌ Not present anywhere in the schema, models, controllers, or views. |
| "Maqra" | ❌ Term does not appear anywhere in the codebase (grepped `app/`, `resources/`, `database/`). |
| Reading-type classification | ✅ enum `reading_type`: `new_learning`, `revision`, `subac` — this exact spelling (`subac`, not "sabaq") is what's in the migration, model, and frontend constants (`resources/js/Utils/constants.js`). Labeled "Subac" in the UI. Paired with a separate boolean `subac_participation` field on the same row. |
| Difficulty | ✅ enum `difficulty`: `very_well`, `middle`, `difficult` |

**Halaqah / circular / rotation / sabaq / maqra:** none of these terms appear anywhere in the codebase (repo-wide grep, app + resources + database). The closest related term is `subac`/`subac_participation` on `QuranTracking`, but this is a boolean flag on a single-student session row — it does not represent a multi-student rotation, turn order, or group session construct. See §6 below.

---

## 4. Assignment Logic

`QuranHomework` is the assignment mechanism: an admin/teacher creates a record with `homework_type`, a surah+verse range, an optional page range, `assigned_date`/`due_date`, and free-text `teacher_instructions`. `QuranHomework::matchesTracking()` compares surah/verse range equality against a `QuranTracking` record, and `QuranTrackingObserver::autoCompleteHomework()` (fired on `QuranTracking::created()`) auto-marks a matching homework row `completed` when the teacher logs a tracking session that matches it exactly (surah_from/to + verse_from/to equality — page range is not part of the match).

`QuranSchedule` is a separate, parallel mechanism — not an assignment of a specific portion, but a recurring pace target (e.g. "20 pages/week") against which `getProgressPercentageAttribute()` sums `pages_memorized` from `QuranTracking` since `start_date`.

All range fields (`surah_from/to`, `verse_from/to`, `page_from/to`) are stored as plain SQL `integer` columns — no decimal/fractional column exists anywhere in the schema.

---

## 5. Tracking Logic

`QuranTracking` rows are created by teachers via `QuranTrackingController::store()`. `QuranTrackingObserver` (registered globally in `AppServiceProvider::boot()`) hooks `creating`/`updating` to call `QuranTrackingCalculator::computeAllMetrics()`, which:
- computes `pages_memorized` = `abs(page_to - page_from) + 1` (supports reading backward),
- computes `surahs_memorized` similarly from `surah_from`/`surah_to`,
- computes `juz_memorized` via `QuranComApiClient::getJuzPageRanges()` (counts juz overlapped by the page range),
- if `page_from`/`page_to` are missing, attempts to derive them from verse references via `QuranComApiClient::getPageForAyah()`.

All computation failures are caught and default to `0`/`null` rather than blocking the save (defensive, but silently masks data-quality problems — noted, not scored here).

A dedicated `quran:backfill-pages` console command exists to recompute these values in bulk for historical rows, using `saveQuietly()` to bypass the observer.

---

## 6. Grading Logic

Grading is done through `QuranAssessment`, created/updated **inline** inside `QuranTrackingController::store()`/`update()` (not a separate endpoint or model dedicated to grading UI) — optional `fluency_rating`/`tajweed_rating` (1–5) and `mistakes_count`/`assessment_notes` fields are submitted alongside the tracking session form; if both ratings are null on update, the assessment row is deleted (`elseif ($quranTracking->assessment) { ... delete(); }`). This means:
- Grading is tied to **one session at a time**, not to a homework assignment or a page range independent of a session.
- There is no separate "gradebook" view — `QuranTracking::studentReport()` aggregates assessment analytics (avg fluency, avg tajweed, avg mistakes) across a student's sessions for the report page.

---

## 7. Group / Circular / Rotation Reading

**Not implemented.** No model, migration, controller, route, or UI component references group sessions, circles, rotations, turn-taking, or a multi-student halaqah construct. The only per-row participation flag is `QuranTracking.subac_participation` (boolean), scoped to a single student's single session — it cannot represent multiple students taking turns in one session. See §3 above for the full terminology check.

---

## 8. Role-Facing Views & Route Access

| Area | Route group | Roles | Controller |
|---|---|---|---|
| Quran dashboard | `/quran` | admin, teacher, guardian | `QuranController` |
| Tracking CRUD | `/quran-tracking/*` | admin, teacher (write); +guardian (read: `show`, `student-report`) | `QuranTrackingController` |
| Homework CRUD | `/quran-homework/*` | admin, teacher (write); +guardian (read: `show`, `student/{student}`) | `QuranHomeworkController` |
| Home Practice | `/quran-home-practice/*` | guardian (full CRUD, own records); admin/teacher (`index`, `show` only) | `QuranHomePracticeController` |
| Schedules | `/quran-schedule/*` | admin, teacher (write); +guardian (read: `show`) | `QuranScheduleController` |
| Guardian tracking view | `/guardian/quran-tracking` | guardian | `GuardianQuranTrackingController` |

**Navigation gap found:** the guardian role is granted route-level read access to `quran-homework.show` and `quran-homework.student`, but `resources/js/Config/navigation.js` guardian submenu (lines ~148–157) only links **Dashboard**, **Tracking** (`/guardian/quran-tracking`), and **Home Practice** — there is no "Homework" entry. A guardian can only reach a specific homework record by a direct URL (e.g. from another page's link), not by browsing. See §2 of the features-comparison report for the impact.

---

## 9. Page Rendering (data source for actual page display)

Pages are displayed as **static CDN images**, not reconstructed text. The URL pattern (`https://cdn.qurancdn.com/images/{w1920|w960|w480}/page{3-digit-padded}.png`) is implemented **independently in two places**:
- Backend: `QuranApiService::getPageImageUrl()` (lines 110–127)
- Frontend: `resources/js/Pages/Quran/Shared/PageImageViewer.jsx` (`getImageUrl()`, lines 51–63) — builds the same URL client-side rather than calling the backend

No component renders actual Arabic verse text as reflowed/reconstructed page layout anywhere in the app.

---

## 10. Arabic Text Usage

Arabic text appears in exactly one form throughout the app: **surah names** (`name_arabic`, e.g. "البقرة"), shown in dropdowns (`Tracking/Create.jsx`, `Tracking/Edit.jsx`, `Homework/Create.jsx`, `Homework/Edit.jsx`, `HomePractice/Create.jsx`, `HomePractice/Edit.jsx`) and enriched onto tracking records server-side (`QuranTrackingController.php` lines 74, 79, 249, 256, 447, 452).

**No ayah/verse body text is ever fetched for display.** `QuranComApiClient::getPageForAyah()` requests `fields=text_uthmani` from `api.quran.com` but only reads `page_number` from the response — the Arabic text field is fetched over the wire and discarded. `QuranApiService::getVerseText()` (line 428) exists and returns `text_uthmani`/`text_imlaei`, but it's currently unreachable in practice — it sits behind the crashing constructor (see §2), and no view calls the route that would use it.

---

## 11. Files Inspected For This Audit

`app/Models/{QuranTracking,QuranHomework,QuranSchedule,QuranAssessment}.php`, `app/Http/Controllers/{QuranController,QuranTrackingController,QuranHomeworkController,QuranScheduleController,QuranHomePracticeController,GuardianQuranTrackingController}.php`, `app/Services/QuranApiService.php`, `app/External/{QuranApiClient,QuranComApiClient}.php`, `app/Services/QuranTrackingCalculator.php`, `app/Observers/QuranTrackingObserver.php`, all 8 Quran migrations, `routes/web.php` (Quran section), `resources/js/Config/navigation.js`, `resources/js/Pages/Quran/**`, `resources/js/Pages/Guardians/QuranTracking/Index.jsx`, `resources/js/Utils/constants.js`.
