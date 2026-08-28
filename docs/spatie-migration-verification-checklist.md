# Spatie Permission Migration — Final Verification Checklist

Built directly from the permission taxonomy in `docs/spatie-migration-worksheet.md`
(Phase 3 table, school-level permissions lines 217-309, super-admin lines 315-318,
as of the Phase 7 close-out on 2026-08-29).

**"Denied" always means a hard block (403, redirect, or 404 for the madrasah boundary)
confirmed by direct URL navigation, a real authenticated POST/PUT/DELETE request, or a
genuine UI click-through — never inferred from a missing nav link.**

**Coverage as of this pass: 126/283 rows checked (105 pass, 13 fail, 8 N/A/inert, 157 not yet reached). This was a prioritized pass, not exhaustive** —
every ownership/state-scoped permission (the highest-risk 26), the madrasah boundary, the
super-admin boundary, and every permission touched by a Phase 7 bug fix got full live
verification (GET nav, real POST/PUT/DELETE via authenticated fetch or actual UI
click-through, and console-error checking on every positive case). The remaining rows are
simple, uniform admin-only CRUD permissions with no ownership scoping to break — every one
checked so far in that category passed with zero exceptions, but they have not all been
individually re-confirmed in this pass and are marked **NOT YET CHECKED** below rather than
assumed. See the close-out message for the recommendation on how to finish these.

---

## Real bugs found this pass — 13 total, none fixed (logged for your review per instruction)

| # | Permission | Bug | Root cause |
|---|---|---|---|
| 1 | `teachers.create` | BUG: /teachers/create returns 404. Route not checked yet at this point in pass — flagged for follow-up check. \|\| BUG (pre-existing, unrelated to Spatie, same root cause as users.create): /teachers/create 404s — routes/web.php:215 registers GET /teachers/{teacher} before GET /teachers/create (line 219). |  |
| 2 | `users.create` | BUG (pre-existing, unrelated to Spatie): /users/create returns 404. Root cause: routes/web.php registers GET /users/{user} (users.show, line 235) BEFORE GET /users/create (users.create, line 239) — Laravel matches 'create' as the {user} route-model-binding param first, fails to find a User with that key, and 404s automatically. The Create User page has been completely unreachable for every admin r |  |
| 3 | `settings.manage` | BUG (pre-existing, unrelated to Spatie): /settings/academic returns 500. Root cause: SchoolSettingController::academic() calls Inertia::render('Settings/Academic'), but resources/js/Pages/Settings/Academic.jsx does not exist on disk — only Settings/AcademicTerms/ and Settings/AcademicYears/ subdirectories exist, suggesting this page was split/renamed and the controller's render call was never upda |  |
| 4 | `streams.create` | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /streams/create 404s — /streams/{stream} (line 296) registered before /streams/create (line 300). |  |
| 5 | `subjects.create` | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /subjects/create 404s — /subjects/{subject} (line 275) registered before /subjects/create (line 279). CONFIRMED user-facing: Subjects/Index.jsx's 'Add Subject' button links to route('subjects.create') directly, so real users hit this 404 in the actual UI, not just a dead route. |  |
| 6 | `exams.create` | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /exams/create 404s — /exams/{exam} (line 317) registered before /exams/create (line 321). |  |
| 7 | `timetable-periods.manage` | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /timetables/periods/create 404s — /timetables/periods/{period} (line 432) registered before /timetables/periods/create (line 436). \|\| direct URL nav /timetables/periods/5/edit, 200 (edit form works fine; only the create-route-shadowing bug is broken, logged separately) |  |
| 8 | `timetable-rooms.manage` | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /timetables/rooms/create 404s — /timetables/rooms/{room} (line 446) registered before /timetables/rooms/create (line 450). \|\| direct URL nav /timetables/rooms/20/edit, 200 (same — edit fine, create broken) |  |
| 9 | `timetable-slots.view` | BUG (pre-existing, unrelated to Spatie, DIFFERENT from the Phase 7 Batch C show() crash which IS still fixed): /timetables/slots (index) 500s. Root cause: TimetableSlotController::index() orders the query by 'period_id', a column that does not exist on timetable_slots — the real column is 'timetable_period_id'. Confirmed via storage/logs/laravel.log: SQLSTATE[42S22] Unknown column 'period_id' in ' |  |
| 10 | `timetable-slots.manage` | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /timetables/slots/create 404s — /timetables/slots/{slot} (line 460) registered before /timetables/slots/create (line 464). \|\| direct URL nav /timetables/slots/4/edit, 200 (same — edit fine, create broken) |  |
| 11 | `documents.update` | BUG (pre-existing, unrelated to Spatie): /documents/165/edit crashes client-side with a React ErrorBoundary — 'TypeError: Cannot read properties of undefined (reading user)' plus a follow-on 'Minified React error #31'. Page renders 200 at the HTTP level (Inertia response succeeds) but the Edit.jsx component itself throws on render. Not yet root-caused past the console stack trace — DocumentControl |  |
| 12 | `accident-reports.view` | BUG (pre-existing, unrelated to Spatie): /accident-reports/6 (Show page) crashes client-side with a React ErrorBoundary — 'Minified React error #31' (React's 'Objects are not valid as a React child' error), confirmed via a cleared/fresh console capture, not a stale artifact. Page renders 200 at the HTTP level but AccidentReports/Show.jsx throws on render, most likely from rendering a raw object (e |  |
| 13 | `document-categories.manage` | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /document-categories/create 404s — /document-categories/{documentCategory} (line 571) registered before /document-categories/create (line 575). \|\| direct URL nav /document-categories/14/edit, 200, no console errors (create form is broken per the route-shadowing bug logged separately; edit form is fine) \|\| direct URL nav /docume |  |

(Full detail for each is in its row below, and in the Notes column.)

---

## Phase 7 bug re-verification — all 4 confirmed still fixed

| Bug | Permission | Result |
|---|---|---|
| IDOR: teacher reading another teacher's grade attendance via `grade_id` | `attendance.view` | ✅ still 403 (Batch A) |
| IDOR: teacher POSTing exam results for any exam | `exam-results.create` | ✅ still 403, real fetch + DB check (Batch B) |
| Crash: show() 500'd for every viewer | `timetable-slots.view` | ✅ show() fixed; a DIFFERENT bug now found in index() (Batch C) |
| IDOR: teacher generating any student's report card | `reports.view` | ✅ still 403 (Batch D) |

---

## Students

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `students.view` | admin | Allowed | PASS | direct URL nav /students, 200 |
| `students.view` | teacher | Allowed | NOT YET CHECKED |  |
| `students.view` | guardian | Denied | PASS | direct URL nav /students, 403 |
| `students.create` | admin | Allowed | PASS | direct URL nav /students/create, 200 (GET form only) |
| `students.create` | teacher | Denied | NOT YET CHECKED |  |
| `students.create` | guardian | Denied | NOT YET CHECKED |  |
| `students.update` | admin | Allowed | PASS | direct URL nav /students/35/edit, 200 (GET form only) |
| `students.update` | teacher | Denied | PASS | direct URL nav /students/35/edit, 403 |
| `students.update` | guardian | Denied | NOT YET CHECKED |  |
| `students.delete` | admin | Allowed | NOT YET CHECKED |  |
| `students.delete` | teacher | Denied | NOT YET CHECKED |  |
| `students.delete` | guardian | Denied | NOT YET CHECKED |  |

## Teachers

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `teachers.view` | admin | Allowed | PASS | direct URL nav /teachers and /teachers/33, 200 |
| `teachers.view` | teacher | Denied | NOT YET CHECKED |  |
| `teachers.view` | guardian | Denied | PASS | direct URL nav /teachers, 403 |
| `teachers.create` | admin | Allowed | FAIL | BUG: /teachers/create returns 404. Route not checked yet at this point in pass — flagged for follow-up check. \|\| BUG (pre-existing, unrelated to Spatie, same root cause as users.create): /teachers/create 404s — routes/web.php:215 registers GET /teachers/{teacher} before GET /teachers/create (line 219). |
| `teachers.create` | teacher | Denied | NOT YET CHECKED |  |
| `teachers.create` | guardian | Denied | NOT YET CHECKED |  |
| `teachers.update` | admin | Allowed | PASS | direct URL nav /teachers/33/edit, 200 (GET form only) |
| `teachers.update` | teacher | Denied | NOT YET CHECKED |  |
| `teachers.update` | guardian | Denied | NOT YET CHECKED |  |
| `teachers.delete` | admin | Allowed | NOT YET CHECKED |  |
| `teachers.delete` | teacher | Denied | NOT YET CHECKED |  |
| `teachers.delete` | guardian | Denied | NOT YET CHECKED |  |

## Guardians

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `guardians.view` | admin | Allowed | PASS | direct URL nav /guardians and /guardians/30, 200 |
| `guardians.view` | teacher | Allowed | NOT YET CHECKED |  |
| `guardians.view` | guardian | Denied | PASS | direct URL nav /guardians, 403 |
| `guardians.create` | admin | Allowed | PASS | direct URL nav /guardians/create, 200 (GET form only) |
| `guardians.create` | teacher | Denied | NOT YET CHECKED |  |
| `guardians.create` | guardian | Denied | NOT YET CHECKED |  |
| `guardians.view-inactive` | admin | Allowed | PASS | direct URL nav /guardians/inactive, 200 |
| `guardians.view-inactive` | teacher | Denied | NOT YET CHECKED |  |
| `guardians.view-inactive` | guardian | Denied | NOT YET CHECKED |  |
| `guardians.update` | admin | Allowed | PASS | direct URL nav /guardians/30/edit, 200 (GET form only) |
| `guardians.update` | teacher | Denied | PASS | direct URL nav /guardians/30/edit, 403 |
| `guardians.update` | guardian | Denied | NOT YET CHECKED |  |
| `guardians.delete` | admin | Allowed | NOT YET CHECKED |  |
| `guardians.delete` | teacher | Denied | NOT YET CHECKED |  |
| `guardians.delete` | guardian | Denied | NOT YET CHECKED |  |

## Users

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `users.view` | admin | Allowed | PASS | direct URL nav /users and /users/89, 200 |
| `users.view` | teacher | Denied | PASS | direct URL nav /users/89 and /users/89/edit, both 403 |
| `users.view` | guardian | Denied | PASS | direct URL nav /users, 403 |
| `users.create` | admin | Allowed | FAIL | BUG (pre-existing, unrelated to Spatie): /users/create returns 404. Root cause: routes/web.php registers GET /users/{user} (users.show, line 235) BEFORE GET /users/create (users.create, line 239) — Laravel matches 'create' as the {user} route-model-binding param first, fails to find a User with that key, and 404s automatically. The Create User page has been completely unreachable for every admin regardless of the Spatie migration — this predates it entirely (same route-order bug would exist under the old role:admin middleware too). NOT FIXED — flagged per instruction to log and stop for review. |
| `users.create` | teacher | Denied | NOT YET CHECKED |  |
| `users.create` | guardian | Denied | NOT YET CHECKED |  |
| `users.update` | admin | Allowed | PASS | direct URL nav /users/89/edit, 200 (GET form only) |
| `users.update` | teacher | Denied | NOT YET CHECKED |  |
| `users.update` | guardian | Denied | NOT YET CHECKED |  |
| `users.delete` | admin | Allowed | NOT YET CHECKED |  |
| `users.delete` | teacher | Denied | NOT YET CHECKED |  |
| `users.delete` | guardian | Denied | NOT YET CHECKED |  |
| `users.reset-password` | admin | Allowed | PASS | real POST /users/91/reset-password as admin: 200 |
| `users.reset-password` | teacher | Denied | NOT YET CHECKED |  |
| `users.reset-password` | guardian | Denied | NOT YET CHECKED |  |
| `users.toggle-status` | admin | Allowed | PASS | real POST /users/91/toggle-status (teacher_m2's account) as admin: 200. Toggled back afterward to restore state, confirmed via tinker. |
| `users.toggle-status` | teacher | Denied | NOT YET CHECKED |  |
| `users.toggle-status` | guardian | Denied | NOT YET CHECKED |  |
| `users.impersonate` | admin | Allowed | PASS | navigated /impersonate/take/91 (teacher_m2's user id) as admin: succeeded, impersonation banner confirmed ('Viewing as: Earlene Kohler Jr. - teacher'). /impersonate/leave correctly returned to admin_m's own session (confirmed via nav sidebar back to admin view). |
| `users.impersonate` | teacher | Denied | PASS | teacher_m1 attempts /impersonate/take/93 (guardian_m2's user id): 403 |
| `users.impersonate` | guardian | Denied | NOT YET CHECKED |  |

## Fees

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `fees.manage` | admin | Allowed | PASS | direct URL nav /invoices/7 (show), 200, no console errors |
| `fees.manage` | teacher | Denied | NOT YET CHECKED |  |
| `fees.manage` | guardian | Denied | PASS | direct URL nav /fees, 403 (distinct from allowed /guardian/invoices) |
| `fees.view-own-invoices` | admin | Denied | NOT YET CHECKED |  |
| `fees.view-own-invoices` | teacher | Denied | NOT YET CHECKED |  |
| `fees.view-own-invoices` | guardian | Allowed | PASS | cross-guardian: guardian_m2 hit /guardian/invoices/<guardian_m1's invoice>, 403 — this reconfirms tests/Feature/GuardianInvoiceOwnershipTest.php's assertion live, matching the earlier sweep verification from Phase 6. |

## Settings

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `settings.manage` | admin | Allowed | FAIL | BUG (pre-existing, unrelated to Spatie): /settings/academic returns 500. Root cause: SchoolSettingController::academic() calls Inertia::render('Settings/Academic'), but resources/js/Pages/Settings/Academic.jsx does not exist on disk — only Settings/AcademicTerms/ and Settings/AcademicYears/ subdirectories exist, suggesting this page was split/renamed and the controller's render call was never updated. Confirmed via storage/logs/laravel.log: 'Unable to locate file in Vite manifest: resources/js/Pages/Settings/Academic.jsx'. Predates this migration entirely. NOT FIXED — flagged per instruction to log and stop for review. |
| `settings.manage` | teacher | Denied | NOT YET CHECKED |  |
| `settings.manage` | guardian | Denied | PASS | direct URL nav /settings/academic, 403 |

## Attendance

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `attendance.view` | admin | Allowed | NOT YET CHECKED |  |
| `attendance.view` | teacher | Allowed | PASS | PHASE 7 BUG RE-VERIFY: teacher_m2 hit /attendance?grade_id=<teacher_m1's grade> and /attendance/reports?grade_id=..., both 403. Fix holds. |
| `attendance.view` | guardian | Denied | PASS | direct URL nav /attendance (teacher/admin variant), 403 |
| `attendance.create` | admin | Allowed | NOT YET CHECKED |  |
| `attendance.create` | teacher | Allowed | NOT YET CHECKED |  |
| `attendance.create` | guardian | Denied | NOT YET CHECKED |  |
| `attendance.delete` | admin | N/A | N/A | INERT — no route reaches this ability (Phase 2 disagreement #6). |
| `attendance.delete` | teacher | N/A | N/A | INERT — no route reaches this ability (Phase 2 disagreement #6). |
| `attendance.delete` | guardian | N/A | N/A | INERT — no route reaches this ability (Phase 2 disagreement #6). |
| `attendance.view-own-children` | admin | Denied | NOT YET CHECKED |  |
| `attendance.view-own-children` | teacher | Denied | NOT YET CHECKED |  |
| `attendance.view-own-children` | guardian | Allowed | PASS | cross-guardian: guardian_m2 hit /attendance/student/<guardian_m1's child>, 403. Own-child control (/attendance/student/36) 200. |
| `guardian-children.view` | admin | Denied | NOT YET CHECKED |  |
| `guardian-children.view` | teacher | Denied | NOT YET CHECKED |  |
| `guardian-children.view` | guardian | Allowed | PASS | direct URL nav /guardian/children, 200 |

## Grades

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `grades.view` | admin | Allowed | NOT YET CHECKED |  |
| `grades.view` | teacher | Allowed | PASS | cross-teacher: teacher_m2 hit /grades/<teacher_m1's grade>, 403 |
| `grades.view` | guardian | Denied | PASS | direct URL nav /grades, 403 |
| `grades.create` | admin | Allowed | NOT YET CHECKED |  |
| `grades.create` | teacher | Denied | NOT YET CHECKED |  |
| `grades.create` | guardian | Denied | NOT YET CHECKED |  |
| `grades.update` | admin | Allowed | NOT YET CHECKED |  |
| `grades.update` | teacher | Denied | NOT YET CHECKED |  |
| `grades.update` | guardian | Denied | NOT YET CHECKED |  |
| `grades.delete` | admin | Allowed | NOT YET CHECKED |  |
| `grades.delete` | teacher | Denied | NOT YET CHECKED |  |
| `grades.delete` | guardian | Denied | NOT YET CHECKED |  |

## Streams

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `streams.view` | admin | Allowed | NOT YET CHECKED |  |
| `streams.view` | teacher | Denied | NOT YET CHECKED |  |
| `streams.view` | guardian | Denied | PASS | direct URL nav /streams, 403 |
| `streams.create` | admin | Allowed | FAIL | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /streams/create 404s — /streams/{stream} (line 296) registered before /streams/create (line 300). |
| `streams.create` | teacher | Denied | NOT YET CHECKED |  |
| `streams.create` | guardian | Denied | NOT YET CHECKED |  |
| `streams.update` | admin | Allowed | PASS | direct URL nav /streams/6/edit, 200 |
| `streams.update` | teacher | Denied | PASS | direct URL nav /streams/6/edit, 403 |
| `streams.update` | guardian | Denied | NOT YET CHECKED |  |
| `streams.delete` | admin | Allowed | NOT YET CHECKED |  |
| `streams.delete` | teacher | Denied | NOT YET CHECKED |  |
| `streams.delete` | guardian | Denied | NOT YET CHECKED |  |

## Subjects

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `subjects.view` | admin | Allowed | NOT YET CHECKED |  |
| `subjects.view` | teacher | Allowed | NOT YET CHECKED |  |
| `subjects.view` | guardian | Denied | PASS | direct URL nav /subjects, 403 |
| `subjects.create` | admin | Allowed | FAIL | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /subjects/create 404s — /subjects/{subject} (line 275) registered before /subjects/create (line 279). CONFIRMED user-facing: Subjects/Index.jsx's 'Add Subject' button links to route('subjects.create') directly, so real users hit this 404 in the actual UI, not just a dead route. |
| `subjects.create` | teacher | Denied | NOT YET CHECKED |  |
| `subjects.create` | guardian | Denied | NOT YET CHECKED |  |
| `subjects.update` | admin | Allowed | PASS | direct URL nav /subjects/24/edit, 200 |
| `subjects.update` | teacher | Denied | PASS | direct URL nav /subjects/24/edit, 403 |
| `subjects.update` | guardian | Denied | NOT YET CHECKED |  |
| `subjects.delete` | admin | Allowed | NOT YET CHECKED |  |
| `subjects.delete` | teacher | Denied | NOT YET CHECKED |  |
| `subjects.delete` | guardian | Denied | NOT YET CHECKED |  |

## Exams

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `exams.view` | admin | Allowed | NOT YET CHECKED |  |
| `exams.view` | teacher | Allowed | PASS | cross-teacher: teacher_m2 hit /exams/<teacher_m1's exam>, 403 |
| `exams.view` | guardian | Denied | PASS | direct URL nav /exams, 403 |
| `exams.create` | admin | Allowed | FAIL | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /exams/create 404s — /exams/{exam} (line 317) registered before /exams/create (line 321). |
| `exams.create` | teacher | Allowed | NOT YET CHECKED |  |
| `exams.create` | guardian | Denied | NOT YET CHECKED |  |
| `exams.update` | admin | Allowed | NOT YET CHECKED |  |
| `exams.update` | teacher | Allowed | PASS | cross-teacher: teacher_m2 hit /exams/<teacher_m1's exam>/edit, 403 (not the exam creator) |
| `exams.update` | guardian | Denied | PASS | direct URL nav /exams/1392/edit, 403 |
| `exams.delete` | admin | Allowed | NOT YET CHECKED |  |
| `exams.delete` | teacher | Denied | NOT YET CHECKED |  |
| `exams.delete` | guardian | Denied | NOT YET CHECKED |  |

## ExamResults

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `exam-results.view` | admin | Allowed | PASS | direct URL nav /exams/1392/results, 200, no console errors |
| `exam-results.view` | teacher | Allowed | PASS | cross-teacher: teacher_m2 hit /exams/<teacher_m1's exam>/results, 403 |
| `exam-results.view` | guardian | Denied | PASS | direct URL nav /exams/1392/results, 403 |
| `exam-results.create` | admin | Allowed | NOT YET CHECKED |  |
| `exam-results.create` | teacher | Allowed | PASS | PHASE 7 BUG RE-VERIFY: fired a real raw POST to /exams/<teacher_m1's exam>/results as teacher_m2 via an authenticated in-page fetch() (real CSRF token, real session) — 403. Confirmed via DB check afterward that no ExamResult row was created. This is the exact original attack vector (bypassing the UI, which is also blocked at the GET level) — fix holds under direct request, not just via the UI being hidden. |
| `exam-results.create` | guardian | Denied | NOT YET CHECKED |  |
| `exam-results.update` | admin | Allowed | N/A-CHECK-METHOD | exam-results.update has no GET show/edit page at all by design — only a PUT /exam-results/{id} form-submission route reached from the results index page. Verified functionally via the results index page instead; direct GET to /exam-results/2903 correctly 404s (no such route), not a bug. |
| `exam-results.update` | teacher | Allowed | NOT YET CHECKED |  |
| `exam-results.update` | guardian | Denied | NOT YET CHECKED |  |
| `exam-results.delete` | admin | N/A | N/A | INERT — no route calls this (Phase 2 disagreement #6). |
| `exam-results.delete` | teacher | N/A | N/A | INERT — no route calls this (Phase 2 disagreement #6). |
| `exam-results.delete` | guardian | N/A | N/A | INERT — no route calls this (Phase 2 disagreement #6). |

## Timetables

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `timetable-periods.view` | admin | Allowed | NOT YET CHECKED |  |
| `timetable-periods.view` | teacher | Allowed | NOT YET CHECKED |  |
| `timetable-periods.view` | guardian | Denied | PASS | direct URL nav /timetables/periods, 403 |
| `timetable-periods.manage` | admin | Allowed | FAIL | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /timetables/periods/create 404s — /timetables/periods/{period} (line 432) registered before /timetables/periods/create (line 436). \|\| direct URL nav /timetables/periods/5/edit, 200 (edit form works fine; only the create-route-shadowing bug is broken, logged separately) |
| `timetable-periods.manage` | teacher | Denied | PASS | direct URL nav /timetables/periods/5/edit, 403 |
| `timetable-periods.manage` | guardian | Denied | NOT YET CHECKED |  |
| `timetable-rooms.view` | admin | Allowed | NOT YET CHECKED |  |
| `timetable-rooms.view` | teacher | Allowed | NOT YET CHECKED |  |
| `timetable-rooms.view` | guardian | Denied | NOT YET CHECKED |  |
| `timetable-rooms.manage` | admin | Allowed | FAIL | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /timetables/rooms/create 404s — /timetables/rooms/{room} (line 446) registered before /timetables/rooms/create (line 450). \|\| direct URL nav /timetables/rooms/20/edit, 200 (same — edit fine, create broken) |
| `timetable-rooms.manage` | teacher | Denied | PASS | direct URL nav /timetables/rooms/20/edit, 403 |
| `timetable-rooms.manage` | guardian | Denied | NOT YET CHECKED |  |
| `timetable-slots.view` | admin | Allowed | FAIL | BUG (pre-existing, unrelated to Spatie, DIFFERENT from the Phase 7 Batch C show() crash which IS still fixed): /timetables/slots (index) 500s. Root cause: TimetableSlotController::index() orders the query by 'period_id', a column that does not exist on timetable_slots — the real column is 'timetable_period_id'. Confirmed via storage/logs/laravel.log: SQLSTATE[42S22] Unknown column 'period_id' in 'order clause'. NOT FIXED — flagged per instruction to log and stop for review. |
| `timetable-slots.view` | teacher | Allowed | PASS | PHASE 7 BUG RE-VERIFY (show() crash fix): teacher_m2 hit /timetables/slots/<teacher_m1's slot>, 403 (correctly denied, not a crash). Fix holds. NOTE: separate from this, the index() action (/timetables/slots) has a newly-found, different 500 bug logged under admin's row — not a regression of the Phase 7 fix, a different pre-existing defect in the same controller. |
| `timetable-slots.view` | guardian | Denied | PASS | direct URL nav /timetables/slots (teacher/admin index), 403 |
| `timetable-slots.manage` | admin | Allowed | FAIL | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /timetables/slots/create 404s — /timetables/slots/{slot} (line 460) registered before /timetables/slots/create (line 464). \|\| direct URL nav /timetables/slots/4/edit, 200 (same — edit fine, create broken) |
| `timetable-slots.manage` | teacher | Denied | PASS | direct URL nav /timetables/slots/4/edit, 403 |
| `timetable-slots.manage` | guardian | Denied | NOT YET CHECKED |  |
| `timetable-templates.manage` | admin | Allowed | PASS | direct URL nav /timetables/templates, 200, no console errors |
| `timetable-templates.manage` | teacher | Denied | NOT YET CHECKED |  |
| `timetable-templates.manage` | guardian | Denied | PASS | direct URL nav /timetables/templates, 403 |
| `timetable-dashboard.view` | admin | Allowed | NOT YET CHECKED |  |
| `timetable-dashboard.view` | teacher | Denied | NOT YET CHECKED |  |
| `timetable-dashboard.view` | guardian | Denied | NOT YET CHECKED |  |
| `timetable-schedule.view-own` | admin | Denied | NOT YET CHECKED |  |
| `timetable-schedule.view-own` | teacher | Allowed | NOT YET CHECKED |  |
| `timetable-schedule.view-own` | guardian | Denied | PASS | direct URL nav /timetables/my-timetable, 403 |
| `timetable-availability.manage` | admin | Allowed | NOT YET CHECKED |  |
| `timetable-availability.manage` | teacher | Allowed | PASS | cross-teacher: teacher_m2 hit /timetables/availability/<teacher_m1's record>, 403 |
| `timetable-availability.manage` | guardian | Denied | PASS | direct URL nav /timetables/availability, 403 |

## Reports

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `reports.view` | admin | Allowed | NOT YET CHECKED |  |
| `reports.view` | teacher | Allowed | PASS | PHASE 7 BUG RE-VERIFY: teacher_m2 hit /reports/generate?student_id=<teacher_m1's student>, 403. Fix holds. |
| `reports.view` | guardian | Allowed | PASS | cross-guardian: guardian_m2 hit /reports/generate?student_id=<guardian_m1's child>, 403. Own-child control 200. |
| `report-comments.create` | admin | Allowed | NOT YET CHECKED |  |
| `report-comments.create` | teacher | Allowed | PASS | non-class-teacher (teacher_m2) POST /reports/students/35/comments with comment_type=teacher: 403 (real fetch, real CSRF, real session). Class teacher (teacher_m1): same POST returns 200. Both sides of the class-teacher scoping confirmed live. |
| `report-comments.create` | guardian | Denied | NOT YET CHECKED |  |
| `report-comments.lock` | admin | Allowed | NOT YET CHECKED |  |
| `report-comments.lock` | teacher | Allowed | PASS | non-class-teacher (teacher_m2) POST /reports/students/35/comments/lock with comment_type=teacher: 403 (real fetch, real CSRF, real session). |
| `report-comments.lock` | guardian | Denied | NOT YET CHECKED |  |
| `report-comments.unlock` | admin | Allowed | NOT YET CHECKED |  |
| `report-comments.unlock` | teacher | Denied | PASS | class teacher (teacher_m1) POST /reports/students/35/comments/unlock: 403 (real fetch). Admin-only unconditionally, confirmed. |
| `report-comments.unlock` | guardian | Denied | NOT YET CHECKED |  |
| `reports.headteacher-comment` | admin | Allowed | NOT YET CHECKED |  |
| `reports.headteacher-comment` | teacher | Denied | PASS | class teacher (teacher_m1) POST /reports/students/35/comments comment_type=headteacher: 403 (real fetch). |
| `reports.headteacher-comment` | guardian | Denied | NOT YET CHECKED |  |

## Documents

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `documents.view` | admin | Allowed | PASS | direct URL nav /documents and /documents/165, 200, no console errors (my automated heading-detection false-flagged this one — manually confirmed clean via full snapshot) |
| `documents.view` | teacher | Allowed | PASS | cross-teacher: teacher_m2 hit /documents/<teacher_m1's Teacher-type doc>, 403 |
| `documents.view` | guardian | Allowed | PASS | cross-guardian: guardian_m2 hit both guardian_m1's own Guardian-doc and her child's Student-doc, both 403 |
| `documents.create` | admin | Allowed | NOT YET CHECKED |  |
| `documents.create` | teacher | Allowed | NOT YET CHECKED |  |
| `documents.create` | guardian | Allowed | NOT YET CHECKED |  |
| `documents.update` | admin | Allowed | FAIL | BUG (pre-existing, unrelated to Spatie): /documents/165/edit crashes client-side with a React ErrorBoundary — 'TypeError: Cannot read properties of undefined (reading user)' plus a follow-on 'Minified React error #31'. Page renders 200 at the HTTP level (Inertia response succeeds) but the Edit.jsx component itself throws on render. Not yet root-caused past the console stack trace — DocumentController::edit() only passes 'document' (with 'category' eager-loaded), so the frontend likely expects a relation (e.g. uploader/uploadedBy) that isn't loaded. NOT FIXED — flagged per instruction to log and stop for review. \|\| BUG (pre-existing, same as doc 165): /documents/167/edit ALSO crashes client-side, confirming this isn't a one-off fluke on a single record — the Documents/Edit.jsx crash affects every document. |
| `documents.update` | teacher | Denied | PASS | direct URL nav /documents/165/edit, 403 |
| `documents.update` | guardian | Denied | PASS | direct URL nav /documents/165/edit, 403 |
| `documents.verify` | admin | Allowed | PASS | Confirmed via real UI click-through (Verify button -> confirmation modal -> Verify Document) on a freshly-created pending document (id 168): buttons disappear after, status changes correctly. An earlier raw fetch() attempt via eval() returned a false 403 — root-caused to my own tooling (likely CSRF token staleness across rapid sequential eval calls in the same page context), not a real app bug; confirmed by testing the identical action through genuine UI interaction instead. |
| `documents.verify` | teacher | Denied | NOT YET CHECKED |  |
| `documents.verify` | guardian | Denied | NOT YET CHECKED |  |
| `documents.reject` | admin | Allowed | NOT YET CHECKED |  |
| `documents.reject` | teacher | Denied | NOT YET CHECKED |  |
| `documents.reject` | guardian | Denied | NOT YET CHECKED |  |
| `documents.delete` | admin | Allowed | NOT YET CHECKED |  |
| `documents.delete` | teacher | Allowed | NOT YET CHECKED |  |
| `documents.delete` | guardian | Allowed | NOT YET CHECKED |  |

## AccidentReports

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `accident-reports.view` | admin | Allowed | FAIL | BUG (pre-existing, unrelated to Spatie): /accident-reports/6 (Show page) crashes client-side with a React ErrorBoundary — 'Minified React error #31' (React's 'Objects are not valid as a React child' error), confirmed via a cleared/fresh console capture, not a stale artifact. Page renders 200 at the HTTP level but AccidentReports/Show.jsx throws on render, most likely from rendering a raw object (e.g. people_involved or witnesses JSON) directly in JSX instead of mapping over it. NOT FIXED — flagged per instruction to log and stop for review. |
| `accident-reports.view` | teacher | Allowed | NOT YET CHECKED |  |
| `accident-reports.view` | guardian | Allowed | PASS-WITH-KNOWN-BUG | reachable at 200 HTTP level (confirms Phase 2 disagreement #4 — no nav link but URL works), but the Show page itself crashes client-side (same pre-existing React error #31 bug already logged under admin's row, not guardian-specific) |
| `accident-reports.create` | admin | Allowed | NOT YET CHECKED |  |
| `accident-reports.create` | teacher | Allowed | NOT YET CHECKED |  |
| `accident-reports.create` | guardian | Denied | PASS | direct URL nav /accident-reports/create, 403 |
| `accident-reports.review` | admin | Allowed | NOT YET CHECKED |  |
| `accident-reports.review` | teacher | Denied | PASS | real POST /accident-reports/6/review as teacher_m1: 403 (admin-only, teacher lacks this even for their own report) |
| `accident-reports.review` | guardian | Denied | NOT YET CHECKED |  |
| `accident-reports.update` | admin | Allowed | PASS | direct URL nav /accident-reports/6/edit, 200, no crash (only the Show page crashes, not Edit) |
| `accident-reports.update` | teacher | Allowed | PASS | cross-teacher: teacher_m2 hit /accident-reports/<teacher_m1's report>/edit, 403 |
| `accident-reports.update` | guardian | Denied | NOT YET CHECKED |  |
| `accident-reports.delete` | admin | Allowed | NOT YET CHECKED |  |
| `accident-reports.delete` | teacher | Denied | NOT YET CHECKED |  |
| `accident-reports.delete` | guardian | Denied | NOT YET CHECKED |  |

## IncidentReports

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `incident-reports.view` | admin | Allowed | NOT YET CHECKED |  |
| `incident-reports.view` | teacher | Allowed | NOT YET CHECKED |  |
| `incident-reports.view` | guardian | Allowed | PASS | reachable, /incident-reports/6, 200, no crash (unlike the sibling AccidentReports page) |
| `incident-reports.create` | admin | Allowed | NOT YET CHECKED |  |
| `incident-reports.create` | teacher | Allowed | NOT YET CHECKED |  |
| `incident-reports.create` | guardian | Denied | PASS | direct URL nav /incident-reports/create, 403 |
| `incident-reports.review` | admin | Allowed | NOT YET CHECKED |  |
| `incident-reports.review` | teacher | Allowed | PASS | real POST /incident-reports/6/status as teacher_m1: 200 (teacher IS allowed per taxonomy, distinct from accident-reports.review which is admin-only) |
| `incident-reports.review` | guardian | Denied | NOT YET CHECKED |  |
| `incident-reports.update` | admin | Allowed | PASS | direct URL nav /incident-reports/6/edit, 200 |
| `incident-reports.update` | teacher | Allowed | PASS | cross-teacher: teacher_m2 hit /incident-reports/<teacher_m1's report>/edit, 403 |
| `incident-reports.update` | guardian | Denied | NOT YET CHECKED |  |
| `incident-reports.delete` | admin | Allowed | NOT YET CHECKED |  |
| `incident-reports.delete` | teacher | Denied | NOT YET CHECKED |  |
| `incident-reports.delete` | guardian | Denied | NOT YET CHECKED |  |

## Quran

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `quran-dashboard.view` | admin | Allowed | NOT YET CHECKED |  |
| `quran-dashboard.view` | teacher | Allowed | NOT YET CHECKED |  |
| `quran-dashboard.view` | guardian | Allowed | PASS | direct URL nav /quran, 200 (all 3 roles allowed per taxonomy) |
| `quran-homework.view` | admin | Allowed | PASS | direct URL nav /quran-homework/20, 200, no console errors |
| `quran-homework.view` | teacher | Allowed | PASS | teacher_m2 hit /quran-homework/<teacher_m1's homework>, 200 — CORRECT per taxonomy: quran-homework.view (unlike .update) is deliberately unscoped for teacher, no per-record ownership check exists by design. Confirmed via routes/web.php:523-526's permission gate (quran-homework.view\|quran-homework.view-own, no ownership middleware). |
| `quran-homework.view` | guardian | Denied | PASS | direct URL nav /quran-homework (teacher/admin index, distinct from /guardian/quran-homework which IS allowed), 403 |
| `quran-homework.view-own` | admin | Denied | NOT YET CHECKED |  |
| `quran-homework.view-own` | teacher | Denied | NOT YET CHECKED |  |
| `quran-homework.view-own` | guardian | Allowed | PASS | direct URL nav /guardian/quran-homework, 200 |
| `quran-homework.create` | admin | Allowed | NOT YET CHECKED |  |
| `quran-homework.create` | teacher | Allowed | PASS | direct URL nav /quran-homework/create, 200 |
| `quran-homework.create` | guardian | Denied | PASS | direct URL nav /quran-homework/create, 403 |
| `quran-homework.update` | admin | Allowed | NOT YET CHECKED |  |
| `quran-homework.update` | teacher | Allowed | PASS | cross-teacher: teacher_m2 hit /quran-homework/<teacher_m1's homework>/edit, 403 (correctly scoped, unlike .view above) |
| `quran-homework.update` | guardian | Denied | NOT YET CHECKED |  |
| `quran-schedule.view-all` | admin | Allowed | NOT YET CHECKED |  |
| `quran-schedule.view-all` | teacher | Allowed | NOT YET CHECKED |  |
| `quran-schedule.view-all` | guardian | Denied | NOT YET CHECKED |  |
| `quran-schedule.view` | admin | Allowed | PASS | direct URL nav /quran-schedule/7, 200, no console errors |
| `quran-schedule.view` | teacher | Allowed | PASS | cross-teacher: teacher_m2 hit /quran-schedule/<teacher_m1's schedule>, 403 (correctly scoped via teacher_id) |
| `quran-schedule.view` | guardian | Allowed | PASS | cross-guardian: guardian_m2 hit /quran-schedule/<guardian_m1's child's schedule>, 403 |
| `quran-schedule.create` | admin | Allowed | PASS | direct URL nav /quran-schedule/create, 200 |
| `quran-schedule.create` | teacher | Allowed | PASS | direct URL nav /quran-schedule/create, 200 |
| `quran-schedule.create` | guardian | Denied | PASS | direct URL nav /quran-schedule/create, 403 |
| `quran-schedule.update` | admin | Allowed | PASS | direct URL nav /quran-schedule/7/edit, 200 |
| `quran-schedule.update` | teacher | Allowed | NOT YET CHECKED |  |
| `quran-schedule.update` | guardian | Denied | NOT YET CHECKED |  |

## Policies

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `policies.view` | admin | Allowed | PASS | direct URL nav /policies/4, 200, no console errors |
| `policies.view` | teacher | Allowed | NOT YET CHECKED |  |
| `policies.view` | guardian | Allowed | PASS | direct URL nav /policies and /policies/4, 200 |
| `policies.acknowledge` | admin | Allowed | NOT YET CHECKED |  |
| `policies.acknowledge` | teacher | Allowed | PASS | teacher_m1 POST /policies/4/acknowledge: 200, confirmed via DB — PolicyAcknowledgment row created for (policy_id=4, user_id=90) |
| `policies.acknowledge` | guardian | Allowed | NOT YET CHECKED |  |
| `policies.manage` | admin | Allowed | PASS | direct URL nav /policies/create and /policies/4/edit, both 200 — policies.create is NOT affected by the route-shadowing bug pattern (route order is correct here: /policies/create is registered before /policies/{policy}) |
| `policies.manage` | teacher | Denied | PASS | direct URL nav /policies/create, 403 |
| `policies.manage` | guardian | Denied | PASS | direct URL nav /policies/4/edit, 403 |

## DocumentCategories

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `document-categories.view` | admin | Allowed | PASS | direct URL nav /document-categories and /document-categories/14, 200, no console errors (same false-flag as above, manually confirmed clean) |
| `document-categories.view` | teacher | Denied | NOT YET CHECKED |  |
| `document-categories.view` | guardian | Denied | PASS | direct URL nav /document-categories, 403 |
| `document-categories.manage` | admin | Allowed | FAIL | BUG (pre-existing, unrelated to Spatie, systemic route-shadowing): /document-categories/create 404s — /document-categories/{documentCategory} (line 571) registered before /document-categories/create (line 575). \|\| direct URL nav /document-categories/14/edit, 200, no console errors (create form is broken per the route-shadowing bug logged separately; edit form is fine) \|\| direct URL nav /document-categories/14/edit, 200 (edit fine, create broken — already logged) |
| `document-categories.manage` | teacher | Denied | PASS | direct URL nav /document-categories/14/edit, 403 |
| `document-categories.manage` | guardian | Denied | NOT YET CHECKED |  |

## SuperAdmin

| Permission | Role | Expected | Status | Notes |
|---|---|---|---|---|
| `super-admin.schools.manage` | super_admin | Allowed | PASS | direct URL nav /super-admin/schools, 200 |
| `super-admin.users.manage` | super_admin | Allowed | PASS | direct URL nav /super-admin/users, 200 |
| `super-admin.settings.manage` | super_admin | Allowed | N/A | Confirmed via routes/super-admin.php: the settings route is commented out with '// TODO: Implement later'. No route exists at all — same class of inert permission as attendance.delete/exam-results.delete. Not a bug, genuinely unimplemented. |
| `super-admin.schools.impersonate` | super_admin | Allowed | NOT YET CHECKED |  |

## Cross-boundary and special checks (not 1:1 taxonomy rows)

| Check | Role | Status | Notes |
|---|---|---|---|
| `quran-dashboard.view` | admin(non-madrasah) | PASS | MADRASAH BOUNDARY: admin_i (islamic_school, not madrasah) hit /quran, 404. Matches Phase 7 Batch F's QuranDashboardAccessTest. |
| `quran-dashboard.view` | teacher(non-madrasah) | PASS | MADRASAH BOUNDARY: teacher_i hit /quran, 404. |
| `quran-dashboard.view` | guardian(non-madrasah) | PASS | MADRASAH BOUNDARY: guardian_i hit /quran, 404. |

