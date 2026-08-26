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
- [ ] **Phase 4** — Install, migrate, seed `spatie/laravel-permission` (inert — old system still live)
- [ ] **Phase 5** — Migrate backend: routes, policies, model
- [ ] **Phase 6** — Migrate frontend
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
| `grades.view` | ✅ | ✅ (scoped) | ❌ | Teacher scoped to assigned grades, single-record only (list view unscoped per Phase 2) |
| `grades.create` | ✅ | ❌ | ❌ | — |
| `grades.update` | ✅ | ❌ | ❌ | — |
| `grades.delete` | ✅ | ❌ | ❌ | — |
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
| `timetable-availability.manage` | ✅ | ✅ | ❌ | **Scoping unverified** (Phase 2 flagged this — whether a teacher can edit another teacher's availability record wasn't confirmed against controller internals). Carried forward as an open unknown, not asserted as scoped or unscoped. |
| `reports.view` | ✅ (all) | ✅ (scoped) | ✅ (scoped) | Teacher scoped to assigned grades; guardian scoped to own children |
| `report-comments.create` | ✅ | ✅ | ❌ | — |
| `report-comments.update` | ✅ (always) | ✅ (scoped) | ❌ | Teacher scoped to own comment AND `canEditTeacherComment()` (not locked) — ownership + state |
| `report-comments.delete` | ✅ | ❌ | ❌ | — |
| `report-comments.manage-lock` | ✅ | ❌ | ❌ | — |
| `reports.headteacher-comment` | ✅ | ❌ | ❌ | The pre-existing "headteacher = admin" conflation, unrelated to this migration's scope — carried forward as-is, see `head-teacher-role-audit-report.md` §1.4 |
| `documents.view` | ✅ (all) | ✅ (scoped) | ✅ (scoped) | Teacher scoped to own Teacher-entity docs; guardian scoped to own + linked students' docs |
| `documents.create` | ✅ | ✅ | ✅ | All authenticated roles |
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
| `incident-reports.review` | ✅ | ✅ | ❌ | **Renamed 2026-08-26** from `incident-reports.update-status` — unified with `accident-reports.review` since both represent the same underlying action (examining/closing out a report); "review" was kept over "update-status" as the more specific term, matching `AccidentReportPolicy`'s own method name/comments |
| `incident-reports.update` | ✅ | ✅ (scoped) | ❌ | Same ownership + state pattern as accident-reports.update |
| `incident-reports.delete` | ✅ | ❌ | ❌ | — |
| `quran-dashboard.view` | ✅ | ✅ | ✅ | **Follow-up pass addition (2026-08-26).** All three genuinely scoped in the controller (school-wide/own-teaching-load/own-children respectively) — see ownership-scoping summary below |
| `quran-homework.view` | ✅ | ✅ | ❌ | Covers the list view and general single-record view. Guardian's access to a specific homework record is a *separate* permission below, not a restricted view of this one |
| `quran-homework.view-own` | ❌ | ❌ | ✅ | Guardian, own children only, via student-report/student-homework routes — scoping lives in the Controller, not a Policy, unlike everywhere else in this taxonomy |
| `quran-homework.create` | ✅ | ✅ (scoped) | ❌ | Teacher scoped to assigned grades |
| `quran-homework.update` | ✅ | ✅ (scoped) | ❌ | Covers update/delete/grade/mark-ungraded (Policy reuses one gate for all). **Resolved 2026-08-26** (disagreement #8) — teacher scoped to `teacher_id`, matching the frontend's own stricter check that was previously unenforced. Implemented ahead of Phase 5, see Phase log |
| `quran-schedule.view` | ✅ | ✅ (scoped) | ✅ (scoped) | Teacher scoped via `teacher_id`. **Resolved 2026-08-26** (disagreement #7) — guardian now scoped via `Guardian::allStudents()`, closing a live cross-family data-exposure. Implemented ahead of Phase 5 as an urgent security fix, see Phase log |
| `quran-schedule.create` | ✅ | ✅ (scoped) | ❌ | Teacher scoped to assigned grades |
| `quran-schedule.update` | ✅ | ✅ (scoped) | ❌ | Teacher scoped to own schedules via `teacher_id`; delete reuses this gate |
| `policies.view` | ✅ | ✅ | ✅ | **Follow-up pass addition.** All authenticated; tenant-scoped only (not a role distinction) |
| `policies.acknowledge` | ✅ | ✅ | ✅ | State-gated: only if published + requires acknowledgment |
| `policies.manage` | ✅ | ❌ | ❌ | Create/update/delete/publish/revisions — route and Policy agree exactly, no disagreements. `delete` has a state guard (cannot delete a published policy) |
| `document-categories.view` | ✅ | ❌ | ❌ | **Follow-up pass addition.** Teacher/guardian Policy grant dropped per disagreement #9 — dead code, no route reaches it, same precedent as disagreements #2/#3 |
| `document-categories.manage` | ✅ | ❌ | ❌ | Create/update/delete; `delete` has a state guard (blocked if any documents use the category) |

**Impersonation: deliberately not in this table yet.** See the dedicated
Impersonation section in Risks above — permission names depend on decisions not
yet made, adding rows here would misrepresent them as settled.

### Super-admin namespace (separate — does not participate in the grid above)

| Permission | `super_admin` |
|---|---|
| `super-admin.schools.manage` | ✅ |
| `super-admin.users.manage` | ✅ (cross-school — a structurally different capability from school-level `users.*`, not a superset of it in the same table) |
| `super-admin.settings.manage` | ✅ |
| `super-admin.schools.impersonate` | ✅ | Path B (`SuperAdmin\SchoolController::impersonate()`). Deliberately a distinct permission from `users.impersonate`, not folded into it (2026-08-26 decision, resolving open question #2) — the capability shape genuinely differs: super_admin can only impersonate an **admin** of a chosen school (via the new admin-picker, see Phase log), bypasses the package's own guard checks entirely (self-impersonation/nested-impersonation protections are Path A-only), and is reached through the Super Admin → Schools UI, not the Users pages |

### Summary: every ownership/state-scoped permission (25 confirmed, 0 pending)

These stay as in-Policy scoping logic even after Spatie is in place — Spatie
governs *whether a role has the permission at all*, not *which records* a
permission-holder can touch. Listed together here so Phase 5 has a checklist of
every Policy that needs to keep its scoping logic when rewritten to call
`$user->can(...)`:

`attendance.view` (teacher), `attendance.create` (teacher), `attendance.view-own-children` (guardian),
`grades.view` (teacher), `exams.view` (teacher), `exams.update` (teacher — new),
`exam-results.view` / `.create` / `.update` (teacher), `timetable-slots.view` (teacher),
`timetable-availability.manage` (teacher — unverified), `reports.view` (teacher + guardian),
`report-comments.update` (teacher), `documents.view` / `.delete` (teacher + guardian),
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
`accident-reports.review`, same underlying action).

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
23 permissions now carry ownership/state scoping (up from 18), with 2 more
proposed-but-disputed pending the Quran decisions above.
