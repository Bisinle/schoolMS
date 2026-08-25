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
- [x] **Phase 3** — Design the permission taxonomy
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
| `timetable.view-own` | ❌ | ✅ | ❌ | Teacher's own generated schedule (`/my-timetable`) |
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
| `incident-reports.update-status` | ✅ | ✅ | ❌ | — |
| `incident-reports.update` | ✅ | ✅ (scoped) | ❌ | Same ownership + state pattern as accident-reports.update |
| `incident-reports.delete` | ✅ | ❌ | ❌ | — |

### Super-admin namespace (separate — does not participate in the grid above)

| Permission | `super_admin` |
|---|---|
| `super-admin.schools.manage` | ✅ |
| `super-admin.users.manage` | ✅ (cross-school — a structurally different capability from school-level `users.*`, not a superset of it in the same table) |
| `super-admin.settings.manage` | ✅ |

### Summary: every ownership/state-scoped permission (18 total)

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
`accident-reports.update` / `incident-reports.update` (teacher), `fees.view-own-invoices` (guardian)

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
