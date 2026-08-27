# Spatie Permission Migration — Worksheet

Tracking document for the role cleanup + `spatie/laravel-permission` migration.
Branched off `one-db` (confirmed production deploy branch) as `feature/spatie-permissions`.

Each phase gets its own commit(s) and a stop-for-review checkpoint. This file is
updated at every checkpoint so it stays the single source of truth for where the
migration currently stands.

---

## Phase checklist

- [x] **Phase 0** — Branch + worksheet skeleton
- [x] **Phase 1** — Role cleanup: delete `accountant, receptionist, nurse, it_staff, maid, cook`
- [x] **Phase 2** — Reverse-engineer current permissions for `super_admin, admin, teacher, guardian`
  (extended 2026-08-26 to 4 modules missed from the original checklist — see Phase log)
- [x] **Phase 3** — Design the permission taxonomy — ✅ **90 permissions in the
  table (86 school-level + 4 super-admin), fully resolved as of 2026-08-26.**
  `quran-schedule.view` and `quran-homework.update` were resolved and implemented
  in code ahead of Phase 5, since both were live security/scoping bugs, not just
  taxonomy disputes. Impersonation is now fully represented too (`users.impersonate`
  + `super-admin.schools.impersonate`) — see Risks section and Phase log for both.
- [x] **Phase 4** — Install, migrate, seed `spatie/laravel-permission` — ✅ **90
  permissions / 4 roles seeded (86 school-level + 4 super-admin permissions;
  admin 82, teacher 39, guardian 13, super_admin 4), completely inert — see
  Phase log**
- [x] **Phase 5** — Migrate backend: routes, policies, model — ✅ **Closed
  2026-08-27.** `User` now uses Spatie's `HasRoles`; all 55 `role:...`
  route-middleware usages replaced with `permission:...`; all 22 Policy
  classes rewritten to check real permissions. **97 permissions now (93
  school-level + 4 super-admin)** — 7 new ones surfaced while mapping
  routes/Policies to permissions, see Phase log. **Exhaustive live-path
  trace done for all 22/22 Policies (2026-08-27)** — every `authorize()`
  call site confirmed to hit the actually-routed controller, no second
  Report-Comments-style discrepancy found; a few dead-Policy-method/
  dead-Form-Request findings logged in the Phase log, none live bugs.
  **Test-coverage gap identified and partially backfilled**: of the 26
  ownership/state-scoped permissions, only 6 had negative-case tests before
  this pass; 4 more backfilled 2026-08-27 (`quran-schedule.update`,
  `fees.view-own-invoices`, `accident-reports.update`,
  `incident-reports.update`) — **the remaining 15 (+1 partial) are
  explicitly deferred to Phase 7**, not silently dropped, see Phase log for
  the full list. `InvoiceController::destroy()`/`clearAll()` risk logged
  separately in the Risks section (pre-existing, unrelated, not fixed).
  Full suite: 145 passed, 31 failed — same pre-existing failures as every
  prior run this session, zero regressions.
- [ ] **Phase 6** — Migrate frontend — 🔄 **In progress (2026-08-27).** Grounding
  pass done (real scope: 38 files / 123 `auth.user.role` occurrences, not the
  handoff's ~154/~41 estimate); `can()`/shared-props design approved with two
  adjustments (Users+Impersonation moved to batch 1, written per-batch
  verification checklist required); Batch 0 (Foundation) complete; Batch 1
  (Layouts/Navigation, all 3 tiers: sidebar, mobile bottom bar, mobile More
  drawers) complete, verified live in a real browser against all 3 roles;
  Batch 2 (Users + Impersonation) complete — fixed the live
  always-shows-Impersonate-for-admins bug, verified live; Batch 3
  (Students/Guardians, 4 files, 16 occurrences) complete, verified live;
  Batch 4 (Grades/Subjects, 4 files, 10 occurrences) complete, verified
  live; Batch 5 (Exams, 3 files, 11 occurrences) complete, verified live —
  includes one flagged, intentional behavior change (teachers now see the
  Edit-exam affordance they already had permission for), plus a follow-up
  fix tightening the Edit gate to match ExamPolicy's ownership scoping
  exactly; Batch 6 (Timetables, 6 files) complete, verified live —
  resolved the "timetable-availability.manage scoping unverified" flag
  from Phase 2 (confirmed: teacher scoped, admin unrestricted, no Policy
  exists) and fixed a real pre-existing bug in Availability/Create.jsx
  (wrong ID type sent for teacher_id) — see Phase log.
- [ ] **Phase 7** — Verification pass

Scope reminder: Head Teacher role is a planned follow-up **after** this migration —
explicitly out of scope here. The only intended behavior change in this whole
migration is accident/incident report create/review collapsing to admin-only
(Phase 1) — everything else must faithfully reproduce current behavior for
`super_admin`, `teacher`, `guardian`.

---

## Surviving roles — permission inventory (Phase 2)

**Structural note, applies to every row below:** `super_admin` operates in a
completely separate route namespace (`routes/super-admin.php`, gated by
`super.admin` middleware) and is explicitly **blocked** from the entire
school-level route group by `school.admin` middleware (`routes/web.php:100`). So
for every module except Users, `super_admin`'s real answer is uniformly **"N/A —
blocked from school context entirely,"** not a per-module permission. Written as
"N/A (blocked)" throughout rather than repeated per row.

Rows are split by action (view/create/edit/delete) wherever the codebase actually
distinguishes them, rather than flattened to one access level per module — this is
the granularity Phase 3's permission taxonomy will need anyway.

| Module / action | `super_admin` | `admin` | `teacher` | `guardian` | Enforcement (file:line) |
|---|---|---|---|---|---|
| Students — view list/show | N/A (blocked) | ✅ | ✅ | ❌ (dead-branch grant, see risk log) | Route `role:admin,teacher` (`web.php:137,149`); `StudentPolicy::viewAny` admin/teacher; `view` also allows a guardian linked to that student (`StudentPolicy.php:10-27`), but guardian has no route to reach it |
| Students — create/edit/delete | N/A (blocked) | ✅ | ❌ | ❌ | Route `role:admin` (`web.php:141,153`); `StudentPolicy` create/update/delete all admin-only (`StudentPolicy.php:29-42`) |
| Teachers — view/create/edit/delete | N/A (blocked) | ✅ | ❌ | ❌ | Single `role:admin` block, no read/write split (`web.php:198-206`); `TeacherPolicy` every method admin-only (`TeacherPolicy.php:10-33`) |
| Guardians — view list/show | N/A (blocked) | ✅ | ✅ | ❌ (dead-branch grant) | Route `role:admin,teacher` (`web.php:162,175`); `GuardianPolicy::view` also allows viewing one's own record (`GuardianPolicy.php:10-26`), unreachable — guardian has no route to `/guardians` |
| Guardians — create/edit/delete | N/A (blocked) | ✅ | ❌ | ❌ | Route `role:admin` (`web.php:166,189`); Policy admin-only |
| Users — school-level mgmt | N/A (separate capability, see next row) | ✅ (school-scoped) | ❌ | ❌ | Route `role:admin` covers all of index/create/store/show/edit/update/destroy/reset-password/toggle-status (`web.php:209-219`); no Policy class — pure route gate |
| Users — super-admin-level mgmt (all schools) | ✅ | N/A | N/A | N/A | `routes/super-admin.php:29-33`, gated only by `super.admin`, separate `SuperAdmin\UserController` — unrelated capability that happens to share the word "Users" with the row above |
| Fees (dashboard, transport, tuition, universal, invoices, payments) | N/A (blocked) | ✅ | ❌ | ❌ (own invoices only, separate route) | Route `role:admin` for the whole module (`web.php:549-604`); guardian's own-invoice viewing is a separate, narrower route `/guardian/invoices*` (`web.php:607-611`, `role:guardian`), not part of this module |
| Settings (profile, academic years/terms, preferences, headteacher_signature) | N/A (blocked) | ✅ | ❌ | ❌ | Route `role:admin` throughout (`web.php:294-297,523-546`); `SchoolSettingController.php:15,29` redundantly double-checks `isAdmin()` inline |
| Attendance — view | N/A (blocked) | ✅ all | ✅ assigned grades only | ✅ own children only (separate route) | Route `role:admin,teacher` (`web.php:222-226`); `AttendancePolicy::view` scopes teacher to `$user->teacher->grades`, guardian to `$user->guardian->students` (`AttendancePolicy.php:22-42`); guardian's real path is `/guardian/attendance` (`web.php:181`), not this route |
| Attendance — mark/create | N/A (blocked) | ✅ | ✅ assigned grades | ❌ | Route `role:admin,teacher` (`web.php:223`); Policy admin/teacher (`AttendancePolicy.php:47-51`) |
| Attendance — delete | N/A (blocked) | ✅ (policy-only, no route calls it) | ❌ | ❌ | No delete route found in `web.php`; `AttendancePolicy::delete` admin-only (`AttendancePolicy.php:75-79`) but currently unreachable via any route |
| Grades — view list/show | N/A (blocked) | ✅ | ✅ (single-record scoped to assigned grades) | ❌ | Route `role:admin,teacher` (`web.php:111,120`); `GradePolicy::view` scopes teacher via `$user->teacher->grades()` (`GradePolicy.php:10-27`) |
| Grades — create/edit/delete | N/A (blocked) | ✅ | ❌ | ❌ | Route `role:admin` (`web.php:115-118,124-134`); Policy admin-only |
| Subjects — view | N/A (blocked) | ✅ | ✅ (unscoped, no per-teacher filtering) | ❌ | Route `role:admin,teacher` (`web.php:231,244`); `SubjectPolicy` admin/teacher, no scoping (`SubjectPolicy.php:13-24`) |
| Subjects — create/edit/delete | N/A (blocked) | ✅ | ❌ | ❌ | Route `role:admin` (`web.php:235-242`); Policy admin-only |
| Exams — view | N/A (blocked) | ✅ all | ✅ assigned grades only | ❌ (no route) | Route `role:admin,teacher` (`web.php:261-268`); `ExamPolicy::view` scopes teacher (`ExamPolicy.php:21-35`) |
| Exams — create | N/A (blocked) | ✅ | ✅ | ❌ | Route `role:admin,teacher` (`web.php:261-268`); `ExamPolicy::create` admin OR teacher (`ExamPolicy.php:40-43`) |
| Exams — **update** | N/A (blocked) | ✅ | ❌ — **see disagreement #1** | ❌ | Same route group as create (`web.php:261-268`, doesn't distinguish); `ExamPolicy::update` is admin-only, comment says "Teachers can only VIEW exams, not edit them" (`ExamPolicy.php:48-53`) — contradicts `create` on the very same Policy class |
| Exams — delete | N/A (blocked) | ✅ | ❌ | ❌ | Separate `role:admin`-only route group (`web.php:270-272`); Policy admin-only — consistent |
| Exam Results — view/create/update | N/A (blocked) | ✅ | ✅ assigned grades | ❌ (dead-branch grant, see disagreement #3) | Route `role:admin,teacher` (`web.php:275-279`); `ExamResultPolicy::viewAny`/`view` also grant + scope guardian (`ExamResultPolicy.php:13-16,34-38`), but no route lets a guardian reach `ExamResultController` — guardians see results via the separate Reports module instead |
| Exam Results — delete | N/A (blocked) | ✅ (policy-only, unreachable) | ❌ | ❌ | No route found; `ExamResultPolicy::delete` admin-only (`ExamResultPolicy.php:73-77`) |
| Timetable — Periods/Rooms/Slots, view | N/A (blocked) | ✅ | ✅ (Slots: single-record scoped to `teacher_id`) | ❌ | Route `role:admin,teacher` per sub-resource (`web.php:356-367,376-387,396-407`); `TimetableSlotPolicy::view` scopes via `$timetableSlot->teacher_id === $user->teacher->id` (`TimetableSlotPolicy.php:21-33`) |
| Timetable — Periods/Rooms/Slots, create/edit/delete | N/A (blocked) | ✅ | ❌ | ❌ | Route `role:admin` per sub-resource (`web.php:360-363,369-373,380-383,389-393,400-403,409-413`); Policies admin-only, consistent |
| Timetable — Templates (create/edit/publish/archive/generate) | N/A (blocked) | ✅ | ❌ (**no view route exists**, see disagreement #2) | ❌ | Single `role:admin` block, no read tier (`web.php:333-353`); `TimetableTemplatePolicy::view` grants a teacher view access to their own grade's template (`TimetableTemplatePolicy.php:21-33`) but no route can ever trigger it |
| Timetable — Dashboard/Blueprints | N/A (blocked) | ✅ | ❌ | ❌ | `role:admin` only, no split (`web.php:300-330`) |
| Timetable — My Timetable / My Availability | N/A (blocked) | — (admin uses admin views instead) | ✅ own only | ❌ | `/my-timetable` is `role:teacher`-only (`web.php:323-325`); Availability CRUD is `role:admin,teacher` (`web.php:416-424`) with **no Policy file** — pure route gate; whether a teacher could edit another teacher's availability record wasn't independently verified against controller internals — flagged unverified, not asserted either way |
| Reports — view (own students / all) | N/A (blocked) | ✅ all | ✅ assigned grades | ✅ own children only | Route `role:admin,teacher,guardian` — all three school-level roles allowed (`web.php:282-285`) |
| Reports — save/lock/unlock comment | N/A (blocked) | ✅ | ✅ own, if not locked | ❌ | Route `role:admin,teacher` (`web.php:287-291`); `ReportCommentPolicy::update` admin always, teacher only via `canEditTeacherComment()`; `create` admin/teacher; `delete`/`manageLock` admin-only (`ReportCommentPolicy.php:47-68`) |
| Reports — "Headteacher's Comment" + signature | N/A (blocked) | ✅ exclusively | ❌ | ❌ | `ReportController.php:132,397-398` — hard `abort(403)` for non-admin; signature lives under admin-only Settings. Same "headteacher = admin wearing a hat" conflation already documented in `reports/head-teacher-role-audit-report.md` §1.4 — restated here only because Reports is one of the required modules, not new information |
| Documents — view/upload | N/A (blocked) | ✅ | ✅ | ✅ | No route-level role middleware, just `auth` (`web.php:486-494`); `DocumentPolicy::viewAny`/`create` both hardcoded `return true` for all 4 roles (`DocumentPolicy.php:13-16,61-64`) |
| Documents — view specific/download | N/A (blocked) | ✅ all | ✅ own only | ✅ own + children's | `DocumentPolicy::view` scopes per entity type (`DocumentPolicy.php:21-56`) |
| Documents — verify/reject/delete-any | N/A (blocked) | ✅ | ❌ | ❌ | Route `role:admin` for verify/reject (`web.php:511-514`); `delete` = admin OR uploader-if-pending/rejected (`DocumentPolicy.php:78-92`) |
| Accident/Incident Reports — view | N/A (blocked) | ✅ | ✅ | ✅ (undiscoverable, see disagreement #4) | No route-level role gate (`web.php:711,723`); `viewAny` hardcoded `true` for all authenticated users, verified current post-Phase-1 (`AccidentReportPolicy.php:13-17`, `IncidentReportPolicy.php:13-17` — unchanged by today's edits) |
| Accident/Incident Reports — create | N/A (blocked) | ✅ | ✅ | ❌ | **Today's Phase 1 change**, verified current: `['admin','teacher']` (`AccidentReportPolicy.php:31-35`, `IncidentReportPolicy.php:31-35`); frontend `canCreate` in both `Index.jsx` files matches exactly |
| Accident Reports — review | N/A (blocked) | ✅ exclusively | ❌ | ❌ | **Today's Phase 1 change**, verified current: `role === 'admin'` (`AccidentReportPolicy.php:56-65`); frontend `canReview` in `Show.jsx` matches |
| Incident Reports — updateStatus | N/A (blocked) | ✅ | ✅ | ❌ | **Unchanged by Phase 1**, confirmed directly: `['admin','teacher']` (`IncidentReportPolicy.php:56-65`); frontend `Show.jsx:87` matches |
| Accident/Incident Reports — update-own/delete | N/A (blocked) | ✅ both | ✅ update-own only, if not closed | ❌ | `update`: reporter-or-admin, not closed; `delete`: admin-only both (`AccidentReportPolicy.php:40-51`, `IncidentReportPolicy.php:40-51`) |

**Follow-up pass (2026-08-26):** the four rows below cover modules missed from the
original 13-module checklist (that list came from the Head Teacher audit's scope,
which wasn't actually a complete map of the app). Same method, same verification
standard as the rows above — not a lower bar.

| Quran dashboard — view | N/A (blocked) | ✅ school-wide stats | ✅ own teaching load, scoped | ✅ own children, scoped | Route `role:admin,teacher,guardian` (`web.php:434-436`); `QuranController::index` branches per role, each with its own scoped query (`teacherStats`/`guardianStats`) — genuinely scoped in the controller, verified, not just role-gated |
| Quran homework — view (list) | N/A (blocked) | ✅ | ✅ | ❌ (no route) | Route `role:admin,teacher` only (`web.php:439-441`) |
| Quran homework — view (single/report) | N/A (blocked) | ✅ | ✅ | ✅ own children only | Route `role:admin,teacher,guardian` (`web.php:461-464`); `QuranHomeworkPolicy::view` itself is role-only, but `QuranHomeworkController::show/studentReport/studentHomework` each add their own inline guardian-ownership `abort(403)` check — scoping lives in the Controller here, not the Policy, unlike every other module in this worksheet |
| Quran homework — create | N/A (blocked) | ✅ any | ✅ grade-scoped | ❌ | `QuranHomeworkPolicy::create` — teacher scoped via `$user->teacher->grades->contains($student->grade_id)`, explicitly commented as intentional |
| Quran homework — update/delete/grade/mark-ungraded | N/A (blocked) | ✅ | ⚠️ **unscoped — flagged, see disagreements** | ❌ | `QuranHomeworkPolicy::update`/`delete` — no grade-scoping at all; any teacher at the school can edit/delete/grade any other teacher's homework record. `grade()`/`markUngraded()` controller actions reuse the same `update` gate |
| Quran schedule — view (list/single) | N/A (blocked) | ✅ school-wide | ✅ own only, scoped via `teacher_id` | ⚠️ **unscoped — live data-exposure, see disagreements** | Route `role:admin,teacher,guardian` (`web.php:469`); admin/teacher correctly scoped, but guardian branch (`QuranSchedulePolicy` + `QuranScheduleController::index`) has **zero scoping to the guardian's own children** |
| Quran schedule — create/update/delete | N/A (blocked) | ✅ any | ✅ create: grade-scoped; update/delete: own-schedule-only via `teacher_id` | ❌ | `QuranSchedulePolicy` — internally consistent, `delete` reuses `update` gate |
| Policies & Regulations — view | N/A (blocked) | ✅ | ✅ | ✅ | `PolicyPolicy::view` — all authenticated, additionally scoped to same school (tenant isolation, not role) |
| Policies & Regulations — acknowledge | N/A (blocked) | ✅ | ✅ | ✅ | Distinct action from view; state-gated — only if `status === 'published' && requires_acknowledgment` |
| Policies & Regulations — create/edit/delete/publish/revisions | N/A (blocked) | ✅ | ❌ | ❌ | All identically admin-only — route and Policy agree exactly, no disagreements found for this module. `delete` has an extra state guard: cannot delete a published policy |
| Document Categories — view | N/A (blocked) | ✅ | ⚠️ **dead grant — see note below table** | ⚠️ **dead grant** | `DocumentCategoryPolicy::viewAny`/`view` explicitly grant teacher/guardian, but the entire route group (`web.php:499-507`) is `role:admin` only — same "Policy allows, no route reaches it" shape as the already-decided disagreements #2/#3 |
| Document Categories — create/edit/delete | N/A (blocked) | ✅ | ❌ | ❌ | `delete` has a state guard: blocked if any documents currently use the category |
| Impersonation | — see dedicated Risks section below, not finalized in this table — | | | | Three separate, only-partially-related code paths found (one entirely dead). Deliberately not summarized as a single row here — doing so would misrepresent how fragmented this actually is. Full write-up in Risks. |

**Note on Document Categories' dead grant:** teachers/guardians aren't actually
blind to category *names* — `DocumentController::create()` (the existing, already-
taxonomized `documents.*` upload flow) reads `DocumentCategory::active()->get()`
directly for any authenticated role, entirely bypassing `DocumentCategoryPolicy`.
So dropping this dead Policy grant (consistent with the established precedent)
doesn't remove any capability teachers/guardians currently rely on — they never
reached it through this Policy to begin with.

---

## Permission taxonomy (Phase 3)

**Naming scheme:** `{module}.{action}`, dot notation (Spatie's standard convention).
Multi-word module names are kebab-case (`exam-results`, `report-comments`,
`timetable-periods`, `accident-reports`, `incident-reports`). Actions are `view`,
`create`, `update`, `delete` where the module has real CRUD granularity; a single
`.manage` permission where Phase 2 found the current code has no finer split
(e.g. Settings, Fees, Timetable Templates) — inventing a split the codebase doesn't
currently have would misrepresent "what exists today," which is this whole
migration's point. A few modules get custom action names matching real custom
Policy methods (`.review`, `.verify`, `.reject`, `.update-status`, `.manage-lock`).

Derived directly from the Phase 2 table plus the three decisions above — dead
Policy grants (decision on disagreements #2/#3) are **not** included below; the
Exams ownership-fix (decision #1) **is** included as the new intended behavior.

`super_admin` gets its own small, separate namespace (`super-admin.*`) rather than
being forced into the same per-module grid — per Phase 2's structural finding, it
doesn't participate in the school-level module system at all.

### School-level permissions

| Permission | `admin` | `teacher` | `guardian` | Ownership/state scoping (stays as in-Policy logic, not a Spatie role/permission concept) |
|---|---|---|---|---|
| `students.view` | ✅ | ✅ | ❌ | — |
| `students.create` | ✅ | ❌ | ❌ | — |
| `students.update` | ✅ | ❌ | ❌ | — |
| `students.delete` | ✅ | ❌ | ❌ | — |
| `teachers.view` | ✅ | ❌ | ❌ | — |
| `teachers.create` | ✅ | ❌ | ❌ | — |
| `teachers.update` | ✅ | ❌ | ❌ | — |
| `teachers.delete` | ✅ | ❌ | ❌ | — |
| `guardians.view` | ✅ | ✅ | ❌ | — |
| `guardians.create` | ✅ | ❌ | ❌ | — |
| `guardians.view-inactive` | ✅ | ❌ | ❌ | **Phase 5 addition.** `/guardians/inactive` is grouped with the admin-only create/import routes today, not with the admin+teacher `guardians.view` index — despite being a view action. Kept as its own permission rather than folded into `guardians.view` (which would newly grant teacher access to it) or into `guardians.create` (semantically wrong name for a GET listing) — preserves exact current admin-only access under an honest name |
| `guardians.update` | ✅ | ❌ | ❌ | — |
| `guardians.delete` | ✅ | ❌ | ❌ | — |
| `users.view` | ✅ | ❌ | ❌ | School-scoped (admin only ever sees their own school's users — existing tenant isolation, not a new permission concept) |
| `users.create` | ✅ | ❌ | ❌ | " |
| `users.update` | ✅ | ❌ | ❌ | " |
| `users.delete` | ✅ | ❌ | ❌ | " |
| `users.reset-password` | ✅ | ❌ | ❌ | " |
| `users.toggle-status` | ✅ | ❌ | ❌ | " |
| `users.impersonate` | ✅ | ❌ | ❌ | Path A (`Route::impersonate()`, `Users/Index.jsx`+`Show.jsx`). School-scoped by the package's own guard checks (`canBeImpersonated()` blocks admin targets, blocks self, blocks nested impersonation). **Not reachable by `super_admin`** despite `canImpersonate()` returning true for that role — `school.admin` middleware blocks super_admin from this whole route group; super_admin's real impersonation path is `super-admin.schools.impersonate` below, a structurally different capability |
| `fees.manage` | ✅ | ❌ | ❌ | Covers dashboard/transport/tuition/universal/invoices/payments — Phase 2 found no finer split in current code |
| `fees.view-own-invoices` | ❌ | ❌ | ✅ | Guardian scoped to their own invoices only — separate route/capability from `fees.manage`, not a restricted view of it |
| `settings.manage` | ✅ | ❌ | ❌ | Covers profile/academic years/terms/preferences/headteacher_signature — no finer split in current code |
| `attendance.view` | ✅ (all) | ✅ (scoped) | ❌ | Teacher scoped to `$user->teacher->grades` |
| `attendance.create` | ✅ | ✅ (scoped) | ❌ | Teacher scoped to assigned grades |
| `attendance.delete` | ✅ | ❌ | ❌ | **Admin-only-but-inert** — no route currently calls this at all (Phase 2 disagreement #6, deferred, carried forward as-is) |
| `attendance.view-own-children` | ❌ | ❌ | ✅ | Guardian scoped to `$user->guardian->students`; separate route (`/guardian/attendance`) from `attendance.view` |
| `guardian-children.view` | ❌ | ❌ | ✅ | **Phase 5 addition.** `/guardian/children` (`GuardianChildrenController::index`) — guardian's own children-summary dashboard, missed by the original taxonomy pass since it isn't Policy-backed (route-middleware-only, `role:guardian`) |
| `grades.view` | ✅ | ✅ (scoped) | ❌ | Teacher scoped to assigned grades, single-record only (list view unscoped per Phase 2) |
| `grades.create` | ✅ | ❌ | ❌ | — |
| `grades.update` | ✅ | ❌ | ❌ | — |
| `grades.delete` | ✅ | ❌ | ❌ | — |
| `streams.view` | ✅ | ❌ | ❌ | **Phase 5 addition (2026-08-26).** `StreamPolicy`/`StreamController`/`/streams` routes — missed by both the original Phase 2/3 pass and the follow-up pass, surfaced while mapping routes to permissions for Phase 5. No ambiguity: every Policy method is a plain `isAdmin()` check, route middleware is `role:admin` throughout, no scoping/ownership logic anywhere — the cleanest module found all migration |
| `streams.create` | ✅ | ❌ | ❌ | " |
| `streams.update` | ✅ | ❌ | ❌ | Covers update and `unlink` (Policy reuses the `update` gate for both) |
| `streams.delete` | ✅ | ❌ | ❌ | " |
| `subjects.view` | ✅ | ✅ | ❌ | Unscoped — no per-teacher filtering exists today |
| `subjects.create` | ✅ | ❌ | ❌ | — |
| `subjects.update` | ✅ | ❌ | ❌ | — |
| `subjects.delete` | ✅ | ❌ | ❌ | — |
| `exams.view` | ✅ (all) | ✅ (scoped) | ❌ | Teacher scoped to assigned grades |
| `exams.create` | ✅ | ✅ | ❌ | — |
| `exams.update` | ✅ (all) | ✅ **(scoped — Decision 1)** | ❌ | **Changed behavior, deliberate:** teacher scoped to exams where `created_by === $user->id` (`exams.created_by` column already exists). Implementation lands in Phase 5, not before. |
| `exams.delete` | ✅ | ❌ | ❌ | — |
| `exam-results.view` | ✅ (all) | ✅ (scoped) | ❌ | Teacher scoped to assigned grades. Guardian dropped per decision on disagreements #2/#3 — guardians see results via `reports.view` instead |
| `exam-results.create` | ✅ | ✅ (scoped) | ❌ | Teacher scoped to assigned grades |
| `exam-results.update` | ✅ | ✅ (scoped) | ❌ | Teacher scoped to assigned grades |
| `exam-results.delete` | ✅ | ❌ | ❌ | **Admin-only-but-inert** — no route calls this (same deferred disagreement #6) |
| `timetable-periods.view` | ✅ | ✅ | ❌ | — |
| `timetable-periods.manage` | ✅ | ❌ | ❌ | Create/update/delete |
| `timetable-rooms.view` | ✅ | ✅ | ❌ | — |
| `timetable-rooms.manage` | ✅ | ❌ | ❌ | — |
| `timetable-slots.view` | ✅ (all) | ✅ (scoped) | ❌ | Teacher scoped to `$timetableSlot->teacher_id === $user->teacher->id` |
| `timetable-slots.manage` | ✅ | ❌ | ❌ | — |
| `timetable-templates.manage` | ✅ | ❌ | ❌ | Reproduced as-is (Phase 2 disagreement #5, decision: no view tier, faithful reproduction, "worth a second look later" as a separate product decision) |
| `timetable-dashboard.view` | ✅ | ❌ | ❌ | Covers Dashboard + Blueprints, no finer split |
| `timetable-schedule.view-own` | ❌ | ✅ | ❌ | Teacher's own generated schedule (`/my-timetable`). **Renamed 2026-08-26** from `timetable.view-own`, which broke the `{module}.{action}` pattern — this name matches the sibling `timetable-*` permissions and the feature's own UI label ("My Timetable") |
| `timetable-availability.manage` | ✅ (unrestricted) | ✅ (scoped) | ❌ | **Resolved in Phase 6 Batch 6 (2026-08-27)** — confirmed by reading `TeacherAvailabilityController.php` directly (no Policy exists). Teacher is scoped to own records on every action (`index` query-filtered, `store`/`show`/`edit`/`update`/`destroy` all 403 on mismatch). Admin has **no equivalent restriction at all** — can view/edit/delete any teacher's record, asymmetric from the Exams/Quran "one Policy, isAdmin-bypasses-ownership" shape since here there's no Policy and no inline admin-side check either. |
| `reports.view` | ✅ (all) | ✅ (scoped) | ✅ (scoped) | Teacher scoped to assigned grades; guardian scoped to own children |
| `report-comments.create` | ✅ (always) | ✅ (scoped) | ❌ | **Corrected 2026-08-26 (Phase 5 finding).** Original rows were reverse-engineered from `ReportCommentPolicy`/`ReportCommentController` — turns out that whole pair is dead code, zero routes reference `ReportCommentController`. The real, live route (`ReportController::saveComment`) has its own separate inline logic: teacher scoped to being the **class teacher** for the student's grade specifically (`grades.is_class_teacher` pivot flag — tighter than "assigned to the grade"), not the ownership pattern the dead Policy claimed. One save action handles both create and edit (upsert) — no separate `.update` permission, since the real code never distinguishes the two. **Also surfaces a live gap, not fixed here:** this save path does not check whether the comment is locked before overwriting it — the "locked" protection the dead Policy claimed (`canEditTeacherComment()`) is not actually enforced on this path today |
| `report-comments.lock` | ✅ (always) | ✅ (scoped) | ❌ | **Renamed/corrected from `report-comments.manage-lock`, same finding as above.** Real code (`ReportController::lockComment`): teacher can lock their own class's teacher-type comment; headteacher-type comments are admin-only. Genuinely different accessors than `.unlock` below, which the old single `manage-lock` permission didn't distinguish |
| `report-comments.unlock` | ✅ | ❌ | ❌ | `ReportController::unlockComment` — admin-only unconditionally, regardless of comment type (checked first, before anything else in the method) |
| `reports.headteacher-comment` | ✅ | ❌ | ❌ | The pre-existing "headteacher = admin" conflation, unrelated to this migration's scope — carried forward as-is, see `head-teacher-role-audit-report.md` §1.4 |
| `documents.view` | ✅ (all) | ✅ (scoped) | ✅ (scoped) | Teacher scoped to own Teacher-entity docs; guardian scoped to own + linked students' docs |
| `documents.create` | ✅ | ✅ | ✅ | All authenticated roles |
| `documents.update` | ✅ | ❌ | ❌ | **Phase 5 addition.** `DocumentPolicy::update()` (edit/update actions) was missing from the original taxonomy — plain `isAdmin()` check, no scoping, no ambiguity |
| `documents.verify` | ✅ | ❌ | ❌ | — |
| `documents.reject` | ✅ | ❌ | ❌ | — |
| `documents.delete` | ✅ (any) | ✅ (scoped) | ✅ (scoped) | Non-admin: uploader-only AND status is pending/rejected — ownership + state |
| `accident-reports.view` | ✅ | ✅ | ✅ | Reachable for guardian but no nav link exists (Phase 2 disagreement #4, deferred) |
| `accident-reports.create` | ✅ | ✅ | ❌ | — |
| `accident-reports.review` | ✅ | ❌ | ❌ | — |
| `accident-reports.update` | ✅ | ✅ (scoped) | ❌ | Teacher scoped to own report AND status ≠ closed |
| `accident-reports.delete` | ✅ | ❌ | ❌ | — |
| `incident-reports.view` | ✅ | ✅ | ✅ | Same nav-link gap as accident-reports.view |
| `incident-reports.create` | ✅ | ✅ | ❌ | — |
| `incident-reports.review` | ✅ | ✅ | ❌ | **Renamed 2026-08-26** from `incident-reports.update-status` — unified with `accident-reports.review` since both represent the same underlying action (examining/closing out a report); "review" was kept over "update-status" as the more specific term, matching `AccidentReportPolicy`'s own method name/comments. **Name-only rename** — teacher keeps ✅ here (pre-migration: `in_array($user->role, ['admin','teacher'])`), unlike `accident-reports.review` which is genuinely admin-only; the two permissions share a name pattern, not a scope |
| `incident-reports.update` | ✅ | ✅ (scoped) | ❌ | Same ownership + state pattern as accident-reports.update |
| `incident-reports.delete` | ✅ | ❌ | ❌ | — |
| `quran-dashboard.view` | ✅ | ✅ | ✅ | **Follow-up pass addition (2026-08-26).** All three genuinely scoped in the controller (school-wide/own-teaching-load/own-children respectively) — see ownership-scoping summary below |
| `quran-homework.view` | ✅ | ✅ | ❌ | Covers the list view and general single-record view. Guardian's access to a specific homework record is a *separate* permission below, not a restricted view of this one |
| `quran-homework.view-own` | ❌ | ❌ | ✅ | Guardian, own children only, via student-report/student-homework routes — scoping lives in the Controller, not a Policy, unlike everywhere else in this taxonomy |
| `quran-homework.create` | ✅ | ✅ (scoped) | ❌ | Teacher scoped to assigned grades |
| `quran-homework.update` | ✅ | ✅ (scoped) | ❌ | Covers update/delete/grade/mark-ungraded (Policy reuses one gate for all). **Resolved 2026-08-26** (disagreement #8) — teacher scoped to `teacher_id`, matching the frontend's own stricter check that was previously unenforced. Implemented ahead of Phase 5, see Phase log |
| `quran-schedule.view-all` | ✅ | ✅ | ❌ | **Phase 5 addition, found while mapping routes.** `/quran-schedule` (list/index) is `role:admin,teacher` today — guardian was never included. `QuranSchedulePolicy::viewAny()` technically returns true for guardian too, but the controller's `index()` never calls it (dead grant, same pattern as disagreements #2/#3/#9) — dropped, not carried forward. Kept as a distinct permission from `.view` below so the index listing doesn't inherit guardian access via the single-record ability |
| `quran-schedule.view` | ✅ | ✅ (scoped) | ✅ (scoped) | Single-record view (`/quran-schedule/{id}`). Teacher scoped via `teacher_id`. **Resolved 2026-08-26** (disagreement #7) — guardian now scoped via `Guardian::allStudents()`, closing a live cross-family data-exposure. Implemented ahead of Phase 5 as an urgent security fix, see Phase log |
| `quran-schedule.create` | ✅ | ✅ (scoped) | ❌ | Teacher scoped to assigned grades |
| `quran-schedule.update` | ✅ | ✅ (scoped) | ❌ | Teacher scoped to own schedules via `teacher_id`; delete reuses this gate |
| `policies.view` | ✅ | ✅ | ✅ | **Follow-up pass addition.** All authenticated; tenant-scoped only (not a role distinction) |
| `policies.acknowledge` | ✅ | ✅ | ✅ | State-gated: only if published + requires acknowledgment |
| `policies.manage` | ✅ | ❌ | ❌ | Create/update/delete/publish/revisions — route and Policy agree exactly, no disagreements. `delete` has a state guard (cannot delete a published policy) |
| `document-categories.view` | ✅ | ❌ | ❌ | **Follow-up pass addition.** Teacher/guardian Policy grant dropped per disagreement #9 — dead code, no route reaches it, same precedent as disagreements #2/#3 |
| `document-categories.manage` | ✅ | ❌ | ❌ | Create/update/delete; `delete` has a state guard (blocked if any documents use the category) |

### Super-admin namespace (separate — does not participate in the grid above)

| Permission | `super_admin` |
|---|---|
| `super-admin.schools.manage` | ✅ |
| `super-admin.users.manage` | ✅ (cross-school — a structurally different capability from school-level `users.*`, not a superset of it in the same table) |
| `super-admin.settings.manage` | ✅ |
| `super-admin.schools.impersonate` | ✅ (Path B, `SuperAdmin\SchoolController::impersonate()`. Deliberately a distinct permission from `users.impersonate`, not folded into it (2026-08-26 decision, resolving open question #2) — the capability shape genuinely differs: super_admin can only impersonate an **admin** of a chosen school, via the admin-picker, bypasses the package's own guard checks entirely, and is reached through the Super Admin → Schools UI, not the Users pages) |

### Summary: every ownership/state-scoped permission (26 confirmed, 0 pending)

These stay as in-Policy scoping logic even after Spatie is in place — Spatie
governs *whether a role has the permission at all*, not *which records* a
permission-holder can touch. Listed together here so Phase 5 has a checklist of
every Policy that needs to keep its scoping logic when rewritten to call
`$user->can(...)`:

`attendance.view` (teacher), `attendance.create` (teacher), `attendance.view-own-children` (guardian),
`grades.view` (teacher), `exams.view` (teacher), `exams.update` (teacher — new),
`exam-results.view` / `.create` / `.update` (teacher), `timetable-slots.view` (teacher),
`timetable-availability.manage` (teacher, scoped; admin unrestricted — resolved Batch 6), `reports.view` (teacher + guardian),
`report-comments.create` (teacher, class-teacher only — corrected 2026-08-26),
`report-comments.lock` (teacher, class-teacher only — corrected 2026-08-26),
`documents.view` / `.delete` (teacher + guardian),
`accident-reports.update` / `incident-reports.update` (teacher), `fees.view-own-invoices` (guardian),
`quran-dashboard.view` (teacher + guardian — follow-up pass), `quran-homework.view-own` (guardian),
`quran-homework.create` (teacher), `quran-schedule.create` (teacher), `quran-schedule.update` (teacher),
`quran-homework.update` (teacher, own records only — resolved 2026-08-26, disagreement #8),
`quran-schedule.view` (guardian, own children only — resolved 2026-08-26, disagreement #7)

---

## Risks / open questions / decisions needed

- **Could not run the test suite for Phase 1 verification.** This sandbox's PHP CLI
  is missing the `pdo_sqlite` extension, which `phpunit.xml` requires (in-memory
  sqlite test DB). This is a pre-existing environment gap, confirmed earlier in this
  session before any of this migration's work — not something Phase 1 introduced.
  There are also no existing `AccidentReport`/`IncidentReport` tests to update
  (confirmed via `find tests -iname "*ccident*" -o -iname "*ncident*"` — no results).
  Verified instead via `php -l` on every touched PHP file and a full `pnpm run build`
  of the frontend — both clean.
  - **Checked whether this is fixable in-session (2026-08-26): it isn't, quickly.**
    `php8.5-sqlite3` is a real, available apt package (`apt-cache search` confirms
    it) — not a fundamentally unavailable extension. Interestingly `php8.4-sqlite3`
    is already installed, just for the wrong PHP version (active CLI is 8.5).
    Installing the 8.5 package needs `sudo`, and this sandbox has no passwordless
    sudo (`sudo -n apt-get install ...` → "a password is required"), same
    restriction hit earlier this session for an unrelated check. This is a one-line
    fix on a machine with real sudo access — `sudo apt-get install php8.5-sqlite3`
    — but needs to happen outside this session. **You'll need to run that (or
    `composer test`) yourself before merge.**
- **Pre-existing, unrelated storage bug noticed in `IncidentReportController.php`**
  (attachment uploads at lines using `$file->store('incident-reports', 'public')`
  and `Storage::disk('public')->delete(...)`): this is the same "local disk relies on
  a symlink that Laravel Cloud doesn't persist across deploys" pattern fixed for
  Documents/logos/avatars in an earlier session, but `IncidentReportController` was
  explicitly out of scope for that R2 migration. Not touched here either — flagging
  per instruction, not fixing silently, since it's unrelated to role cleanup.
- **`SuperAdmin/Users/Index.jsx`'s role filter dropdown was already incomplete
  before this change** — it never included `super_admin` as a filter option, even
  though `super_admin` is a real, populated role. Pre-existing, unrelated to the 6
  deleted roles (I only removed the 4 of the 6 that were present in that specific
  list — `accountant/receptionist/nurse/it_staff`; `maid`/`cook` were never in this
  particular dropdown to begin with). Not fixed, just noted — it's not a
  role-deletion regression, and outside this task's scope.
- **`InvoiceController::destroy()` / `clearAll()` have no real authorization or
  safety guard, discovered during the Phase 5 exhaustive Policy trace
  (2026-08-27).** `destroy()` calls no `$this->authorize(...)` at all — not even
  inline — and deletes the invoice (cascading to payments) unconditionally; its
  own comment reads *"Allow deletion even with payments (for development)"*.
  `clearAll()` wipes every invoice, line item, and payment for the school, same
  pattern. Both sit only behind the route group's `permission:fees.manage`
  middleware (admin-only) — no ownership/state check either at the Policy layer
  (`GuardianInvoicePolicy::delete()` is never actually invoked by this
  controller) or inline. This is pre-existing, unrelated to the Spatie
  migration — not introduced or touched by Phase 5, and **not fixed here**.
  Flagging at the same tier as the other pre-existing/unrelated risks in this
  section: needs a deliberate decision later (add a payments-exist guard? gate
  `clearAll()` behind something stronger than `fees.manage`? remove it if it
  really is dev-only?) — not something to silently patch as a side effect of
  this migration.
- **Mobile nav "More" drawer duplicates the Quran entry for madrasah
  teacher/guardian, found during Phase 6 Batch 1 (2026-08-27).** Quran shows
  as both a fixed bottom-bar icon *and* again inside the More drawer for
  those two roles, while Guardian's More drawer explicitly avoids the same
  duplication for "Reports" (`{!isMadrasah && <Reports/>}`). Per your
  explicit decision, **preserved as-is, not fixed** — reads as an
  intentional quick-access-shortcut-plus-full-listing pattern, and changing
  nav UX wasn't this phase's job regardless. Flagging for a deliberate
  decision later, same tier as the two items above.

### Phase 2 cross-layer disagreements (found, not fixed — reproduce faithfully unless told otherwise)

1. **Exams: `create` contradicts `update` for teachers.** `ExamPolicy::create` lets
   a teacher create an exam; `ExamPolicy::update` is admin-only with a comment
   saying "Teachers can only VIEW exams, not edit them" — so a teacher can create
   an exam they can never themselves edit afterward. Both sit under the same route
   middleware group, so only the Policy enforces this split. Looks like an actual
   bug, not intentional design — **flagging for a decision, not fixing**: should
   the Spatie taxonomy reproduce this exactly (teacher gets `exams.create` but not
   `exams.update`), or is this worth raising as "should teacher get update too"?
   Per the non-negotiables, defaulting to reproducing current behavior exactly
   unless you say otherwise.
2. **Three Policy grants are currently dead code — no route can ever reach them:**
   `StudentPolicy::view` (guardian-linked-to-student), `GuardianPolicy::view`
   (guardian-viewing-self), and `TimetableTemplatePolicy::view` (teacher-viewing-own-
   grade's-template) all grant access that the corresponding route middleware never
   offers a path to. Same shape for `ExamResultPolicy::viewAny`/`view`'s guardian
   grant (item 3 below). Question for Phase 3: does the new permission taxonomy
   preserve these as "real" permissions a role technically has (faithful to current
   Policy code) even though nothing currently routes to them, or are they noise to
   drop? Leaning toward preserving them (they're current behavior, however
   unreachable), but flagging since encoding dead permissions into seeded data is a
   judgment call.
3. **Exam Results: guardian is Policy-granted but route-blocked**, same shape as
   #2 — guardians actually see exam results through the separate Reports module,
   not this Policy/Controller pair.
4. **Accident/Incident Reports: guardians can view them (backend allows, no route
   block), but `navigation.js`'s guardian menu has no link to either page** — a
   guardian who knows/guesses the URL gets a real, working page (minus the Create
   button, correctly). Functional but undiscoverable. Not a bug exactly, but the
   guardian's real capability is broader than what the UI advertises — worth a
   decision on whether the nav link should be added at some point (separate from
   this migration, which is reproducing current behavior, not adding new UI).
5. **Timetable's read/write split is inconsistent across its own sub-resources.**
   Periods/Rooms/Slots have a clean admin+teacher-read / admin-only-write split;
   Templates and Dashboard/Blueprints are single admin-only blocks with no read
   tier at all (despite `TimetableTemplatePolicy::view` being written as if one
   should exist — see #2). Not a bug, but means "Timetable" isn't one uniform
   access pattern — Phase 3's taxonomy will need to reflect that per-sub-resource,
   not as one `timetable.*` permission.
6. **Attendance/Exam Results `delete` Policy checks are currently unreachable** —
   no route calls either delete action, so their admin-only restriction is
   currently moot (nothing to restrict). Flagging in case a later phase assumes
   these delete paths are live/tested when they may not be exercised anywhere
   today.

### Follow-up pass disagreements (2026-08-26, from extending Phase 2/3 to the 4 missed modules)

7. ⚠️ **Live guardian data-exposure on Quran Schedules — reachable today, not a
   dead branch, involves specific children's data.** `QuranSchedulePolicy`'s
   guardian branch and `QuranScheduleController::index`'s query both have zero
   scoping to the guardian's own children. Any guardian who navigates to
   `/quran-schedule` (no nav link exists — undiscoverable via UI, but the route
   and Policy both permit it) sees **every** Quran schedule for **every** student
   in the school, and can open any individual one. The equivalent Homework
   guardian-scoping is done correctly (inline controller checks) — Schedule is the
   odd one out. This is structurally the same "policy/route allows, no nav link"
   shape as #4 above, but materially different in stakes: #4 is about incident
   reports being reachable-but-undiscoverable; this is about one guardian being
   able to see another family's child's Quran schedule if they simply guess or
   are given the URL. **Flagging this as higher-priority than a routine
   disagreement** — recommend treating it as a real scoping bug to fix, not
   something to reproduce faithfully, but that's your call to make, not mine to
   assume.
8. **Quran Homework `update`/`delete`/`grade`/`mark-ungraded` is unscoped for
   teacher, while `create` on the same Policy is explicitly grade-scoped with a
   code comment.** Same asymmetric shape as the already-decided Exams
   disagreement (create scoped one way, a sibling action not scoped the same
   way) — but this is a *different* module/Policy, so the earlier Exams decision
   doesn't automatically apply here without your say-so. Additional signal this
   is unintentional: `Quran/Homework/Show.jsx:28` has its own frontend check
   (`auth.user.role === 'admin' || auth.user.id === homework.teacher_id`) that
   *does* correctly restrict the Edit UI to the teacher's own homework — the
   frontend and backend disagree, and the frontend's stricter behavior looks like
   the actually-intended rule. Needs the same kind of decision Exams got:
   reproduce as-is (teacher can edit any homework record), or fix to match what
   the frontend already assumes (teacher scoped to own)?
9. **Document Categories: `DocumentCategoryPolicy` grants teacher/guardian view
   access no route can reach** — structurally identical to the already-decided
   dead-grant pattern (disagreements #2/#3). Applying that same precedent here
   (drop from the taxonomy) rather than re-asking, since the reasoning you gave
   for #2/#3 generalizes directly — noting it here so it's visible this was an
   applied precedent, not a fresh unilateral call.

10. **Report Comments: the taxonomy's original source was dead code.** Found
    while mapping routes to permissions for Phase 5. `ReportCommentPolicy` and
    `ReportCommentController` are a complete, unused pair — zero routes
    reference the controller. The real, live route
    (`ReportController::saveComment`/`lockComment`/`unlockComment`) has its own
    separate inline authorization logic that differs materially: teacher
    access is scoped to being the specific **class teacher** for the grade
    (not just "assigned to the grade"), locking is teacher-capable (not
    admin-only as the dead Policy claimed), and — a live gap, not fixed —
    `saveComment` never checks whether a comment is locked before overwriting
    it, so the lock feature doesn't actually block edits through that path.
    Taxonomy corrected to match real behavior (`report-comments.create`,
    `.lock`, `.unlock`), not fixing the lock-bypass gap itself — flagging it
    here rather than silently fixing or silently leaving it undocumented.

11. **Guardian Invoices: `GuardianInvoicePolicy::view()`'s unconditional
    "teacher can view any invoice" branch was dropped** — structurally
    identical to the already-decided dead-grant pattern (disagreements
    #2/#3/#9). No route (admin `/invoices` or guardian `/guardian/invoices`)
    ever let a teacher reach an action checking this ability. Applying the
    same precedent as #9 rather than re-asking. Current/final behavior:
    `fees.manage` (admin) or `fees.view-own-invoices` (guardian, scoped to
    their own `guardian_id`) — no teacher path at all, which is correct and
    intentional (teachers should never see billing/invoice data). Confirmed
    2026-08-27 as not a regression.

### Decisions on #7 and #8 (made by you, 2026-08-26 — implemented same day)

- **Disagreement #7 (Quran Schedule guardian data exposure) → Decision: real
  security bug, fix immediately, do not wait for Phase 5.** `QuranSchedulePolicy::view()`
  now scopes guardian access to `Guardian::allStudents()` — the same merged
  legacy-column + pivot lookup already used correctly elsewhere in the Quran
  module (`QuranController::guardianStats()`, Homework's inline guardian
  checks). Committed separately from migration-phase work as `30ab72a` on
  `feature/spatie-permissions`, cherry-picked to `one-db` as `0f45b0f` (not yet
  pushed — awaiting your push per this session's established pattern). Two new
  regression tests added to `QuranScheduleTenantIsolationTest.php`. Full suite
  run (94 Quran-related tests, 121/152 project-wide — see Phase log for the
  unrelated pre-existing failures) confirms no regressions.
- **Disagreement #8 (Quran Homework teacher scoping) → Decision: deliberate
  fix, same pattern as the Exams decision, not faithful reproduction.**
  `QuranHomeworkPolicy::update()`/`delete()` now scope teacher access to
  `teacher_id === $user->id`, matching what `Quran/Homework/Show.jsx` already
  (previously non-functionally) assumed. `grade()` and `markUngraded()` both
  authorize against `update`, so this one change covers all four actions.
  New `QuranHomeworkTeacherOwnershipTest.php` (5 tests) confirms non-owning
  teachers are blocked from update/delete/grade/mark-ungraded, while admin and
  the owning teacher are unaffected.

### Impersonation (2026-08-26, resolved 2026-08-26) — now in the Phase 3 taxonomy

Per your explicit instruction, nothing below was resolved unilaterally — every
open question here was written up for your decision, none assumed. This module
turned out to have more going on than "reproduce current behavior" assumes at
first glance: **three separate, only-partially-related code paths**, one of which
was entirely dead. All verified directly against the actual package source and
this app's code, not inferred. **As of 2026-08-26, the two questions that blocked
finalizing the taxonomy (logging, and how to represent super_admin's capability)
are both resolved** — see "Decisions" below. The write-up of all three paths is
kept as-found for the historical record; where a path has since changed, that's
called out inline.

**Path A — the general-purpose route, `Route::impersonate()`.** Registers
`route('impersonate', {id})` / `route('impersonate.leave')` (`web.php:497`, a
package macro), used by `ImpersonateButton.jsx`/`ImpersonationBanner.jsx` on the
regular Users pages. Real package logic, read directly from
`vendor/lab404/laravel-impersonate/src/Controllers/ImpersonateController.php`:
checks `canImpersonate()` (our `User.php:165` — `isSuperAdmin() || isAdmin()`) and
`canBeImpersonated()` (`User.php:174` — `!isSuperAdmin()`), and — package-enforced,
not our own code, easy to miss when reproducing behavior — blocks self-
impersonation and blocks starting a second impersonation while already
impersonating someone. **But** this whole route group sits inside
`Route::middleware(['auth','school.admin','school.active'])` (`web.php:100`), and
`school.admin` blocks `super_admin` entirely — so even though `canImpersonate()`
says super_admin can impersonate, **super_admin can never reach this route**.

**Path B — the super-admin-specific route**, `super-admin.schools.impersonate`
(`routes/super-admin.php:26`) → `SuperAdmin\SchoolController::impersonate()`. This
is how super_admin *actually* impersonates: from Super Admin → Schools, picks a
school, and the controller does
`$school->users()->where('role','admin')->first()` then calls the same underlying
`impersonate()` package method directly — bypassing the package's own controller
entirely, so none of Path A's guard checks (self-impersonation, nested-
impersonation) apply here. Two consequences: super_admin can only ever
impersonate **the first admin user found for a school** (not any arbitrary user,
and not deterministic if a school has more than one admin — no explicit
`orderBy`), a materially different capability shape than Path A's "any user."
**Superseded 2026-08-26** (commit `cb8fe79`): `impersonate()` now requires an
explicit `user_id`, validated against the school's own admin users, and both
frontend trigger points show a picker when a school has more than one admin —
the nondeterminism (open question #5 below) no longer applies.

**Path C — completely dead code.** `ImpersonationController.php`
(`start`/`stop`/`logs`), `ImpersonationLogPolicy` (every method hardcoded `return
false`), and the `Admin/ImpersonationLogs` Inertia page. Verified, not assumed:
zero routes reference `ImpersonationController` anywhere; `ImpersonationLog::
create()` is called in exactly one place in the whole codebase — inside this dead
controller; the package's own `TakeImpersonation`/`LeaveImpersonation` events (the
natural hook for logging the *real* paths A/B) have zero listeners anywhere.
**Net effect: there is currently no audit trail at all for either live
impersonation path**, despite a complete-looking logging subsystem existing.
**Deleted 2026-08-26** (see "Decisions" below) — this whole paragraph now
describes code that no longer exists in the repo.

**Five open questions were raised. Two blocked finalizing the taxonomy and are
now resolved; the other three don't require a permission row and stay open
without blocking Phase 4:**

1. ✅ **RESOLVED (2026-08-26).** Is an audit log supposed to exist? — **No.**
   Your call: only super_admin will ever use impersonation long-term, so
   there's no practical value in tracking "who impersonated who" — it would
   just be super_admin tracking itself. `ImpersonationController.php`,
   `ImpersonationLogPolicy`, `ImpersonationLog` (model + factory), the
   `StoreImpersonationLogRequest`/`UpdateImpersonationLogRequest` FormRequest
   stubs, and `ImpersonationLogSeeder` are all deleted rather than wired up.
   One detail this surfaced: the `impersonation_logs` **table itself was
   already dropped** by a prior migration
   (`2025_11_11_050143_drop_impersonation_logs_table.php`, one day after
   `2025_11_10_150136_create_impersonation_logs_table.php` created it) — so
   there was no live table and nothing to check for data. Deliberately did
   **not** touch either historical migration file (immutable migration
   history, standard practice) — the net effect on a fresh install is
   identical either way, since the drop migration already runs right after
   the create one.
2. ✅ **RESOLVED (2026-08-26).** Does super_admin's narrower Path B capability
   need a distinct permission? — **Yes.** Added as `super-admin.schools.impersonate`
   in the super-admin namespace (see the taxonomy table above), separate from
   admin's `users.impersonate`. This wasn't explicitly re-asked in your latest
   message, which focused on the logging decision — applying the same
   reasoning the super-admin namespace already uses for `super-admin.users.manage`
   ("a structurally different capability... not a superset of it in the same
   table"), since Path B's shape genuinely differs from Path A's (admin-only
   targets, different guard behavior, different trigger UI). **Flagging this
   inference explicitly in case it's not what you intended** — easy to
   rename/re-shape later since Phase 4's seeding is inert.
3. **Still open, not blocking.** The broken `user.roles?.some(...)` frontend
   check (`Users/Index.jsx` desktop + mobile, `Users/Show.jsx`) — not touched.
   No permission row needed for this (it's a UI bug, not an access decision),
   so it doesn't block Phase 4. Left for Phase 6 to naturally resolve, per the
   leaning already noted when this was first raised.
4. **Still open, not blocking.** `ProtectFromImpersonation` middleware remains
   unwired. No permission row needed, doesn't block Phase 4.
5. ✅ **Resolved as a side effect of the Path B admin-picker fix** (commit
   `cb8fe79`, see above) — target selection is now explicit, not first-found.

The taxonomy now includes both `users.impersonate` (admin, Path A) and
`super-admin.schools.impersonate` (super_admin, Path B) in the tables above —
this section stays here as the historical record of how those rows were
derived, rather than being deleted.

### Decisions on the above (made by you, 2026-08-26 — recorded before Phase 3 started)

- **Disagreement #1 (Exams) → Decision: deliberate fix, not faithful reproduction.**
  Teacher gets `exams.update`, scoped to exams they created themselves — same "own
  records only" ownership pattern already used for Attendance/Grades. Feasibility
  confirmed: `exams.created_by` already exists as a column with a `creator()`
  relationship (`app/Models/Exam.php:45`, migration `database/migrations/*_create_exams_table.php`),
  so this needs no schema change. **This is an explicit, on-the-record exception**
  to the "reproduce current behavior exactly" non-negotiable — called out here so
  it isn't mistaken for scope creep later. Implementation happens in Phase 5 (policy
  rewrite), not now — Phase 3 will encode `exams.update` as owned-by-creator for
  teacher in the taxonomy table.
- **Disagreements #2 and #3 (dead Policy grants: Student/Guardian self-view,
  Timetable Template teacher-view, Exam Results guardian-view) → Decision: do NOT
  carry into the new taxonomy.** These are Policy branches no current route can
  reach — genuinely unreachable, not just rarely used. Consciously dropped, not an
  oversight: the new permission set will match what's actually reachable today
  (route + policy agreeing), not what a stray unreachable Policy branch technically
  allows. If any of these capabilities are wanted later, they should be added back
  deliberately with a real route/page, not inherited by accident through faithful
  reproduction. Phase 3's taxonomy table will simply not include these grants for
  guardian/teacher.
- **Disagreement #5 (Timetable's inconsistent read/write split) → Decision:
  reproduce as-is, do not change.** Plausibly intentional (Templates locked down
  tighter than Periods/Rooms/Slots) rather than a bug — unlike Exams, there's no
  internal contradiction (no policy comment claiming the opposite of what the code
  does), just an inconsistency in how tight each sub-resource's access is. Flagged
  as "worth a second look later" — a separate product decision to revisit once
  there's time to confirm intent, out of scope for this migration.
- **Disagreement #4 (Accident/Incident Reports missing guardian nav link) →
  Deferred, no action.** Pure frontend/UX gap, unrelated to permission modeling.
  Left for a separate, later task.
- **Disagreement #6 (Attendance/Exam Results unreachable `delete` checks) →
  Deferred, no action.** No route uses them either way — seed as admin-only-but-
  inert in Phase 3/5, matching current (non-)behavior exactly. Nothing to decide.

---

## Phase log

### Phase 0 — Setup
- Confirmed production deploy branch: `one-db` (per your earlier confirmation in this
  session, re-confirmed rather than assumed here).
- Branched `feature/spatie-permissions` off `one-db`.
- Created this worksheet.

### Phase 1 — Role cleanup

**Data confirmation (from the earlier read-only audit, unchanged):** zero users,
including soft-deleted, exist for any of the 6 roles. Nothing to migrate/reassign.

**Deleted the 6 enum cases + helpers:**
- `app/Enums/UserRole.php` — removed `ACCOUNTANT, RECEPTIONIST, NURSE, IT_STAFF,
  MAID, COOK` cases and their `label()` match arms. `super_admin, admin, teacher,
  guardian` remain.
- `app/Models/User.php` — removed `isAccountant()`, `isReceptionist()`, `isNurse()`,
  `isIT()`, `isMaid()`, `isCook()`. Confirmed via grep these were never called
  anywhere else in the backend — pure dead code removal, zero behavior risk.

**Policy changes — the one approved behavior change (accident/incident
create+review → admin-only), applied narrowly:**
- `AccidentReportPolicy::create()` — was `['admin','teacher','nurse','receptionist']`,
  now `['admin','teacher']`. **Teacher's create capability confirmed present before
  and preserved exactly**, per the instruction to double-check this.
- `AccidentReportPolicy::review()` — was `['admin','nurse']`, now
  `$user->role === 'admin'` (matches the single-role-check style already used by
  this same policy's `delete()` method).
- `IncidentReportPolicy::create()` — same change as AccidentReportPolicy's create.
- `IncidentReportPolicy::updateStatus()` — **left untouched**. It was already
  `['admin','teacher']` with no nurse/receptionist reference — confirmed by reading
  it directly, not assumed.
- `IncidentReportController.php` (`create()` and `edit()`, 2 occurrences) — the
  staff-picker `whereIn('role', [...])` dropdown list was
  `['admin','teacher','nurse','receptionist','it_staff','accountant']`, now
  `['admin','teacher']`. This wasn't a permission gate (Policy already governs
  access), just who shows up in a "tag a staff member" dropdown — but it referenced
  4 of the 6 deleted roles so it needed cleanup regardless.

**Frontend permission-gate discrepancy found and fixed (this is exactly the kind of
find Phase 1's step 6 was checking for — not in the original audit's file list):**
`AccidentReports/Index.jsx`, `IncidentReports/Index.jsx`, and `AccidentReports/Show.jsx`
each had their own client-side `auth.user.role === '...'` / `[...].includes(...)`
checks duplicating the policy logic (`canCreate`, `canReview`). These would have
silently kept showing Create/Review UI to nurse/receptionist accounts (theoretical,
since none exist) after the backend policy changed, had they not been updated to
match. Fixed to mirror the new policy logic exactly (`['admin','teacher']` for
create, `role === 'admin'` for review).

**Cosmetic/labeling cleanup** (no behavior change, just removing dead role
references): `navigation.js` (6 nav-menu stubs removed), `Utils/constants.js`
(`ROLE_OPTIONS`/`ROLE_VALUES` — confirmed only used by test/demo utility files,
not the real Users create/edit dropdown, which is driven by `UserRole::toArray()`
and shrinks automatically), `Utils/badges.js`, `Pages/Users/Show.jsx`,
`Pages/SuperAdmin/Users/Show.jsx`, `Pages/SuperAdmin/Users/Index.jsx` (3 separate
role-keyed objects in this one file), `Components/UI/UIComponentsTest.jsx` (a
demo/kitchen-sink page, one stray `<Badge value="accountant">` line).

**Users create/edit role dropdown (task item 3):** no frontend change needed —
it's entirely driven server-side by `UserRole::toArray()` /
`UserController.php`'s validation rule (`'in:' . implode(',', UserRole::values())`),
so deleting the 6 enum cases automatically shrinks the dropdown and tightens
validation. Confirmed by reading `UserController.php` and `Users/Create.jsx`
directly rather than assuming.

**Full-codebase final sweep (task item 6):** grepped the entire repo (all
extensions, excluding vendor/node_modules/storage/build) for all 6 role strings.
Zero remaining references in application code. One stale doc reference found and
fixed: `CLAUDE.md`'s Authorization section listed the old 10-role enum — updated
to the current 4. (The mention of these role names inside this worksheet itself is
intentional history, not a stray reference.)

**Not run:** the test suite (see Risks section above for why, and what was done
instead).

### Phase 2 — Reverse-engineer current permissions

Went through all four enforcement layers — route middleware (`routes/web.php`,
`routes/super-admin.php`, `routes/api.php`), `User` model helpers, every relevant
Policy class, and frontend JSX role checks — for all 4 surviving roles across the
13 required modules plus Accident/Incident Reports (touched by Phase 1). Used
`reports/head-teacher-role-audit-report.md`'s Part 1 inventory as a starting point
for file:line references, but verified everything against current code rather than
trusting it — necessary since it predates today's role deletions and Policy edits.

Full module × action × role table is above. Six cross-layer disagreements found
and logged in the Risks section rather than silently resolved, per the
non-negotiables — the most notable is #1 (Exams: a teacher can create an exam but
the Policy then blocks them from editing their own creation, which reads as a
genuine bug rather than intentional design).

Key structural finding that shapes Phase 3: `super_admin` isn't really a "role
with module permissions" in the same sense as the other three — it's entirely
walled off from the school-level route group and operates in its own parallel
namespace (mainly super-admin-level Users/Schools management). The Spatie
taxonomy should probably treat it differently rather than trying to force it into
the same per-module permission grid as admin/teacher/guardian.

### Phase 2 decisions (resolved before Phase 3 started)

You resolved all six Phase 2 disagreements before taxonomy work began — full
detail recorded in the Risks section above, summary:
- **Exams:** deliberate fix, not reproduction — teacher gets `exams.update` scoped
  to their own created exams. Explicitly on the record as an intentional behavior
  change, confirmed feasible (`exams.created_by` already exists).
- **Dead Policy grants** (Student/Guardian self-view, Timetable Template
  teacher-view, Exam Results guardian-view): consciously dropped from the new
  taxonomy, not carried forward — they're unreachable via any current route, so
  "faithful reproduction" doesn't apply to them.
- **Timetable's inconsistent read/write split:** reproduced as-is, flagged as
  worth a second look later as a separate product decision.
- **Accident/Incident Reports missing guardian nav link, unreachable
  Attendance/Exam-Results delete checks:** both deferred, no action — unrelated to
  permission modeling / no route exercises them anyway.

### Phase 3 — Permission taxonomy design

Derived the full permission set directly from Phase 2's table plus the decisions
above — no new codebase exploration needed, this was synthesis over
already-gathered facts. `{module}.{action}` dot-notation naming, kebab-case for
multi-word modules. Used a single `.manage` permission (rather than inventing a
finer split) wherever Phase 2 found the current code genuinely has no view/write
distinction (Settings, Fees, Timetable Templates) — matching what actually exists
today was prioritized over a "nicer-looking" but fictional taxonomy.

75 permissions total: 72 school-level (in the main grid) + 3 in a separate
`super-admin.*` namespace, reflecting Phase 2's finding that super_admin doesn't
participate in the same per-module system at all.

18 permissions carry ownership/state scoping that must stay as in-Policy logic
after the Spatie migration — Spatie will only govern *whether a role has a
permission*, never *which records* — listed as an explicit checklist at the end of
the taxonomy section so Phase 5 has something concrete to work against per Policy
file, rather than having to rediscover which permissions need scoping logic by
re-reading Phase 2's prose.

### Phase 2/3 follow-up pass — 4 missed modules (2026-08-26)

The original 13-module checklist came from the Head Teacher audit's scope, which
turned out not to be a full map of the app. Before Phase 4, extended Phase 2 and
Phase 3 to cover four real modules that were missed: Quran, Policies &
Regulations, Document Categories, Impersonation. Same method and verification
standard as the original pass, not a lighter-touch add-on.

**Policies & Regulations, Document Categories:** clean extensions, no surprises
beyond one dead-grant instance (Document Categories) matching an already-decided
precedent, applied directly rather than re-litigated.

**Quran:** found two new disagreements, one materially more urgent than anything
in the original pass — `QuranSchedulePolicy`/`QuranScheduleController` have zero
scoping for guardians, meaning any guardian who reaches `/quran-schedule` (no nav
link, but the route and Policy both allow it) can see every Quran schedule for
every student in the school, not just their own children. This is live and
reachable today, not a dead branch like the earlier "policy allows, no route
reaches it" pattern — flagged prominently rather than filed as a routine
disagreement, and not resolved unilaterally. Second: Quran Homework's
update/delete/grade actions are unscoped for teachers while create is scoped,
mirroring the already-decided Exams asymmetry — but this is a different Policy in
a different module, so that decision doesn't automatically carry over; the
frontend already has its own (currently non-enforced) ownership check here,
suggesting the intended rule.

**Impersonation:** turned out to be three separate, only-partially-related code
paths (a general-purpose route, a super-admin-specific one with different
semantics, and an entirely dead logging subsystem that's never actually
populated). Per your explicit instruction, none of the five things this surfaced
were resolved — written up in full in the Risks section, nothing added to the
taxonomy table yet.

**Two renames applied**, both purely cosmetic/naming, no behavior change:
`timetable.view-own` → `timetable-schedule.view-own` (pattern consistency);
`incident-reports.update-status` → `incident-reports.review` (unified with
`accident-reports.review`, same underlying action — name only; teacher's
grant on `incident-reports.review` was carried over unchanged from
`incident-reports.update-status`, it was never narrowed to admin-only to
match `accident-reports.review`'s scope, which is genuinely admin-only).

**Running total at this point: 88 permissions** (85 school-level + 3 super-admin).
Both disputed cells (`quran-schedule.view`, `quran-homework.update`) were resolved
and implemented in code the same day — see the next entries below. Impersonation
wasn't represented yet — see the final entry below for that resolution, bringing
the total to **90 permissions** (86 school-level + 4 super-admin).

### Urgent fix + confirmed follow-up items, implemented ahead of Phase 5 (2026-08-26)

Two of the three items from the follow-up pass above were resolved and
implemented immediately rather than waiting for Phase 5, since one was a live
security bug:

- **Quran Schedule guardian scoping (disagreement #7)** — fixed as a standalone
  security commit, deliberately kept separate from migration-phase work.
  `QuranSchedulePolicy::view()` scoped to `Guardian::allStudents()`. Committed as
  `30ab72a` on `feature/spatie-permissions`; cherry-picked to `one-db` as
  `0f45b0f` at your explicit request. Verified with `php8.4 artisan test`
  (see below) — two new regression tests in `QuranScheduleTenantIsolationTest.php`.
- **Quran Homework teacher scoping (disagreement #8)** — `QuranHomeworkPolicy::update()`/
  `delete()` scoped to `teacher_id`, covering `grade()`/`markUngraded()` too
  (both authorize against `update`). Five new tests in the new
  `QuranHomeworkTeacherOwnershipTest.php`.
- **Test suite is now actually runnable in this sandbox.** `pdo_sqlite` was
  previously missing with no passwordless sudo available; resolved by running
  the suite under `php8.4` (already installed on this machine with `pdo_sqlite`
  built in) instead of the default `php` (8.5). Bonus: `php8.4` is arguably the
  *correct* interpreter for this project anyway — `vendor/composer/platform_check.php`
  requires PHP ≥8.3 and `phpoffice/phpspreadsheet` requires <8.5, both satisfied
  by 8.4 with no flags or workarounds. Full run: **121 passed, 31 failed
  project-wide** (152 total). All 31 failures are pre-existing and unrelated to
  any work this session — two clusters: (1) default Breeze/Fortify auth-scaffold
  tests out of sync with this app's customized auth flow (e.g. logout redirects
  to `/login`, not the stock `/` the test expects), and (2) Timetable test
  factories/seeders that violate SQLite's stricter constraint checking (a
  `grades.name` NOT NULL violation, a `school_type` CHECK constraint rejecting
  `'primary'` instead of the real `islamic_school`/`madrasah` enum values, and a
  missing `AcademicTermFactory` class) — not investigated further, flagged only.
  Every Quran-related test file passes (94/94), including all new regression
  tests for the two fixes above.
- **Impersonation — Path A/B decisions implemented (2026-08-26).** Path A (the
  general `Route::impersonate()` flow) is untouched, as decided. Path B
  (`SuperAdmin\SchoolController::impersonate()`) previously always took
  `$school->users()->where('role','admin')->first()` — no explicit ordering,
  no way to pick a specific admin when a school had more than one. Now:
  - New `GET super-admin/schools/{school}/admins` endpoint
    (`SchoolController::admins()`) returns that school's admin users
    (`id`, `name`, `email`).
  - `impersonate()` now requires a `user_id`, validated against
    `$school->users()->where('role','admin')` (rejects a user_id from another
    school or a non-admin, even if supplied directly) — no longer takes the
    first admin found.
  - Both trigger points (`SuperAdmin/Schools/Index.jsx`'s modal — desktop and
    mobile share one handler — and `Schools/Show.jsx`'s `ConfirmationModal`)
    now show a picker when a school has more than one admin, defaulting to
    the first so the common single-admin case needs no extra click. Index.jsx
    fetches the list via the new endpoint on open; Show.jsx reuses `school.users`
    (already eager-loaded by `show()`) filtered client-side, no extra request.
  - `ConfirmationModal.jsx` gained one new optional prop, `confirmDisabled`
    (default `false`) — purely additive, all 36 other call sites unaffected —
    used here to disable "Confirm & Login" until an admin is selected.
  - New `tests/Feature/SuperAdmin/SchoolImpersonationTest.php` (5 tests):
    admins-endpoint scoping, impersonating a specifically-selected second
    admin (the actual behavior change), rejecting a cross-school user_id,
    rejecting a non-admin user_id, requiring user_id at all.
  - Full suite via `php8.4`: 131 passed, 31 failed (same 31 pre-existing,
    unrelated failures as every prior run this session — no new regressions).

### Impersonation Path C removed, taxonomy finalized (2026-08-26)

Confirmed decision: no audit log needed — long-term only super_admin uses
impersonation, so there's no practical value in tracking "who impersonated
who." Deleted rather than wired up: `ImpersonationController.php`,
`ImpersonationLogPolicy`, `ImpersonationLog` model, `ImpersonationLogFactory`,
`StoreImpersonationLogRequest`, `UpdateImpersonationLogRequest`,
`ImpersonationLogSeeder` — a full-codebase search confirmed all seven were
completely unreferenced outside each other. One thing this surfaced: the
`impersonation_logs` **table had already been dropped** by an existing
migration (`2025_11_11_050143_drop_impersonation_logs_table.php`, applied the
day after the table was created) — so there was no live data to check and no
new migration was needed; the two historical migration files were
deliberately left untouched (immutable migration history).

Taxonomy finalized: added `users.impersonate` (admin, Path A) to the
school-level table and `super-admin.schools.impersonate` (super_admin, Path B)
to the super-admin namespace — kept as two distinct permissions rather than
one, since the capabilities genuinely differ in shape (see the Impersonation
section above for the full reasoning, including one inference flagged for
your review: representing Path B as its own permission wasn't explicitly
re-confirmed in your latest message, which focused on the logging decision —
applied the same "structurally different capability" reasoning already used
for `super-admin.users.manage`).

**New total: 90 permissions (86 school-level + 4 super-admin)**, verified by
recount (`awk`/`grep -c`), not estimated.

Verification: `php -l` clean on all touched PHP files, `composer dump-autoload`
clean, `php8.4 artisan route:list` boots without error (confirms nothing still
references a deleted class), `pnpm run build` clean. Full suite via `php8.4`:
same 31 pre-existing failures, no new ones.

Committed separately from Phase 4 work, per instruction.

### Phase 4 — Install, migrate, seed (2026-08-26)

`composer require spatie/laravel-permission` (needed `--ignore-platform-req=php`,
same pre-existing `phpoffice/phpspreadsheet` vs. PHP 8.5 conflict as the R2
migration's `league/flysystem-aws-s3-v3` install earlier this session — nothing
new). Installed 8.3.0. Published `config/permission.php` and the package's
migration (`database/migrations/2026_08_26_094248_create_permission_tables.php`,
5 tables: `permissions`, `roles`, `model_has_permissions`, `model_has_roles`,
`role_has_permissions`) unmodified from package defaults.

**Environment gap hit while running the migration, worth recording:** this
machine's `.env` has `CACHE_STORE=redis` / `REDIS_CLIENT=phpredis`, but the
native `Redis` PHP extension isn't installed for either `php8.4` or the default
`php` — Redis itself is reachable (confirmed earlier this session), just the
PHP extension isn't there. The package's migration calls
`PermissionRegistrar::forgetCachedPermissions()` as its last step, which
needs a working cache driver — that call threw, and the artisan command
reported the migration as failed. **But MySQL's DDL auto-commits outside
transactions**, so the five tables had actually already been created despite
the reported failure — Laravel's `migrations` table just hadn't recorded it
yet. Caught this before moving on (`Schema::hasTable()` checks showed the
tables existed while `migrate:status` still showed the migration as Pending),
dropped the five orphaned tables to get back to a clean state, then re-ran
with `CACHE_STORE=array php8.4 artisan migrate` — an env-var override for
that one command only, `.env` itself untouched — which completed cleanly and
is correctly recorded as Ran. The same override was needed for the seeder run
below, for the same reason (Spatie's Role/Permission model events also clear
the cache on every write).

**Seeded via a new `RolePermissionSeeder`** (`database/seeders/RolePermissionSeeder.php`),
registered in `DatabaseSeeder.php`'s Step 1 (Core Setup) alongside
`SchoolSeeder`/`UserSeeder`. Its permission list and per-role assignments are
a mechanical transcription of the taxonomy tables above — generated by a
script that parsed the worksheet's markdown tables directly (kept in this
session's scratchpad, not committed) rather than hand-typed, specifically to
rule out transcription error given how much is riding on this being an exact
match. `firstOrCreate`/`syncPermissions` throughout, so it's safe to re-run
(verified: ran it twice, counts identical both times).

Verified counts after seeding, queried directly from the database, not
estimated: **90 permissions, 4 roles** — `admin` 82, `teacher` 39, `guardian`
13, `super_admin` 4, matching the taxonomy table exactly. `model_has_roles`
has **zero rows** — no actual user was assigned to any Spatie role, confirming
this is genuinely inert.

**Confirms the non-negotiable:** no controller, policy, middleware, route, or
JSX file was touched this phase — `git status` shows exactly `composer.json`,
`composer.lock`, `config/permission.php` (new), the migration (new), the
seeder (new), and `DatabaseSeeder.php`'s one new line. The `User` model does
**not** have Spatie's `HasRoles` trait yet (that's Phase 5) — nothing in the
app can call `$user->hasPermissionTo(...)` meaningfully yet, and nothing
tries to. Every route, middleware check, Policy, and JSX permission check is
running exactly as it was before this phase. Full suite via `php8.4`: 131
passed, 31 failed — the same pre-existing failures as every run this session,
no regressions.

**Also fixed in passing:** two small worksheet issues introduced by the
Impersonation-finalization edits earlier today — a stray leftover sentence
("Impersonation: deliberately not in this table yet") that contradicted the
rows added right above it, and a malformed `super-admin.schools.impersonate`
table row with one extra `|`-delimited cell that broke that table's column
count. Both caught while re-reading the file before writing this seeder,
fixed alongside it.

### Phase 5 — Migrate backend: routes, policies, model (2026-08-26)

**Approach confirmed with you before starting:** route-level middleware
migrates to Spatie's `permission:module.action` (matching each route to the
specific permission it represents, per Phase 2's findings), not a thinner
`role:` middleware just backed by Spatie roles — chosen because it actually
uses the taxonomy's granularity rather than making the route layer's
migration cosmetic.

**Infrastructure:**
- `User` model: added `Spatie\Permission\Traits\HasRoles`.
- New `App\Http\Middleware\CheckUserActive` — extracted verbatim from
  `RoleMiddleware`'s deactivated-user-logout check (confirmed the *only*
  place in the app enforcing `is_active`) — stacked alongside
  `permission:...` on every route that used to carry `role:...`, so removing
  `role:` middleware doesn't silently drop that enforcement.
- New `permission` and `user.active` middleware aliases registered in
  `bootstrap/app.php`, alongside the existing `role` alias (left registered
  but now unused at the route layer — not deleted this phase, since
  `RoleMiddleware`/`isAdmin()`-style User helpers are still used for
  in-Policy scoping logic throughout).
- New `App\Observers\UserObserver` — keeps a user's Spatie role in sync with
  their `role` column on every create/update (`role` stays the source of
  truth; nothing stops writing it). Needed for real app code going forward,
  and turned out to also be required to make the test suite pass at all —
  see below.
- New `Database\Seeders\UserRoleBackfillSeeder` — assigns every existing
  user to their matching Spatie role. Run against the real dev DB: 28/28
  users backfilled, zero mismatches against the `role` column, idempotent
  (re-run confirmed no duplicates). Wired into `DatabaseSeeder.php` after
  `UserSeeder`/`RolePermissionSeeder` for future fresh-seeds.
- `tests/TestCase.php`: added `$seed = true` / `$seeder = RolePermissionSeeder::class`
  so the 97 permissions/4 roles exist in the test database too — without
  this, every permission-gated route/Policy failed for test-factory users
  (68 failures on the first attempt, before this and the Observer were
  added — see below).

**Route middleware (routes/web.php):** all 55 `role:...` usages replaced.
Modules with no `role:` middleware at all (Documents, Accident/Incident
Reports, Policies' public routes) were left untouched — they're entirely
Policy-gated today and adding route-level gating where none existed would be
a scope/behavior change, not a faithful migration.

**Eight new permissions added, net seven after the report-comments
restructuring** (90 → 97; all documented inline in the taxonomy tables
above, not summarized twice here) — `streams.view/create/update/delete`
(a whole missed module, 4), `guardians.view-inactive`, `guardian-children.view`,
`quran-schedule.view-all`, and `documents.update` (a Policy method the
original taxonomy pass missed) — 8 additions, net against report-comments'
4→3 restructuring (disagreement #10) for +7 overall. None of these change
real access — they make already-current, narrower-than-their-nearest-neighbor
access explicit under its own name instead of silently widening or misnaming it.

**One route-mapping mistake I made and caught myself, before you saw it:**
first pass gated `quran-homework.student-report`/`.student` (admin+teacher+guardian
today) with `quran-homework.view-own` alone (guardian-only) — would have
403'd admin and teacher. Caught by the full-suite run immediately after the
route pass (`QuranHomeworkStudentReportTest` failing 403 instead of 200),
fixed before moving on. Flagging this not to bury it — it's exactly the
failure mode running the suite after each stage was meant to catch, and it
worked.

**Policies (22 files), one real bug found via structural inspection (per
your "trust Phase 2, spot-check" instruction — not exhaustive tracing):**
tracing `ReportController`'s comment actions against `ReportCommentPolicy`
surfaced that the whole Policy + a second controller (`ReportCommentController`)
are dead code (zero routes) — see disagreement #10 above, taxonomy corrected
to match the real inline logic. Two smaller dead-Policy-branch drops, same
established precedent as disagreements #2/#3/#9 (no route ever reached
them): `GuardianInvoicePolicy::view()`'s unconditional "teacher can view any
invoice" branch, and `TimetableSlotPolicy::update()`'s "teacher can edit a
draft template's slots" branch (that route has always been admin-only).
`ExamPolicy::update()` now implements the already-decided scoped-teacher-update
(Decision 1) for real, gated on `exams.created_by`.

**Verification:** `php -l` clean on all ~80 touched files. Ran the full
suite after each stage, not just at the end — route migration alone
(before the Observer/test-seeding fix) produced 68 failures, diagnosed as
missing Spatie role/permission data in the test database, fixed by adding
`UserObserver` and seeding `RolePermissionSeeder` in `tests/TestCase.php`,
which brought it back to the baseline 31. Final full-suite state after all
of Phase 5: **131 passed, 31 failed** — the identical 8 pre-existing,
unrelated failing test files as every run this session. `pnpm run build`
clean (no frontend files touched this phase).

**Not yet done, deliberately Phase 6's job:** frontend permission checks
(JSX still checks `auth.user.role`, not real permissions) and the broken
`user.roles?.some(...)` Impersonate-button check flagged earlier.

### Phase 5 close-out: exhaustive Policy trace + negative-case backfill (2026-08-27)

Requested because the earlier "trust Phase 2, spot-check" pass for the 22
Policy rewrites was, by design, not exhaustive — and the Report Comments
discovery (disagreement #10) proved that failure mode (Policy documents
behavior that isn't the actual live path) was real, not hypothetical, and
therefore unconfirmed elsewhere rather than ruled out.

**Exhaustive live-path trace, all 22/22 Policies.** For every Policy: found
every `authorize()`/Form-Request call site, confirmed the controller behind
it is the one actually registered in `routes/web.php` (not shadowed by a
second unrouted controller, as happened with `ReportCommentController`), and
checked for inline logic that could duplicate or bypass the Policy check.
**No second Report-Comments-style case found.** All 22 traced clean against
the taxonomy. Secondary findings surfaced along the way, none of them live
authorization bugs:

- `RoomController::destroy()` never calls `authorize('delete', ...)` — it
  duplicates `RoomPolicy::delete()`'s logic inline (admin-only + "not used
  in any timetable slot") instead. Same real behavior; the Policy method is
  simply dead code in practice.
- `StreamController`'s `index`/`create`/`store` never call `authorize(...)`
  — only route middleware protects them. No divergence, since
  `StreamPolicy`'s `viewAny`/`create` have no scoping beyond that same
  permission check.
- `GuardianInvoicePolicy::create()`/`delete()` are never invoked by
  `InvoiceController` — only route middleware (`permission:fees.manage`)
  gates `store`/`destroy`. No divergence (the Policy has no extra scoping
  either) — but this is what surfaced the `InvoiceController::destroy()`/
  `clearAll()` finding, logged separately in the Risks section since it's
  a real (pre-existing, unrelated) safety gap, not an authorization one.
- All 22 `Store*Request`/`Update*Request` Form Request classes
  (`StoreStudentRequest`, `UpdateExamRequest`, etc.) have
  `authorize(): bool { return false; }` and are never type-hinted by any
  controller (confirmed via a codebase-wide grep, zero hits) — entirely
  dead, harmless (if they were live, every request through them would 403
  unconditionally). Same "look-alike class, not the live path" shape as
  Report Comments, just inert. Candidate for deletion as unrelated cleanup.
- `restore`/`forceDelete` abilities on `RoomPolicy`/`TimetablePeriodPolicy`/
  `TimetableSlotPolicy`/`TimetableTemplatePolicy` are never routed anywhere
  — dead boilerplate, harmless.
- Re-verified `QuranSchedulePolicy` specifically, since this module already
  had one real bug this session: `QuranScheduleController::index()`'s query
  has no guardian scoping, but the route requires `quran-schedule.view-all`,
  which guardians don't have — so guardians can never reach the unscoped
  query. Only `show()` was guardian-reachable, and that's already fixed.

**Negative-case test coverage audit, all 26 ownership/state-scoped
permissions.** Before this pass, only 6 of 26 had a test asserting the
*denial* case (not just "owner can act"), plus 1 partial
(`quran-dashboard.view`, covered indirectly via scoped-count assertions,
no explicit denial assertion). **4 backfilled this pass** (all new,
2026-08-27):

- `tests/Feature/QuranScheduleTeacherOwnershipTest.php` —
  `quran-schedule.update`, mirrors `QuranHomeworkTeacherOwnershipTest`'s
  same-school/different-teacher pattern (that permission never got the
  equivalent test despite sharing the exact same ownership shape).
- `tests/Feature/GuardianInvoiceOwnershipTest.php` —
  `fees.view-own-invoices`, guardian cannot view another guardian's
  invoice.
- `tests/Feature/AccidentReportOwnershipTest.php` —
  `accident-reports.update`, non-reporting teacher blocked, reporting
  teacher blocked once `status = 'closed'`.
- `tests/Feature/IncidentReportOwnershipTest.php` — same two cases,
  incident-report side.

(Writing the AccidentReport test surfaced an unrelated, pre-existing
inconsistency: `AccidentReportController::update()`'s validation whitelist
for `incident_type` — `fall,collision,cut,burn,sports_injury,
playground_injury,medical_emergency,other` — doesn't match the DB check
constraint's enum — `injury,property_damage,near_miss,illness,other`. Some
values pass Laravel validation but would then fail at the DB layer.
Flagging only, not fixed — unrelated to this migration.)

**The remaining 15 of 26, plus the 1 partial, are explicitly deferred to
Phase 7**, not silently dropped: `attendance.view`/`.create`/
`.view-own-children`, `grades.view`, `exams.view`/`.update`,
`exam-results.view`/`.create`/`.update`, `timetable-slots.view`,
`timetable-availability.manage` (no Policy exists for this one at all —
inline role checks only), `reports.view`, `report-comments.create`/`.lock`,
`documents.view`/`.delete`, and the partial `quran-dashboard.view`.

**Verification:** all 4 new tests green individually and as part of the
full suite. Full suite: **145 passed, 31 failed** — same 8 pre-existing
failing files as every run this session (`Auth\AuthenticationTest`,
`Auth\PasswordResetTest`, `Auth\RegistrationTest`,
`ErrorHandlingArchitectureTest`, `ProfileTest`, `TeacherTimetableTest`,
`TimetableConflictDetectionTest`, `TimetableGenerationValidationTest`),
zero regressions. 10 new tests total across this close-out pass (135 → 145).

**Phase 5 is closed as of this entry.** Next: Phase 6 (frontend migration).

### Phase 6 — Migrate frontend: grounding + Batch 0 (2026-08-27)

**Grounding pass, verified against current code, not the original handoff's
~154/~41 estimate.** `auth.user.role` (all optional-chaining variants)
appears **123 times across 38 files** — the full file list and the
5 non-comparison (display-only or nav-feeding) occurrences to leave alone
are recorded in the chat, not duplicated here. Two things surfaced that
weren't in the original handoff:

- A **second, independent nav duplication** in `BottomNavigation.jsx` (the
  mobile bottom nav) — its own `switch (role)` with 3 hardcoded
  `getXNavItems()` functions, entirely separate from `navigation.js`'s
  `getNavigation()`. No `super_admin` case; silently falls back to teacher's
  items. Needs to move to permission-based filtering alongside
  `navigation.js` in the same batch, or the two navs stay able to drift
  apart.
- **Confirmed the Impersonate-button check does not get fixed by Phase 5
  alone.** `Users/Index.jsx`/`Show.jsx`'s
  `user.roles?.some(role => role.name === 'admin')` reads a Spatie `roles`
  relationship that `UserController::index()`/`show()` never eager-loads
  (`with(['creator','teacher','guardian'])` / `with(['creator',
  'createdUsers','activityLogs.causer'])`, no `roles`) and `User` has no
  `$with`/`$appends` for it — so `user.roles` stays `undefined` regardless
  of Phase 5, `undefined?.some(...)` is `undefined`, `!undefined` is `true`
  — `canImpersonate` is **always true today, including for admin targets**,
  backwards from intent. Fix: swap to the already-present `user.role ===
  'admin'` (plain string column, already in the payload) — no backend
  change needed. Scheduled for batch 2 (moved up per your instruction,
  since this is a live bug, not cosmetic).

**Design approved, two adjustments from you:** (1) Users + Impersonation
moved from batch 2 to batch 2-right-after-nav (was going to sit behind
Students/Guardians) since it's the only batch fixing a live bug; (2) a
written per-batch verification checklist (role tested / page / expected
show-hide / pass-fail) is required alongside every batch report, not just
narrated click-through — this is the actual audit trail in the absence of
any frontend test suite.

**Sensitivity check on `auth.user.permissions` (requested before Batch 0):**
confirmed via tinker against the real seeded admin — 88 permissions, zero
`super-admin.*` names present. Permission strings are self-descriptive
`module.action` labels naming capabilities the UI already exposes to that
role (nav items, buttons); nothing in the array reveals structure or
capability beyond what that role's own UI already shows. No action needed.

**Batch 0 (Foundation) — done.**
- `HandleInertiaRequests.php`: added `'permissions' =>
  $user->getAllPermissions()->pluck('name')` to `auth.user`, additive —
  `role` untouched, still shared for the display-only reads identified in
  the grounding pass.
- New `resources/js/Hooks/usePermissions.js` — `usePage()`-backed,
  `Set`-based lookup, exposes `can(permission)` and `canAny(permissions)`
  (the latter needed for the OR-permission pages Phase 5's route middleware
  already uses, e.g. `quran-homework.view|quran-homework.view-own`).
- New `tests/Feature/SharedPermissionsPropTest.php` (3 tests) — asserts the
  real shared-prop payload per role via `assertInertia`, not just that the
  build succeeds: admin gets exactly 88 permissions with zero
  `super-admin.*` entries, guardian gets exactly 14 including
  `fees.view-own-invoices` and excluding `students.delete`, `role` stays
  present alongside `permissions` for teacher.
- **Verification:** `pnpm run build` clean (`public/sw.js`'s auto-bump
  reverted, not committed). Full suite: **148 passed, 31 failed** — same 8
  pre-existing failing files, zero regressions, +3 new tests.

**Batch 0 verification checklist** (no per-role click-through yet — this
batch has no UI-visible change, verified via the automated Inertia-prop
test above instead; the role/page/show-hide checklist format starts at
Batch 1):

| Check | Result |
|---|---|
| `auth.user.permissions` present, 88 entries, no `super-admin.*`, for admin | ✅ pass (automated) |
| `auth.user.permissions` present, 14 entries, correct membership, for guardian | ✅ pass (automated) |
| `auth.user.role` still present alongside `permissions`, for teacher | ✅ pass (automated) |
| `pnpm run build` | ✅ pass |
| Full backend suite, no regressions | ✅ pass (148/31, baseline held) |

Next: Batch 1 (Layouts/Navigation), then Batch 2 (Users + Impersonation,
moved up).

### Phase 6 Batch 1 — Layouts/Navigation (2026-08-27)

**Scoping call before writing any code, per your instruction:** confirmed
`BottomNavigation.jsx` is the genuine mobile bottom tab bar, not a
responsive collapse of the sidebar — `<nav className="md:hidden fixed
bottom-0 ...">`, single row, `justify-around`, hidden at the `md` breakpoint
and up. It has its own hand-curated 4-5 item set per role plus a real
`isMore` drawer trigger, which turned out to open **three more
role-specific components** (`AdminMoreMenu.jsx`/`TeacherMoreMenu.jsx`/
`GuardianMoreMenu.jsx`) not found in the original grounding pass — so the
real shape is three tiers, not two: sidebar (`navigation.js`, full list with
submenus) → bottom bar (4-5 fixed slots) → More drawer (the rest,
admin's sectioned/collapsible). Documented the full current curated
set per role (fixed slots vs. under More) before touching anything, per
your request. One inconsistency found (Quran shows as both a fixed slot
*and* again inside More for madrasah teacher/guardian, while Guardian's
"Reports" explicitly avoids that same duplication) — **per your decision,
preserved as-is, not fixed**, logged as its own flagged item, same tier as
`InvoiceController` and the `incident_type` validation mismatch (see Risks
section below).

**Critical design finding that changed the approach:** the current
per-role nav lists are hand-curated *subsets* of what each role's
permissions actually allow, not full mirrors of them. Confirmed example:
`TEACHER_PERMISSIONS` includes `timetable-periods.view` and
`timetable-rooms.view`, but teacher's nav has never shown links to
Periods/Rooms (same "Policy allows, no nav link" shape as Phase 2's
disagreement #4). A fully-flattened, permission-only nav (one universal
item list, shown wherever `can()` passes) would have **silently started
showing Periods/Rooms to every teacher** — a real behavior change, not a
mechanism swap. So Batch 1 does **not** flatten the four role-keyed arrays
into one list. It keeps every array exactly as authored (same items, same
labels, same order, same grouping — that curation is unchanged) and adds a
`permission`/`permissions` field to every item, filtered through
`can()`/`canAny()` before rendering. `role` still selects *which* curated
screen to build (a UI-routing choice, not a security boundary — routes are
gated server-side regardless of what the nav shows); what changed is that
*each item's actual visibility* now runs through a real permission check
instead of being implicitly trusted because the role matched. Same
reasoning applied to `showBottomNav` and the three `auth.user.role ===
"x"` More-menu-selection checks in `AuthenticatedLayout.jsx` — deliberately
left role-based (there's no clean permission equivalent to "is one of
these three roles" for a pure UI-routing decision), not an oversight.

**Files changed:** `navigation.js` (added `permission`/`permissions` to
every item + a `filterByPermission` helper recursing into `submenu`),
`BottomNavigation.jsx` (same pattern, flat items), `AdminMoreMenu.jsx`/
`TeacherMoreMenu.jsx`/`GuardianMoreMenu.jsx` (each item wrapped in
`can('...') &&`), `AuthenticatedLayout.jsx` (calls `usePermissions()` once,
threads `can`/`canAny` down to `getNavigation()` and all four nav
components). `Sidebar.jsx` and `TopBar.jsx` needed **no changes** — Sidebar
only renders whatever `navigation` array it's handed (no role logic of its
own beyond the already-flagged display-only role badge text); TopBar's only
`auth.user.role` use is the same display-only badge.

**Verification — this is where it mattered most, given no frontend test
suite exists.** Three layers, cheapest to most rigorous:

1. Cross-checked all 31 permission strings used across the 5 files against
   the real taxonomy (`RolePermissionSeeder::ALL_PERMISSIONS`) — zero
   typos. This is the exact "silently hides a button" failure mode raised
   before Phase 6 started: a misspelled permission string would make
   `can()` always return false with no error anywhere.
2. Executed the real, shipped `navigation.js` module directly (Node ESM
   import, not a simulation) against the actual seeded `ADMIN_PERMISSIONS`/
   `TEACHER_PERMISSIONS`/`GUARDIAN_PERMISSIONS`/`SUPER_ADMIN_PERMISSIONS`
   arrays pulled live from the seeder. Output was byte-identical to the
   pre-Batch-1 nav for all 4 roles × both `isMadrasah` states. Then proved
   the filter isn't a no-op by removing `streams.view`/`teachers.view` from
   a copy of admin's permission set and confirming exactly those two items
   (and only those two) disappeared from the tree, submenu-nesting intact.
3. **Full live-browser verification** — started the app for real
   (`php artisan serve` + the production build; found and removed a stale
   `public/hot` file left over from an old `npm run dev` session that was
   silently pointing the app at a dead Vite dev server, which is why the
   first load attempt was a blank page), created three throwaway QA
   accounts (`batch1-{admin,teacher,guardian}@test.local`, deleted after)
   rather than touch real user passwords, logged into the real Demo School
   (madrasah) as each role, and drove the actual UI with browser automation
   — expanded every submenu on desktop, resized to a phone viewport
   (390×844) to check the real bottom tab bar, and opened the real "More"
   drawer for each role.

**Verification checklist** (role / page / expected / result — every check
performed live against the running app, not narrated):

| Role | Surface | Expected | Result |
|---|---|---|---|
| admin | Desktop sidebar | Dashboard, Students, Teachers, Guardians, Users, Attendance, Grades, Subjects, Exams, Timetables, Quran, Fees, Reports, Documents, Settings | ✅ pass — exact match |
| admin | Desktop sidebar submenus | Timetables→6 items, Quran→3, Fees→6, Documents→4, Settings→5 (all listed above in the design) | ✅ pass — exact match, all 24 sub-items present |
| admin | Mobile bottom bar | Home, Attendance, Students, Timetable, More | ✅ pass |
| admin | Mobile More drawer | People Mgmt (3) / Academic (3) / Timetable[collapsible→6] / Financial[collapsible→6] / Quran[collapsible→3] / Documents & Reports (5) / Settings (5) | ✅ pass — exact match including collapsed→expanded content |
| teacher | Desktop sidebar | Dashboard, My Grades, Students, Guardians, Attendance, Subjects, Exams, Timetables, Quran, Reports, Documents | ✅ pass — exact match |
| teacher | Desktop sidebar submenus | Timetables→My Timetable/My Availability, Quran→3, Documents→4 | ✅ pass — exact match |
| teacher | Mobile bottom bar | Home, Attendance, Timetable, Quran, More | ✅ pass |
| teacher | Mobile More drawer | My Grades/Students/Guardians/Subjects/Exams, Timetable→My Availability, Quran→3 (duplicated vs. fixed slot, preserved per your decision), Documents & Reports→5 | ✅ pass — exact match |
| guardian | Desktop sidebar | Dashboard, Quran, Invoices, Reports, Documents, Policies | ✅ pass — exact match |
| guardian | Desktop sidebar submenu | Quran→Dashboard/Homework | ✅ pass |
| guardian | Mobile bottom bar | Home, Attendance, Invoices, Quran, More | ✅ pass |
| guardian | Mobile More drawer | Quran→2 (duplicated vs. fixed slot, preserved), Documents & Reports→Documents/Policies (Reports correctly absent — already-existing dedup for madrasah guardians, untouched) | ✅ pass — exact match |
| all 3 | Permission-string integrity | Every `permission`/`can()` string used exists in `RolePermissionSeeder::ALL_PERMISSIONS` | ✅ pass — 31/31, zero typos |
| — | Filter is real, not a no-op | Removing a permission from a copy of admin's set removes exactly that nav item | ✅ pass |
| — | `pnpm run build` | clean | ✅ pass |
| — | Full backend suite | no regressions | ✅ pass — 148 passed / 31 failed, same 8 pre-existing failures |

Zero discrepancies found across all 16 checks. Cleanup: browser session
closed, throwaway QA accounts deleted, dev server stopped, `public/hot`
left deleted (it's gitignored and was actively wrong — pointed the app at
a dead Vite server; not a repo change).

### Phase 6 Batch 2 — Users + Impersonation (2026-08-27)

Re-surveyed the actual scope before touching anything: `Users/Index.jsx`,
`Users/Show.jsx`, `Users/Edit.jsx`, `Users/Create.jsx`,
`SuperAdmin/Users/{Index,Show}.jsx`, `SuperAdmin/Schools/Show.jsx`,
`ImpersonateButton.jsx`, `ImpersonationBanner.jsx`. Of these, only
`Users/Index.jsx` and `Users/Show.jsx` actually needed a code change — the
rest only ever read a *listed/target* user's `role` field (for badges,
form defaults, or the "which of this school's admins can I impersonate"
picker built back in Priority 3), never `auth.user.role`, so they were
already correctly out of scope.

**Fixed the live Impersonate-button bug** (flagged, not yet fixed, since
the original handoff): `user.roles?.some(role => role.name === 'admin')`
read a Spatie `roles` relationship `UserController::index()`/`show()`
never eager-loads — confirmed again this phase that it's still `undefined`
regardless of Phase 5 — so the check always evaluated to "can impersonate,"
including for admin targets. Replaced all 3 occurrences (2 in
`Users/Index.jsx` — the mobile card's `canImpersonate` and the desktop
table's inline dropdown check — 1 in `Users/Show.jsx`) with `user.role !==
'admin'`, using the plain string column that's always present on the
payload. No backend change needed.

**Verified live**, not just by code inspection: started the app, logged in
as a throwaway admin QA account (deleted after), opened `/users`, and
checked the actions dropdown for three targets — a guardian (Zainab Issa:
"Login As User" present, correct), the real seeded admin
(`admin@demoschool.com`, a different admin than the one logged in: "Login
As User" **absent**, correct — this is the case that was silently broken
before), and confirmed the same on that admin's individual `/users/{id}`
Show page. Zero occurrences of the old `roles?.some` pattern remain
anywhere in the codebase (grep-verified).

No `auth.user.role` reads existed in this batch's files at all (confirmed
by grep before editing), so there was nothing else to convert to
`can()`/`canAny()` here — Batch 2 ended up being a single, narrowly-scoped
bug fix rather than a permission-migration batch, which matches what the
grounding pass already predicted.

**Verification:** `pnpm run build` clean. Full backend suite unaffected (no
PHP touched): 148 passed / 31 failed, same 8 pre-existing failures.

### Phase 6 Batch 3 — Students/Guardians (2026-08-27)

Files: `Students/Index.jsx` (incl. its `MobileStudentItem` sub-component),
`Components/Students/StudentsTable.jsx`, `Guardians/Index.jsx` (incl.
`MobileGuardianItem`), `Guardians/Inactive.jsx` (incl.
`MobileInactiveGuardianItem`). All 16 `auth.user.role === 'admin'`
occurrences converted — every one was gating an actual admin-only action
(Edit/Delete/Reactivate/Deactivate/Create/Import/Inactive-list), no
display-only reads in this batch.

Cross-checked every gate against the real route middleware
(`routes/web.php`) rather than guessing from icon meaning:
`students.create` (import/add), `students.update`
(edit/deactivate/reactivate), `students.delete` (destroy) — and the
guardian equivalents plus `guardians.view-inactive` for the `/guardians/inactive`
link. One correction from the naive "just swap the string" approach: the
Students/Guardians table row Edit+Delete were previously gated by a single
`auth.user.role === 'admin'` check; split into separate `can('...update')`/
`can('...delete')` since they're different permissions that only happen to
coincide for admin today. Same split applied to `Guardians/Index.jsx`'s
header block, which had bundled the Inactive-list link
(`guardians.view-inactive`) together with Bulk Import/Add Guardian
(`guardians.create`) under one role check — now `canAny([...])` gates the
container, `can(...)` gates each button individually.

**`Components/Students/StudentsTable.jsx` is dead code** — grepped for
every reference and found exactly one, a comment in `Students/Index.jsx`
("Your existing StudentsTable component or table markup"), not an actual
import. The real desktop table is inline in `Index.jsx`. Converted it
anyway for consistency, same precedent as keeping Phase 5's dead Policy
methods in sync — flagging here since it's unreachable from any route
today.

**Verification:** zero `auth.user.role` occurrences remain in any of the 4
files (grep-confirmed); all 7 permission strings used
(`students.{create,update,delete}`,
`guardians.{create,update,delete,view-inactive}`) validated against
`RolePermissionSeeder::ALL_PERMISSIONS`, zero typos. `pnpm run build`
clean. Live-browser check (throwaway QA admin + teacher accounts, deleted
after) against the real app: admin sees Bulk Import/Add Student on
`/students` and Inactive/Bulk Import/Add Guardian on `/guardians`; teacher
sees neither, and the Guardians table correctly shows no Actions column at
all for teacher (view-only, matches `guardians.view` with no update/delete/
create). Caught and fixed an unrelated pre-existing bug in my own test
fixture along the way (a throwaway teacher QA account with no `Teacher`
model row crashed `StudentController::index()` at
`$user->teacher->grades` — not a Spatie-migration bug, just missing test
data; fixed by creating the `Teacher` record, not by touching app code).
Full backend suite unaffected (no PHP changed): 148 passed / 31 failed,
same 8 pre-existing failures.

### Phase 6 Batch 4 — Grades/Subjects (2026-08-27)

Files: `Grades/Index.jsx`, `Grades/Show.jsx`, `Subjects/Index.jsx` (incl.
`MobileSubjectItem`), `Subjects/Show.jsx`. 10 `auth.user.role === 'admin'`
occurrences converted, all gating real actions (no display-only reads).

Mapped every gate against `routes/web.php`'s actual middleware groups
rather than guessing: `grades.create` (Add Grade, empty-state Add First
Grade), `grades.update` (Edit, Unarchive, Manage Curriculum, Assign
Subjects — all four sit in the same `permission:grades.update` route
group, including `grades.curriculum.manage`/`.update` and
`grades.restore`), `grades.delete`, and the subjects equivalents. Split
two more bundled Edit+Delete checks into their correct separate
permissions (`Grades/Index.jsx`'s card actions,
`Subjects/Index.jsx`'s desktop table row and its `MobileSubjectItem`'s
`isAdmin` swipe-action variable, which fed both Edit and Delete off one
flag).

**Verification:** zero `auth.user.role` occurrences remain in any of the 4
files; all 6 permission strings (`grades.{create,update,delete}`,
`subjects.{create,update,delete}`) already confirmed against the taxonomy
while mapping routes, no new typos introduced. `pnpm run build` clean.
Live-browser check (throwaway QA admin + teacher, deleted after): admin
sees Add Grade/Add Subject and every row's View/Edit/Delete on both index
pages, plus Manage Curriculum/Edit Grade on a Grade Show page and Edit
Subject on a Subject Show page; teacher sees none of it — `/subjects`'s
Actions column drops to View-only, `/grades` correctly shows zero grades
(teacher isn't assigned to any, matches existing grade-scoping, not a
regression), and both Show pages show only "Back to List" for teacher.
Full backend suite unaffected (no PHP changed): 148 passed / 31 failed,
same 8 pre-existing failures.

### Phase 6 Batch 5 — Exams (2026-08-27)

Files: `Exams/Index.jsx` (incl. `MobileExamItem`), `Exams/Show.jsx`,
`ExamResults/Show.jsx`. 11 occurrences converted: 6 were plain
`auth.user.role === 'admin'` (exams.update/delete), 5 were
`auth.user.role === 'admin' || auth.user.role === 'teacher'`
(exam-results.view / exams.update).

**Real, visible behavior change flagged, not silently introduced** —
unlike every prior batch in Phase 6, this one isn't purely mechanical.
`exams.update` is held by **both** admin and teacher in the taxonomy
(teacher's grant was Decision 1 from Phase 2, implemented server-side in
Phase 5's `ExamPolicy::update()`: admin or `exam.created_by === $user->id`
for teacher). The mobile card and desktop table's Edit/Delete gates were
still hardcoded `auth.user.role === 'admin'` — meaning **teachers have had
zero frontend path to edit even their own exams from these two views since
Phase 5 shipped**, despite already holding the permission. Converting to
`can('exams.update')` fixes that gap as a direct, correct consequence of
"replace the mechanism" — it's not new scope, it's the frontend catching up
to an already-approved, already-implemented backend decision.

**What this does NOT fix, on purpose:** the frontend still doesn't check
`exam.created_by` — a non-owning teacher will now see the Edit button (on
both Index and Show) and get a real 403 on click, exactly the same gap
`Exams/Show.jsx`'s "Enter Marks"/"Edit Exam" block already had *before*
this batch (no ownership check there either). Verified this exact sequence
live: assigned a throwaway QA teacher to an exam's grade (for
`exams.view`'s grade-scoping) without making them the creator, confirmed
"Edit Exam" appeared, then confirmed `/exams/{id}/edit` still 403s
server-side. Not fixing the ownership-check gap here — same as
`Quran/Homework/Show.jsx` before its Priority 2 fix, this would be a
deliberate scoping change, not a mechanism swap, and wasn't asked for in
this batch.

Split the remaining Edit+Delete bundles (`exams.update` vs `exams.delete`)
in `Exams/Index.jsx`'s card and table, and the "Enter Marks"
(`exam-results.view`) + "Edit Exam" (`exams.update`) bundle in
`Exams/Show.jsx`, same pattern as prior batches. The card's grid-column
layout logic (2-col vs 1-col, and which button gets `col-span-2`) had to be
reworked from a binary `role === 'admin'` check to
`can('exams.update') || can('exams.delete')`, since a teacher can now see
2 buttons (View + Edit) where previously only 1 or 3 were possible.

**`ExamResults/Show.jsx` is dead code**, same as `StudentsTable.jsx` in
Batch 3 — `ExamResultController` only ever renders `ExamResults/Index`,
confirmed via grep across every controller. Converted anyway for
consistency, flagged here.

**Verification:** zero `auth.user.role` occurrences remain in any of the 3
files; all 3 permission strings (`exams.{update,delete}`,
`exam-results.view`) confirmed against the taxonomy. `pnpm run build`
clean. Live-browser check (throwaway QA accounts, deleted after) confirmed
the exact scenario above — non-owning teacher sees Edit, gets 403 on
submit — plus admin seeing Edit+Delete on every row and teacher seeing
Edit-but-not-Delete on every row of the desktop table (verified via
`document.querySelectorAll` counts: 10 Edit / 0 Delete for teacher, 10/10
for admin, matching the 10 exams on that page). Full backend suite
unaffected (no PHP changed): 148 passed / 31 failed, same 8 pre-existing
failures.

### Phase 6 Batch 5 fix — Exam Edit gate now matches ExamPolicy exactly (2026-08-27)

Batch 5 converted `exams.update`'s gate to `can('exams.update')` alone,
which correctly stopped hiding Edit from teachers entirely but left the
gate one step short of `ExamPolicy::update()`'s real logic — a non-owning
teacher would see the Edit button and get a real 403 on click. Per your
explicit instruction, tightened every Edit gate (mobile card swipe action,
mobile card's own action-buttons block, desktop table row, both
`Exams/Show.jsx` and the dead `ExamResults/Show.jsx`) to:

```js
can('exams.update') && (auth.user.role === 'admin' || exam.created_by === auth.user.id)
```

matching `ExamPolicy::update()` line for line. `exam.created_by` is
present on every exam object in both `ExamController::index()` and
`::show()` (both eager-load `creator`, neither restricts columns, `Exam`
model has no `$hidden` on it — confirmed before assuming the field was
available). Introduced a single `canEditExam` computed value per
component/row rather than repeating the compound condition inline
everywhere, and removed the now-unused `canAny` import from
`Exams/Show.jsx` and `ExamResults/Show.jsx`.

**Re-verified live**, the exact scenario requested: created a second exam
owned by the throwaway QA teacher (same grade as the existing non-owned
exam so `exams.view`'s grade-scoping wasn't a confound) and confirmed —
- Non-owning teacher on the non-owned exam's Show page: "Edit Exam" is
  **absent** now (previously present, 403'd on click) — only "Enter Marks"
  shows.
- Same teacher on their **own** exam's Show page: "Edit Exam" **is**
  present.
- Desktop table (`/exams`, 10 rows on the page): exactly **1** `Edit Exam`
  link for the teacher, and its `href` was checked directly —
  `/exams/1387/edit`, the teacher's own exam, not a coincidental match.
- Admin: still 10/10 Edit links on the same table, and Edit still present
  on the non-owned exam's Show page (admin bypasses ownership, matching
  `ExamPolicy::update()`).

`pnpm run build` clean. Full backend suite unaffected (no PHP changed):
148 passed / 31 failed, same 8 pre-existing failures.

### Phase 6 Batch 6 — Timetables (2026-08-27)

Files: `Timetables/Availability/{Create,Edit,Index}.jsx`,
`Timetables/Periods/Index.jsx`, `Timetables/Rooms/Index.jsx`,
`Timetables/Templates/Index.jsx`.

**Teacher Availability scoping — investigated before writing anything, per
your instruction, since the worksheet had flagged this "unverified."**
Read `TeacherAvailabilityController.php` directly (no Policy exists for
this model — every check is inline):
- `index()` filters the query to `teacher_id = $user->teacher->id` when the
  viewer is a teacher — a teacher's list *can only ever contain their own
  records*, server-side. Admin gets everyone's, unfiltered.
- `store()`/`show()`/`edit()`/`update()`/`destroy()` each have an explicit
  `if ($user->role === 'teacher' && $record->teacher_id != $user->teacher->id)
  abort(403)`. **Admin has no equivalent restriction at all** — unlike
  Exams/Quran (one Policy method, `isAdmin() ? true : owner`), here it's
  asymmetric: teacher is scoped, admin is unrestricted by construction (no
  admin-side check exists to restrict).
- Route-level: single permission `timetable-availability.manage`, held by
  both roles, gating every one of the above actions as one group.

**Conclusion, confirmed not assumed:** because the list is pre-filtered
server-side, `Availability/Index.jsx`'s existing unconditional per-row
Edit/Delete (no role or ownership check at all) was already correct — a
teacher never receives another teacher's row in the props, so there was
nothing to fix there. The page's 4 `auth.user.role === 'admin'` checks are
**not authorization decisions** — they toggle the "Teacher" column and the
teacher-filter dropdown, relevant only when viewing multiple teachers at
once. Since both roles hold the identical `timetable-availability.manage`
permission, converting these to `can()` would make them always-true for
both and wrongly show the column to teachers. **Left unconverted,
deliberately** — same reasoning as `Create.jsx`/`Edit.jsx`'s
admin-only teacher-select dropdown (also left as `auth.user.role`, since
there's no permission distinct from "can manage availability at all" for
"can assign it to any teacher" — mirrors the backend's own use of a role
check, not a Policy, for this exact decision).

**Real bug found and fixed, per your go-ahead:**
`Availability/Create.jsx` defaulted `teacher_id: isAdmin ? '' : auth.user.id`
— `auth.user.id` is the **Users** table PK, but the backend requires the
**Teachers** table PK (`$user->teacher->id`) and 403s/validation-fails when
they differ. The controller already computed and passed the correct value
as `currentTeacherId`, but the component never destructured or used it —
looked like a leftover from an incomplete refactor. Net effect before this
fix: **any teacher submitting this form would almost certainly have hit an
error**, since a Users-table id coincidentally matching a Teachers-table id
would be rare. Fixed to use `currentTeacherId`. Verified live end-to-end:
submitted the form as a throwaway QA teacher, confirmed a real record was
created (no 403, no validation error), then confirmed via tinker that the
saved `teacher_id` matched the Teacher PK (18) and *not* the User PK (42)
that the old code would have sent.

**Periods/Rooms/Templates** — straightforward admin-only conversions
(`timetable-periods.manage`, `timetable-rooms.manage`,
`timetable-templates.manage`; Templates has no separate `.view` in the
taxonomy at all, so it's the same single permission for every action on
that page). One bundle split for correctness, consistent with prior
batches: Periods/Index.jsx's header bundled "Generate from Blueprint"
(→ `/blueprints`, actually gated by `timetable-dashboard.view`) together
with "Add Manually" (`timetable-periods.manage`) under one check — split
into `canAny([...])` on the container plus `can(...)` per button (no
visible behavior change today since teacher holds neither, but matches the
real destination permission rather than an incidental role check).

**Verification:** zero unintended `auth.user.role` occurrences remain — the
6 that do remain (2 in Create.jsx/Edit.jsx, 4 in Availability/Index.jsx)
are the deliberate, reasoned exceptions documented above. All 5 permission
strings used (`timetable-{dashboard.view,periods.manage,rooms.manage,
templates.manage}`, `timetable-availability.manage`) validated against the
taxonomy. `pnpm run build` clean. Live-browser check (throwaway QA admin +
teacher, deleted after): the Create.jsx bug fix confirmed end-to-end as
above; teacher sees none of Periods/Rooms/Templates' manage affordances and
gets a real 403 on `/timetables/templates` (teacher holds no templates
permission at all — expected, not new); admin sees every manage affordance
on all three; Availability/Index.jsx's Teacher column and filter dropdown
confirmed present for admin (listing every teacher including the QA one).
Full backend suite unaffected (no PHP changed beyond nothing — this batch
touched no PHP): 148 passed / 31 failed, same 8 pre-existing failures.
