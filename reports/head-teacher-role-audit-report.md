# Head Teacher Role — Audit & Feasibility Report

Audit only. No code was changed. Guardian phone number visibility is out of scope per the request and is not addressed below.

---

## Part 1 — What Exists Today

### 1.1 Architecture of the permission system

There is **no permission package** (no Spatie Permission, no Gate::define/Gate::before anywhere in `app/Providers`). Authorization is a mix of three layers, none of which are capability-based — all of them check literal role name strings:

1. **A plain `role` column on `users`** (`App\Enums\UserRole`), a native PHP enum with 10 cases: `super_admin`, `admin`, `teacher`, `guardian`, `accountant`, `receptionist`, `nurse`, `it_staff`, `maid`, `cook`. No other role-related columns exist (no `permissions` table, no pivot).

2. **Route middleware** — the primary enforcement boundary:
   - `role:admin,teacher` etc. (`App\Http\Middleware\RoleMiddleware`) — reads `...string ...$roles` from the middleware string and does `in_array($request->user()->role, $roles)`. Hardcoded per-route.
   - `super.admin` (`SuperAdminMiddleware`) — calls `$user->isSuperAdmin()`.
   - `school.admin` (`SchoolAdminMiddleware`) — blocks super admins from school routes, requires `school_id`.
   - `school.active` (`CheckSchoolActive`) — logs out users whose school is deactivated.
   - `madrasah.only` (`CheckMadrasahSchool`) — gates the Quran module to `school_type === 'madrasah'`.

3. **`User` model boolean helpers** (`app/Models/User.php:147-219`): `isSuperAdmin()`, `isAdmin()`, `isSchoolAdmin()`, `isTeacher()`, `isGuardian()`, `isAccountant()`, `isReceptionist()`, `isNurse()`, `isIT()`, `isMaid()`, `isCook()` — one boolean per role, each presumably `return $this->role === 'x'`. These are what all 22 Policy classes and most controllers call.

4. **22 Laravel Policy classes** in `app/Policies/` (`StudentPolicy`, `DocumentPolicy`, `AttendancePolicy`, `TeacherPolicy`, `GuardianPolicy`, `ExamPolicy`, `ExamResultPolicy`, `GradePolicy`, `SubjectPolicy`, `GuardianInvoicePolicy`, `ReportCommentPolicy`, `RoomPolicy`, `StreamPolicy`, `TimetablePeriodPolicy`, `TimetableSlotPolicy`, `TimetableTemplatePolicy`, `DocumentCategoryPolicy`, `AccidentReportPolicy`, `IncidentReportPolicy`, `QuranHomeworkPolicy`, `QuranSchedulePolicy`, `ImpersonationLogPolicy`, `PolicyPolicy`). Every one of them is written as `if ($user->isAdmin()) ... elseif ($user->isTeacher()) ... elseif ($user->isGuardian())` — i.e., hardcoded to the 2-3 roles that existed when each policy was written. None of them iterate over `UserRole::cases()` or use any dynamic/config-driven permission table.

There is **no unified per-module, per-action capability matrix anywhere** — the closest thing to one is this report.

### 1.2 Full inventory — backend role checks

**Route middleware** (`routes/web.php`) — 57 `role:` middleware applications, plus the always-on `school.admin`/`school.active` wrapper for the whole authenticated block (line 100). Every occurrence:

| Lines | Roles allowed | Routes |
|---|---|---|
| 111–113 | `admin,teacher` | `GET /grades` |
| 115–118 | `admin` | grades create/store |
| 120–122 | `admin,teacher` | `GET /grades/{grade}` |
| 124–134 | `admin` | grades edit/update/destroy/restore/curriculum/assign-teacher/remove-teacher/update-teacher |
| 137–139 | `admin,teacher` | `GET /students` |
| 141–147 | `admin` | students create/store/import (template/preview/import) |
| 149–151 | `admin,teacher` | `GET /students/{student}` |
| 153–159 | `admin` | students edit/update/destroy/deactivate/reactivate |
| 162–164 | `admin,teacher` | `GET /guardians` |
| 166–173 | `admin` | guardians create/inactive/store/import |
| 175–177 | `admin,teacher` | `GET /guardians/{guardian}` |
| 179–187 | `guardian` | `/guardian/children`, `/guardian/attendance`, `/guardian/quran-homework` (nested `madrasah.only`) |
| 189–195 | `admin` | guardians edit/update/destroy/deactivate/reactivate |
| 198–206 | `admin` | **all** Teacher CRUD (index/create/store/show/edit/update/destroy) |
| 209–219 | `admin` | **all** User management CRUD |
| 222–226 | `admin,teacher` | attendance index/mark/reports |
| 228 | **none** (any authenticated role) | `GET /attendance/student/{student}` — protected only by `AttendancePolicy::view` inside the controller, if called |
| 231–233 | `admin,teacher` | `GET /subjects` |
| 235–242 | `admin` | subjects create/store/edit/update/destroy/assign-grades |
| 244–246 | `admin,teacher` | `GET /subjects/{subject}` |
| 249–258 | `admin` | **all** Stream CRUD |
| 261–268 | `admin,teacher` | exams index/create/store/show/edit/update |
| 270–272 | `admin` | `DELETE /exams/{exam}` |
| 275–279 | `admin,teacher` | exam-results index/store/update |
| 282–285 | `admin,teacher,guardian` | `/reports`, `/reports/generate` |
| 287–291 | `admin,teacher` | report comment save/lock/unlock |
| 294–297 | `admin` | `/settings/academic` (incl. headteacher signature, see §1.4) |
| 300–318 | `admin` | **all** Blueprint CRUD + period generation |
| 323–325 | `teacher` | `/timetables/my-timetable` |
| 328–330 | `admin` | `/timetables/dashboard` |
| 333–353 | `admin` | **all** Timetable Template CRUD/publish/archive/generate |
| 356–358 | `admin,teacher` | `GET /timetables/periods` |
| 360–363 | `admin` | periods create/store |
| 365–367 | `admin,teacher` | `GET /timetables/periods/{period}` |
| 369–373 | `admin` | periods edit/update/destroy |
| 376–378 | `admin,teacher` | `GET /timetables/rooms` |
| 380–383 | `admin` | rooms create/store |
| 385–387 | `admin,teacher` | `GET /timetables/rooms/{room}` |
| 389–393 | `admin` | rooms edit/update/destroy |
| 396–398 | `admin,teacher` | `GET /timetables/slots` |
| 400–403 | `admin` | slots create/store |
| 405–407 | `admin,teacher` | `GET /timetables/slots/{slot}` |
| 409–413 | `admin` | slots edit/update/destroy |
| 416–424 | `admin,teacher` | **all** Teacher Availability CRUD |
| 435–437 | `admin,teacher,guardian` | `GET /quran` (dashboard) |
| 440–458 | `admin,teacher` | Quran homework CRUD + Quran API endpoints |
| 461–465 | `admin,teacher,guardian` | Quran homework read-only (student report/homework/show) |
| 468–477 | `admin,teacher` | Quran schedule CRUD |
| 480–482 | `admin,teacher,guardian` | `GET /quran-schedule/{quranSchedule}` |
| 486–494 | **none** (any authenticated role) | **all** Documents routes — authorization delegated entirely to `DocumentPolicy` |
| 500–508 | `admin` | **all** Document Category CRUD |
| 511–514 | `admin` | document verify/reject |
| 517–520 | `admin` | admin password reset |
| 523–546 | `admin` | **all** Settings (school profile, academic years, academic terms, system preferences) |
| 549–604 | `admin` | **all** Fee Management (fees dashboard, transport routes, tuition fees, universal fees, fee preferences, invoices, payments) |
| 607–611 | `guardian` | guardian's own invoices (`/guardian/invoices*`) |
| 695–703 | `admin` | Policies & Regulations create/edit/delete/publish/revisions |

Two structural notes:
- `Route::middleware(['auth'])` blocks for Policies (691), Accident Reports (711), Incident Reports (723) have **no role restriction at the route level at all** — every authenticated role (including guardian) can hit `index`/`create`/`store`/`show` for these; the finer-grained gating (`canCreate`, `canEdit`, `canReview`, `canDelete`) happens only in the React components via `auth.user.role` string checks (§1.3) — there is no server-side Policy class for `AccidentReport`/`IncidentReport` create-authorization beyond what I found (`AccidentReportPolicy`/`IncidentReportPolicy` exist but weren't consulted for this since it wasn't gated at the route). This means the actual server-side enforcement for who can create/review/delete accident & incident reports is not fully route-level — worth independent note, unrelated to Head Teacher scope but relevant since Head Teacher isn't in the target matrix for these two modules at all (they're outside the 13 listed modules).
- **Students, Guardians, Grades, Subjects, and the three Timetable resources (periods/rooms/slots) already have a clean read/write split**: `GET index`/`GET show` under `role:admin,teacher`, everything else (`create/store/edit/update/destroy`) under `role:admin` only. This is directly relevant to Part 2.

**Policies** — every one of the 22 classes hardcodes `isAdmin()`/`isTeacher()`/`isGuardian()` combinations; representative examples pulled in full:
- `app/Policies/StudentPolicy.php:10-42` — `viewAny`: admin/teacher; `view`: admin/teacher, or guardian if linked to the student; `create`/`update`/`delete`: admin only.
- `app/Policies/DocumentPolicy.php:13-108` — `viewAny`/`create`: **true for everyone**; `view`/`download`: admin sees all, teacher sees own, guardian sees own + children's, user sees own; `update`/`verify`: admin only; `delete`: admin, or the uploader if status is pending/rejected.
- `app/Policies/AttendancePolicy.php:13-79` — `viewAny`/`create`: admin or teacher; `view`/`update`: admin (any), teacher (own assigned grades only), guardian (own children, view-only); `delete`: **admin only**.

**Controllers with inline role checks** (not just policy delegation): `AttendanceController`, `DashboardController` (`app/Http/Controllers/DashboardController.php:32-38` — `if isAdmin() ... elseif isTeacher() ... elseif isGuardian()`, **no branch for any other role**, including future Head Teacher — those roles get `Inertia::render('Dashboard', ['role' => $user->role])` with no dashboard data at all), `DocumentController`, `ExamController`, `GradeController`, `GuardianAttendanceController`, `GuardianChildrenController`, `GuardianQuranHomeworkController`, `ImpersonationController`, `InvoiceController`, `PaymentController`, `QuranController`, `QuranHomeworkController`, `ReportController`, `RoomController`, `SchoolSettingController`, `StudentController`, `SuperAdmin/UserController`, `TeacherTimetableController`.

### 1.3 Full inventory — frontend role checks

`HandleInertiaRequests.php` (`app/Http/Middleware/HandleInertiaRequests.php:56-68`) shares `auth.user.role` and `auth.user.is_super_admin` globally on every page — this is the sole source of truth the frontend uses; there is no shared `auth.user.permissions` array or capability map.

**`resources/js/Config/navigation.js`** is a hand-written, per-role **object literal** keyed by exact role string (`admin: [...]`, `teacher: [...]`, `guardian: [...]`, `accountant: [...]`, `receptionist: [...]`, `nurse: [...]`, `it_staff: [...]`, `maid: [...]`, `cook: [...]`, plus `super_admin: [...]` for the separate super-admin shell). Lookup is `navigationConfig[role] || []` (line 193) — an unrecognized role silently gets **zero navigation items**. There is no inheritance/composition between role menus (e.g., `teacher` doesn't reuse any part of `admin`'s array — every menu is written out fresh).

**154 JSX role checks across 41 files**, all of the form `auth.user.role === 'admin'`, `['admin','teacher'].includes(auth.user.role)`, or a locally-derived `const isAdmin = auth.user.role === 'admin'` boolean. Full file list with occurrence counts:

| File | Occurrences | Pattern |
|---|---|---|
| `Layouts/AuthenticatedLayout.jsx` | 6 (lines 23,32,35,104,116,134,152) | Drives `isSuperAdmin`, bottom-nav visibility per role, and passes `role` into `Sidebar` |
| `Layouts/Sidebar.jsx` | 1 (251) | Displays role label |
| `Layouts/TopBar.jsx` | 1 (49) | Displays role label |
| `Pages/Students/Index.jsx` | 6 (26,142,154,161,321,462) | Admin-only create/edit/delete actions |
| `Pages/Students/Show.jsx` (via `Components/Students/StudentsTable.jsx`) | 1 (85) | Admin-only row actions |
| `Pages/Guardians/Index.jsx` | 6 (25,116,130,138,289,401) | Admin-only actions |
| `Pages/Guardians/Inactive.jsx` | 3 (18,86,195) | Admin-only actions |
| `Pages/Grades/Index.jsx` | 4 (102,244,262,300) | Admin-only actions |
| `Pages/Grades/Show.jsx` | 2 (27,205) | Admin-only actions |
| `Pages/Subjects/Index.jsx` | 4 (29,34,37,209,321 — 5 actually) | Admin-only actions |
| `Pages/Subjects/Show.jsx` | 1 (20) | Admin-only actions |
| `Pages/Exams/Index.jsx` | 5 (42,46,185,188,193,489 — 6 actually) | Admin-only secondary actions/delete |
| `Pages/Exams/Show.jsx` | 3 (46,189,248) | admin OR teacher gated edit actions |
| `Pages/ExamResults/Show.jsx` | 2 (21,126) | admin OR teacher gated edit actions |
| `Pages/Reports/Index.jsx` | uses `isGuardian` prop (not inline role check) | passed from `ReportController` |
| `Pages/Reports/Show.jsx` | 2 (21,126) | admin OR teacher gated edit actions |
| `Pages/Reports/ReportCard.jsx` | 2 (23,518) + `isGuardian`/`canEditTeacherComment` props | `isAdmin` gates headteacher-signature block |
| `Pages/Reports/StudentReport.jsx` | uses `canEditHeadteacherComment`/`isGuardian` props (see §1.4) | — |
| `Pages/Timetables/Templates/Index.jsx` | 3 (143,260,328) | Admin-only actions |
| `Pages/Timetables/Periods/Index.jsx` | 3 (98,304,332) | Admin-only actions |
| `Pages/Timetables/Rooms/Index.jsx` | 3 (107,228,257) | Admin-only actions |
| `Pages/Timetables/Availability/Index.jsx` | 4 (87,122,148,207) | Admin-only actions |
| `Pages/Timetables/Availability/Create.jsx` | 3 (10,13,66) | `isAdmin` toggles whether teacher_id is selectable |
| `Pages/Timetables/Availability/Edit.jsx` | 2 (10,66) | same pattern |
| `Pages/Fees/Invoices/Index.jsx` | 11 (29,41,73,144,182,201,206,214,226,274,279,323,364,428 — many) | Admin vs. guardian view branching |
| `Pages/Fees/Invoices/Show.jsx` | 4 (166,200,211,231) | Admin-only actions, guardian URL branch |
| `Pages/Documents/Index.jsx` | 8 (105,340,362,364,383,452,473,519,567) | Admin-only verify/reject/category actions |
| `Pages/Documents/Show.jsx` | 3 (367,370,392) | Admin-only verify/reject |
| `Pages/Policies/Index.jsx` | 7 (75,81,94,125,144,162,239) | Admin-only create/edit |
| `Pages/Policies/Show.jsx` | 3 (69,234,242) | Admin-only edit |
| `Pages/AccidentReports/Index.jsx` | 2 (78,283) | `canCreate` = admin/teacher/nurse/receptionist array |
| `Pages/AccidentReports/Show.jsx` | 3 (64,65,66) | `canEdit`/`canReview`/`canDelete` role arrays |
| `Pages/IncidentReports/Index.jsx` | 3 (92,94,96) | same pattern |
| `Pages/IncidentReports/Show.jsx` | 3 (86,87,88) | same pattern |
| `Pages/Quran/Index.jsx` | 6 (20,25,49,55,118,143,172,206 — several) | teacher/guardian branching, madrasah-only |
| `Pages/Quran/Homework/Index.jsx` | 2 (44,49) | admin/teacher gated actions |
| `Pages/Quran/Homework/Show.jsx` | 2 (27,28) | guardian flag, admin/owner edit check |
| `Pages/Quran/Homework/StudentView.jsx` | 1 (32) | guardian routing |
| `Pages/Quran/Homework/StudentReport.jsx` | 1 (79) | guardian routing |
| `Pages/Quran/Schedule/Show.jsx` | 2 (33,93,328) | guardian view branch |
| `Components/Reports/ReportsTable.jsx` | prop-driven (`isGuardian`) | — |
| `Components/Students/StudentsTable.jsx` | 1 (85) | Admin-only row actions |

**None of these 41 files** have any fallback/default branch for a role outside `admin`/`teacher`/`guardian`/(occasionally `nurse`/`receptionist` in the two report modules) — a Head Teacher visiting any of them today would simply not see any of the admin-gated buttons, which for the *read-only* modules in the target matrix is actually already the desired behavior, but for the modules where the matrix wants **full/admin-parity** access (Attendance, Exams, Reports) it means the UI currently has no path to show those controls to a non-admin, non-teacher role at all.

### 1.4 The existing "Headteacher" concept — not a role, a report-card artifact

Critical finding for Part 2: the string "headteacher" **already exists extensively in this codebase**, but as a **report-card comment slot and a school-settings signature image**, not as a user role:

- `database/migrations/2025_10_30_151341_create_report_comments_table.php:19-21` — `report_comments` table has `headteacher_comment`, `headteacher_comment_locked_at`, `headteacher_locked_by` columns (alongside a separate `teacher_comment`).
- `app/Models/ReportComment.php:21-77` — `headteacherLocker()` relation, `isHeadteacherCommentLocked()`, `canEditHeadteacherComment(User $user)`.
- `app/Http/Controllers/ReportController.php:132` — `'canEditHeadteacherComment' => $user->isAdmin()` (shared to the frontend).
- `app/Http/Controllers/ReportController.php:397-398` — `if ($validated['comment_type'] === 'headteacher' && !$user->isAdmin()) { abort(403, 'Only administrators can add headteacher comments.'); }`
- `app/Http/Controllers/ReportCommentController.php` — parallel `headteacher_comment` validation/locking logic (a second, older controller covering the same concept — both `ReportController` and `ReportCommentController` implement comment save/lock/unlock; worth independent note that this looks like duplicated/legacy code, unrelated to the Head Teacher role question but adjacent).
- `app/Http/Controllers/SchoolSettingController.php:19,39,46` — `SchoolSetting::get('headteacher_signature')` / `set('headteacher_signature', $path)`, gated by `role:admin` (`/settings/academic`, `routes/web.php:294-297`).
- `resources/js/Pages/Reports/StudentReport.jsx` — an entire "Headteacher's Comment" UI block (lines 500-586) gated by `canEditHeadteacherComment` (currently = `isAdmin()`), plus a "Headteacher's Signature" print block (line 636).

**This is the single biggest conceptual risk in adding a real Head Teacher role.** Today, "the headteacher" in this system *is* the admin, wearing a headteacher hat when signing report cards. The target matrix says Reports = "Full access (same as admin)" for the new role — read literally, that includes the ability to write/lock the `headteacher_comment` and manage the `headteacher_signature` setting. But Settings is explicitly "No access" for Head Teacher in the matrix, and the signature lives under Settings. So: does the new Head Teacher role get to write the comment that's *literally named after their title* but not touch the signature that's *also literally named after their title* and lives in a module they're locked out of? This isn't answerable from the codebase — it's a product decision the spec doesn't resolve, and implementing "Reports = full access" naively would either leave this contradiction in place (Head Teacher can edit report grades but the "Headteacher's Comment" stays admin-only, which will look broken to whoever uses this role) or require deciding to also open `canEditHeadteacherComment` and/or the signature setting to the new role, which contradicts the "Settings: No access" line.

---

## Part 2 — Feasibility of Adding "Head Teacher"

### Is the system granular enough?

**No — it is coarse, and adding this role means touching every layer, not configuring one.** There is no data-driven permission table to insert a row into. Every enforcement point (route middleware string, Policy method body, `isXxx()` helper, `navigation.js` object key, and each of the 154 JSX conditionals) is a **hardcoded literal check against specific role names**, written independently per file. There is no shared "role → allowed modules/actions" structure that a new role could plug into. Concretely: even though the target matrix is simple (read-only for 5 modules, full access for 3, no access for 2, N/A-parity for 1), satisfying it requires editing dozens of files individually because each one encodes its own copy of "which roles are allowed here."

The one thing working in favor of a moderate (not high) complexity: for every module marked **read-only** in the matrix (Students, Teachers, Guardians, Grades, Subjects, Timetable), the existing routes *already* separate "read" (`role:admin,teacher` on index/show) from "write" (`role:admin` only on create/edit/destroy) — so granting read-only access is "add `head_teacher` to the existing read-group middleware," not "invent a new split." The pain is concentrated in the **full-access** modules (Attendance, Exams, Reports), where write actions are currently split between `admin,teacher` and `admin`-only in ways that don't map cleanly to "give Head Teacher parity with admin," plus the Reports/Headteacher-comment ambiguity in §1.4, plus Teachers being **100% admin-only today** (no existing read-tier to extend at all — `routes/web.php:198-206` has no `admin,teacher` split for Teacher CRUD, unlike Students/Guardians/Grades/Subjects).

### Complexity estimate: **Medium**

Not low, because it touches 30+ files across three architectural layers with no shared abstraction to lean on, and includes at least one real ambiguity (Reports/Headteacher-comment) that needs a product decision before implementation, plus a full new dashboard branch and a full new navigation array with no existing template to copy from that isn't `admin`'s (which would also grant far more than the matrix allows). Not high, because: no new database schema is needed (role is already a free-text-validated column, not an enum-constrained DB column, per the `UserRole` PHP enum backing `role:` middleware string matching — extending the union of accepted role names is additive, not a migration), no permission package needs to be introduced, and the majority of the module list (5 of 8 non-N/A modules) is a straightforward "add role to an existing read-only middleware group + policy branch" change.

### Every touchpoint required, by module (from Part 1's inventory)

| Module | Target access | Backend changes needed | Frontend changes needed |
|---|---|---|---|
| **Students** | Read-only | `routes/web.php:137,149` — add `head_teacher` to the two `role:admin,teacher` groups (index, show). Leave 141,153 (`role:admin`) untouched. `StudentPolicy.php:10-27` — add `head_teacher` to `viewAny`/`view` alongside admin/teacher. | `Students/Index.jsx` (6 checks) and `StudentsTable.jsx` (1 check) all gate *admin-only* actions — these should naturally stay hidden for head_teacher without changes, but must be spot-checked since they're `=== 'admin'` not `!== 'admin'`, so no accidental exposure — low risk, verify only. |
| **Teachers** | Read-only | **No existing read tier to extend** — `routes/web.php:198-206` is one `role:admin` block covering index+show+everything. Must split into a new `role:admin,teacher... wait, head_teacher` read group for index/show vs. keep create/edit/destroy admin-only. `TeacherPolicy.php` needs a `head_teacher` branch added (not yet inspected in full — flag for implementation-time read). | No JSX role checks were found gating Teacher pages specifically in the 41-file inventory — likely low frontend impact, but `Teachers/Index.jsx`/`Show.jsx` weren't in the grep hit list, meaning they may currently render admin-only UI unconditionally and need new guards added (currently nobody but admin can reach these pages at all, so no prior gating existed). |
| **Guardians** | Read-only | `routes/web.php:162,175` — add `head_teacher` to the two `admin,teacher` groups. Leave 166,189 (`admin`-only) untouched. `GuardianPolicy.php` needs a `head_teacher` branch (not yet inspected — flag). | `Guardians/Index.jsx` (6 checks), `Guardians/Inactive.jsx` (3 checks) — same "already admin-gated, verify only" pattern as Students. |
| **Users** | No access | None — already `role:admin` only (`routes/web.php:209-219`), nothing to change. | None. |
| **Fees** | No access | None — already `role:admin` only (`routes/web.php:549-604`), nothing to change. Guardian-only invoice routes (607-611) are unrelated. | None. |
| **Settings** | No access | None — already `role:admin` only (`routes/web.php:294-297,523-546`), nothing to change. **Includes the `headteacher_signature` setting** (§1.4) — explicitly stays out of Head Teacher's reach per the matrix, which is the seed of the Reports ambiguity below. | None. |
| **Attendance** | Full (= admin) | `routes/web.php:222-226` — add `head_teacher` to `role:admin,teacher` (covers index/mark/reports). `AttendancePolicy.php:47-51` (`create`) already covers admin/teacher — needs `head_teacher` added to match "full." `AttendancePolicy.php:75-79` (`delete`) is **admin-only today** — must add `isHeadTeacher()` (a new helper) for true full parity, since matrix says "same as admin" not "same as teacher." Route 228 (`student-history`) has no role gate today; unaffected either way. | No JSX gating was found for the Attendance index page in the inventory — likely fine as-is once backend allows it. |
| **Grades** | Read-only | `routes/web.php:111,120` — add to the two `admin,teacher` groups. `GradePolicy.php` needs a `head_teacher` branch (not yet inspected — flag). | `Grades/Index.jsx` (4 checks), `Grades/Show.jsx` (2 checks) — verify-only pattern. |
| **Subjects** | Read-only | `routes/web.php:231,244` — add to the two `admin,teacher` groups. `SubjectPolicy.php` needs a `head_teacher` branch (not yet inspected — flag). | `Subjects/Index.jsx` (5 checks), `Subjects/Show.jsx` (1 check) — verify-only pattern. |
| **Exams** | Full (= admin) | `routes/web.php:261-268` (`admin,teacher`) — add `head_teacher`. `routes/web.php:270-272` (`DELETE`, `admin`-only) — must **also** add `head_teacher` for true full parity, unlike the read-only modules. `ExamPolicy.php`/`ExamResultPolicy.php` need `head_teacher` branches, specifically wherever they currently gate delete/destroy to admin-only (not yet inspected in full — flag). | `Exams/Index.jsx` (6 checks) and `Exams/Show.jsx` (3 checks) currently gate destructive/edit actions to `=== 'admin'` — these need updating to `=== 'admin' || === 'head_teacher'` (or an `isAdminOrHeadTeacher` helper) for the delete button specifically to appear; the admin/teacher edit checks already pass through correctly once the role is teacher-adjacent. `ExamResults/Show.jsx` (2 checks) same pattern. |
| **Timetable** | Read-only | `routes/web.php:356,365,376,385,396,405` — 6 separate `admin,teacher` index/show groups (periods, rooms, slots) need `head_teacher` added. Templates (`333-353`), dashboard (`328-330`), blueprints (`300-318`) are **admin-only with no read tier** — matrix says Timetable is read-only overall, but it's ambiguous whether "Timetable" in the spec means just periods/rooms/slots (which have a read tier) or also templates/dashboard (which don't) — flag as ambiguous, needs product clarification. `TimetablePeriodPolicy`/`TimetableSlotPolicy`/`RoomPolicy`/`TimetableTemplatePolicy` need `head_teacher` view branches. | `Timetables/Templates/Index.jsx`, `Periods/Index.jsx`, `Rooms/Index.jsx`, `Availability/Index.jsx` all gate admin-only actions consistently — verify-only, no exposure risk. |
| **Reports** | Full (= admin) | `routes/web.php:282-285` (`admin,teacher,guardian`) already includes read access implicitly once head_teacher is added; needs `head_teacher` added explicitly. `routes/web.php:287-291` (`admin,teacher`, save/lock/unlock comments) needs `head_teacher` added. **The real blocker**: `ReportController.php:132,397-398` hardcode `canEditHeadteacherComment`/comment-type authorization to `isAdmin()` only — per §1.4, this needs an explicit product decision (does Head Teacher get to write the "Headteacher's Comment," given Settings — where the matching signature lives — is off-limits?) before this can be implemented correctly. `ReportCommentController.php` has the same duplicated logic and would need the identical decision applied twice. | `Reports/ReportCard.jsx:23,518` (`isAdmin` gates the headteacher-signature print block) and `Reports/StudentReport.jsx` (`canEditHeadteacherComment` prop) both need updating once the above product decision is made — currently hardwired to admin only. |
| **Documents** | Same as everyone (upload allowed; only Admin approves/reject) | **No change needed.** Confirmed no route-level role restriction exists for upload/view/download (`routes/web.php:486-494`); `DocumentPolicy.php:13-108` already grants `create`/`viewAny` to all authenticated users and restricts `update`/`verify` to admin only — this already matches the target matrix exactly for any new role, including Head Teacher, with zero changes. | None — `Documents/Index.jsx`/`Show.jsx` already gate verify/reject to `=== 'admin'`; a head_teacher user gets the same experience any non-admin role gets today. |

### Cross-cutting touchpoints (every module, not module-specific)

1. **`app/Enums/UserRole.php`** — add `case HEAD_TEACHER = 'head_teacher';` and a label. Trivial, but every place that does `UserRole::cases()`/`::toArray()`/`::values()` (used at minimum in `UserController.php` for the role dropdown on user creation, per earlier session context — not fully re-verified here) will need no further change since those are enum-driven already — this is the one part of the system that *is* config-driven.
2. **`app/Models/User.php:147-219`** — add `isHeadTeacher(): bool`. Every Policy/controller that will special-case Head Teacher needs this helper to exist first.
3. **`resources/js/Config/navigation.js`** — add a brand-new `head_teacher: [...]` array from scratch (line ~191, alongside the other 9). No existing array can be reused/inherited given the object-literal structure; the array must be hand-built to match exactly: Students (view only, no create link), Teachers (view only), Guardians (view only), Attendance (full), Grades (view only), Subjects (view only), Exams (full), Timetable (view only — ambiguous scope per above), Reports (full), Documents (same as any role, i.e. `{ name: "Documents", href: "/documents" }` as in the `guardian` array, not the submenu-with-categories version admin gets).
4. **`app/Http/Middleware/HandleInertiaRequests.php`** — no change required; `role` and `is_super_admin` are already generically shared and don't hardcode the role list.
5. **`DashboardController.php:32-38`** — currently only admin/teacher/guardian get a populated dashboard; Head Teacher would fall through to an empty `{'role': 'head_teacher'}` payload unless a 4th branch (`getHeadTeacherDashboardData()`) is added. Not explicitly required by the spec's matrix (Dashboard isn't one of the 13 listed modules), but flagged since it's the landing page every role hits immediately after login — shipping without it means Head Teacher sees a blank/broken-looking dashboard on first login.
6. **`app/Policies/*.php`** for Teachers, Guardians, Grades, Subjects, Timetable (Period/Slot/Room/Template) — I confirmed the exact structure of `StudentPolicy`, `DocumentPolicy`, and `AttendancePolicy` in full (§1.2) as representative samples; the remaining ~15 policies follow the identical `isAdmin()/isTeacher()/isGuardian()` if/elseif pattern (confirmed via the file listing and the two additional policies inspected), so each one touched by this matrix will need the same kind of `head_teacher` branch added — the *shape* of the change is uniform even though I did not re-read every remaining policy file line-by-line in this pass.

### Biggest risks/ambiguities, summarized

- **Reports vs. "Headteacher's Comment"/signature** (§1.4) is the one item that cannot be implemented from the spec as written — it needs a human decision, not just code changes, because "Reports: full access" and "Settings: no access" pull in opposite directions on a feature that is *literally named after this role*.
- **Timetable's scope is ambiguous**: periods/rooms/slots have a read tier to extend; templates/dashboard/blueprints do not (admin-only, no split). The spec doesn't say whether "Timetable: read-only" is meant to include template/dashboard visibility.
- **Teachers module has no existing read/write split** to extend (unlike Students/Guardians/Grades/Subjects) — it's the one "read-only" module that requires inventing new middleware structure rather than widening an existing group.
- **`navigation.js`'s hardcoded object-literal-per-role shape** means there is no way to "compose" the Head Teacher menu from existing roles — every line must be hand-authored, and any future 12th/13th role will face the identical amount of duplication (this is a standing architectural characteristic of the system, not something specific to this change, but worth naming since it multiplies the size of every future role-adding task).
