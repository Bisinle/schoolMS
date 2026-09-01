# Permission System — Current State Reference

This document describes **how the permission system works today**. It is not a
history of the Spatie migration — for that, see `docs/spatie-migration-worksheet.md`
(the process log) and `docs/spatie-migration-verification-checklist.md` (the
final test-by-test sign-off). Read this document if you just want to understand
or change the current system; read those two only if you need to know how it
got this way.

This is the reference to point people at when someone asks "how does
permissions work in this app?"

---

## 1. The core model

### Permissions are grouped by module, one string per capability

Every permission is named `{module}.{action}` — e.g. `students.view`,
`students.create`, `attendance.view-own-children`, `report-comments.lock`.

- Module names with more than one word are kebab-case: `exam-results`,
  `timetable-periods`, `accident-reports`, `document-categories`.
- The action is usually `view` / `create` / `update` / `delete` where the app
  genuinely has that level of granularity.
- Where the code doesn't distinguish create/update/delete (e.g. Settings,
  Fees, Timetable Templates), there's a single `.manage` permission instead —
  the naming deliberately doesn't invent a split that isn't really there.
- A few modules have custom action names that match a real, specific
  capability: `.review` (Accident/Incident Reports), `.verify` / `.reject`
  (Documents), `.acknowledge` (Policies), `.lock` / `.unlock`
  (Report Comments).
- Super admin has its own separate namespace, `super-admin.*`
  (`super-admin.schools.manage`, `super-admin.users.manage`, etc.) — it
  doesn't participate in the school-level module grid at all, because
  super admins are blocked from the entire school-level route group (see
  §2).

There are 97 permissions in total (93 school-level + 4 super-admin). The
full, current list — and exactly which of the 4 roles gets which — lives in
**`database/seeders/RolePermissionSeeder.php`**. That file is the single
source of truth for "who can do what"; this document explains the *shape* of
the system, not a duplicate copy of the list (it will drift — always check
the seeder directly).

The 4 roles that exist today: `super_admin`, `admin`, `teacher`, `guardian`.

### `teams => false` — what it means and why it's safe

`config/permission.php` has Spatie's "teams" feature turned off
(`'teams' => false`). In plain terms: **a role like "admin" is one single,
global template** — "admin" means the same set of permissions everywhere in
the app, not a different set per school.

This does **not** conflict with the app's school-data-isolation rule. Those
are two separate concerns:

- **Permissions answer "is this user *capable* of this action at all?"**
  (e.g. "can this user view students?") — this is what Spatie roles/permissions
  govern, and it's fine for it to be global, because "admin can view students"
  is true for every school's admin equally.
- **Data scoping answers "which specific rows can this user see?"** — this is
  still handled entirely separately, by `BelongsToSchool` / `SchoolScope`
  (see the root `CLAUDE.md` for that mechanism) on the actual data models
  (Student, Guardian, Grade, etc.), completely untouched by this migration.

So a teacher at School A having the `students.view` permission does not let
them see School B's students — `SchoolScope` still filters every query to
their own `school_id` regardless of what permissions they hold. Permissions
and tenant isolation are independent layers.

### How a user gets a role

A user's role is still a plain string on the `role` column
(`app/Enums/UserRole.php`, 4 cases: `SUPER_ADMIN`, `ADMIN`, `TEACHER`,
`GUARDIAN`) — **this column is still the source of truth**, nothing in the
Spatie migration removed it or stopped writing to it.

**`app/Observers/UserObserver.php`** keeps the user's actual Spatie role
(the `model_has_roles` pivot table Spatie uses internally) in sync with that
column automatically:

- On `created`: assigns the Spatie role matching `role`.
- On `updated`: if `role` changed, re-syncs the Spatie role to match.

In practice this means: **nobody ever calls `$user->assignRole(...)`
directly** in a controller. You just set `$user->role = 'teacher'` (or
create the user with that role) the normal way, and the Observer keeps the
Spatie side consistent — so every existing place that creates/edits a user
(controllers, factories, seeders) works unmodified and automatically stays
permission-correct.

---

## 2. Where permissions are enforced

### Routes — `permission:` middleware

Every school-level route is gated by `permission:{permission-name}`
middleware (79 occurrences in `routes/web.php`), e.g.:

```
Route::middleware(['user.active', 'permission:teachers.view'])->group(function () {
    Route::get('/teachers', [TeacherController::class, 'index'])->name('teachers.index');
    ...
});
```

**No `role:...` middleware is used anywhere in current routes** — that string
pattern was fully replaced. Two related things worth knowing so nobody
"fixes" them by mistake:

- The whole authenticated school-route block is *also* wrapped in
  `['auth', 'school.admin', 'school.active']` (`routes/web.php` line ~100)
  — this is unrelated to permissions specifically; it's the tenant-isolation
  boundary (`school.admin` blocks super admins from school routes at all;
  `school.active` logs out users whose school has been deactivated).
- Most route groups also stack a `user.active` middleware
  (`App\Http\Middleware\CheckUserActive`) alongside `permission:...`. This
  is the **only** place in the app that logs a user out for being
  deactivated (`is_active = false`) — it used to live inside the old
  `RoleMiddleware`, and was extracted verbatim so that removing `role:`
  middleware didn't silently drop that check.
- `bootstrap/app.php` still registers a `role` middleware alias pointing at
  `App\Http\Middleware\RoleMiddleware`, and that file still exists. It is
  **unused at the route layer** but deliberately left in place, not deleted
  — see §4 (Known Exceptions).

### Policies — permission check, then (sometimes) ownership scoping

All 22 classes in `app/Policies/` follow the same two-step shape:

1. **First**, check the permission exists at all: `$user->can('module.action')`.
2. **Then**, for anything that isn't a flat yes/no by role (i.e. anything
   where "admin sees everything, but a teacher/guardian only sees their own
   records"), the Policy narrows further using the plain `isAdmin()` /
   `isTeacher()` / `isGuardian()` helpers on `User` — **not** as a second
   permission check, but purely to decide *which rows* the already-permitted
   user gets to touch.

This is the single most important pattern to understand in this system:
**Spatie governs whether a role has a capability at all; the Policy's own
code still governs which specific record.** Spatie was never meant to
replace ownership/scoping logic — only the flat "can this role do this at
all" layer.

Real example, `app/Policies/AttendancePolicy.php::view()`:

```php
public function view(User $user, Attendance $attendance): bool
{
    if ($user->isAdmin()) {
        return $user->can('attendance.view');   // admin: no further scoping, sees any record
    }

    if ($user->isTeacher()) {
        if (! $user->can('attendance.view')) return false;
        $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
        return in_array($attendance->grade_id, $teacherGradeIds);  // scoped to own grades
    }

    if ($user->isGuardian()) {
        if (! $user->can('attendance.view-own-children')) return false;
        $childrenIds = $user->guardian->students->pluck('id')->toArray();
        return in_array($attendance->student_id, $childrenIds);  // scoped to own children
    }

    return false;
}
```

Note admin and teacher/guardian even use **different permission names** here
(`attendance.view` vs. `attendance.view-own-children`) — the taxonomy
sometimes splits "full view" and "own-only view" into separate permissions
specifically so a role's *capability* (not just its scoping) is visible from
the permission name alone.

Where a module has **no** ownership distinction at all (e.g. Students,
Teachers), the Policy is just the permission check, nothing else — see
`app/Policies/StudentPolicy.php`, every method is a one-line
`return $user->can('students.xxx');`.

### Frontend (Inertia + React)

**Backend → frontend, how the data gets there:**
`app/Http/Middleware/HandleInertiaRequests.php::share()` puts
`auth.user.permissions` on every page — it's `$user->getAllPermissions()->pluck('name')`,
i.e. the flat list of every permission string the logged-in user actually
holds. `auth.user.role` is still shared too, separately — it's not gone, and
it's still used for display (e.g. "logged in as teacher" labels) and for a
handful of ownership-bypass checks that mirror the backend pattern above
(see §4).

**`resources/js/Hooks/usePermissions.js`** is the frontend equivalent of
`$user->can()`:

```js
const { can, canAny } = usePermissions();
{can('students.create') && <CreateButton />}
{canAny(['quran-homework.view', 'quran-homework.view-own']) && <Page />}
```

It just reads `auth.user.permissions` into a `Set` and does membership
checks — no server round-trip, since the permission list already arrived
with the page.

**`resources/js/Config/navigation.js`** builds the sidebar/nav per role, and
each nav item declares the permission(s) it needs:

```js
{ name: "Students", href: "/students", icon: Users, permission: "students.view" },
```

A shared filter function drops any item whose `permission` (or `permissions`,
for an "any of" check) the current user doesn't hold, recursing into
submenus. This means the nav now reflects the user's *real* permission set,
not a hardcoded guess about what a role name implies — if a role's
permissions change in the seeder, the nav updates automatically with no
code change to `navigation.js` itself for existing roles. (Adding a *new*
role still needs a new array in this file — see §3.)

---

## 3. How to add or change something

This section is written for making a change, not for understanding the
architecture — the goal is: know exactly which file to open.

### Add a brand-new role

1. **`app/Enums/UserRole.php`** — add a new `case` and its `label()` entry.
   Anywhere that already uses `UserRole::cases()`/`::toArray()`/`::values()`
   (e.g. the role dropdown in `UserController.php`) picks it up automatically
   — no further change needed there.
2. **`database/seeders/RolePermissionSeeder.php`** — add a new
   `private const {ROLE}_PERMISSIONS = [...]` array, add it to the `$roles`
   array in `run()`, then re-run the seeder (`php artisan db:seed --class=RolePermissionSeeder`,
   it's idempotent/safe to re-run).
3. **`app/Models/User.php`** — add a matching `isXxx(): bool` helper if any
   Policy will need to special-case this role for ownership-scoping (see
   "make a role admin-style" below). Not needed if the new role's access is
   flat permission-only with no per-record scoping.
4. **`resources/js/Config/navigation.js`** — add a new array for the role.
   There's no inheritance between role menus — each array is hand-written,
   even if it overlaps heavily with an existing role's — but every item just
   needs the right `permission` string, so this is a matter of copying
   which pages should be visible, not re-deriving access logic.
5. Because routes and Policies check `permission:...` / `$user->can(...)`
   rather than a role name, **no route or Policy file needs to change** for
   any module where the new role's access is a flat "has this permission or
   doesn't" — only for modules where it needs an admin-style bypass (below).

### Add a brand-new permission

1. Add the string to `ALL_PERMISSIONS` in `RolePermissionSeeder.php`.
2. Add it to whichever role(s)' `_PERMISSIONS` arrays should have it.
3. Re-run the seeder.
4. Wire it in wherever it's actually meant to gate something: a
   `permission:module.action` route middleware, a `$user->can('module.action')`
   check inside a Policy method, and/or a `permission: "module.action"` key
   on a `navigation.js` item / a `can('module.action')` check in a React
   page.

### Grant an existing role a new permission

Add the permission string to that role's array in `RolePermissionSeeder.php`
and re-run the seeder. That's it — every `permission:` route and every
`$user->can(...)` Policy check for that permission picks it up immediately,
with no other file touched, **as long as the permission doesn't need new
ownership-scoping logic** (if it does, see below).

### Make a role "see everything" (admin-style) vs. "see only their own"

This is Policy-code, not seeder-data — it can't be done by editing the
seeder alone. Open the relevant Policy method in `app/Policies/`:

- **"See everything"**: add an `if ($user->isYourRole()) { return true; }`
  (or fold it into an existing admin-equivalent branch) before/instead of the
  narrower ownership check — see `ExamPolicy::update()`'s
  `if ($user->isAdmin()) return true;` for the exact pattern.
- **"See only their own"**: add a branch that checks `$user->can('the.permission')`
  and then narrows by comparing a foreign key on the record to the user (or
  a related model) — e.g. `AttendancePolicy::view()`'s
  `in_array($attendance->grade_id, $teacherGradeIds)` for a teacher, or
  `$exam->created_by === $user->id` for exam ownership.

You'll usually need the matching `isXxx()` helper on `User` first (see
"Add a brand-new role," step 3).

### File map

| What | File |
|---|---|
| Role definitions + labels | `app/Enums/UserRole.php` |
| Permission list + role→permission grants | `database/seeders/RolePermissionSeeder.php` |
| Keeps `role` column and Spatie role in sync | `app/Observers/UserObserver.php` |
| `User` model role helpers (`isAdmin()` etc.) | `app/Models/User.php` |
| Route-level enforcement | `routes/web.php` (`permission:...` middleware), `routes/super-admin.php` |
| Middleware aliases (`permission`, `role`, `user.active`) | `bootstrap/app.php` |
| Deactivated-user logout check | `app/Http/Middleware/CheckUserActive.php` |
| Record-level / ownership authorization | `app/Policies/*.php` (22 files) |
| Backend → frontend permission data | `app/Http/Middleware/HandleInertiaRequests.php` (`auth.user.permissions`) |
| Frontend permission check hook | `resources/js/Hooks/usePermissions.js` (`can()`, `canAny()`) |
| Sidebar/nav visibility per role | `resources/js/Config/navigation.js` |
| Spatie package config (incl. `teams`) | `config/permission.php` |
| Spatie's own tables (roles, permissions, pivots) | migration `2026_08_26_094248_create_permission_tables.php` |

---

## 4. Known exceptions — looks inconsistent, isn't

These were checked and confirmed to be deliberate. Don't "fix" them without
a product decision first.

- **`ReportCommentController.php` and `ReportCommentPolicy.php` are dead
  code** — they still exist as files but have **zero routes** pointing at
  them. The real, live logic for saving/locking/unlocking report comments
  lives in `ReportController::saveComment()`/`lockComment()`/`unlockComment()`,
  with its own separate inline authorization that is *not* identical to what
  the dead Policy claims (e.g. the real path scopes a teacher to being the
  specific **class teacher** for the grade, not just "assigned to the
  grade"). If you're touching report comments, edit `ReportController`, not
  the Report*Comment*Controller/Policy pair.
- **The `role` middleware alias is registered but unused.** `bootstrap/app.php`
  still points `role` → `RoleMiddleware::class`, and the file still exists.
  It's not dead-code cruft to delete — `isAdmin()`/`isTeacher()`-style
  `User` helpers (which `RoleMiddleware` also used internally) are still
  actively used throughout the Policies for ownership scoping (§2), so the
  underlying role-checking machinery stays relevant even though the
  middleware itself no longer gates any route.
- **`attendance.delete` and `exam-results.delete` are real, seeded
  permissions with no route that ever calls them.** Both are admin-only in
  the seeder and both have live Policy `delete()` methods — they're just
  currently unreachable because no delete route/button exists in either
  module. Not a bug; kept so the permission model matches what the Policy
  code expresses, in case a delete UI is added later.
- **`timetable-availability.manage` is asymmetric on purpose (for now).**
  Admin has no ownership restriction at all (can edit any teacher's
  availability record); a teacher is scoped to their own record only. This
  was confirmed by reading `TeacherAvailabilityController.php` directly (no
  Policy file exists for this resource) — it's the current, live behavior,
  not an oversight introduced by the migration.
- **`quran-homework.view` is deliberately unscoped for teachers, while
  `quran-homework.update` is scoped to the owning teacher.** A teacher can
  look at any other teacher's homework record but can't edit it. Confirmed
  intentional (matches `routes/web.php`'s permission gate exactly) — don't
  assume `.view` should be tightened to match `.update`'s scoping.
- **The mobile "More" nav drawer shows a duplicate Quran entry** for
  madrasah teacher/guardian (once as a fixed bottom-bar icon, once again
  inside the drawer). Confirmed as a deliberate quick-access-shortcut
  pattern, not fixed — a UX call, not a permissions bug.

---

## 5. Known gaps — still open

These are real, currently-unresolved items. Listed here so they live in one
place instead of scattered across old audit files.

- **`DashboardController.php` has no fallback branch.** It only handles
  `isAdmin()` / `isTeacher()` / `isGuardian()` (if/elseif, nothing else) —
  fine today since those are the only 3 roles that reach the school
  dashboard (super_admin has its own separate area), but **any future role
  added to the school context will land on a blank/broken-looking dashboard**
  on first login unless a matching branch is added at the same time.
- **`InvoiceController::destroy()` and `clearAll()` have no authorization
  check at all** — not even inline, and no Policy is consulted. Both sit
  only behind the route group's `permission:fees.manage` (admin-only)
  middleware; `destroy()` deletes an invoice (cascading to payments)
  unconditionally, and its own code comment says *"Allow deletion even with
  payments (for development)"*. `clearAll()` wipes every invoice/line-item/
  payment for the school. Pre-existing, not introduced by this migration,
  not yet fixed — needs a deliberate decision (add a payments-exist guard?
  gate `clearAll()` behind something stronger? remove it if dev-only?).
- **`super-admin.settings.manage` is a seeded permission with no
  implementation at all** — the route is commented out in
  `routes/super-admin.php` with `// TODO: Implement later`. Not a bug, just
  genuinely unbuilt.
- **The "Headteacher's Comment" / signature feature conflates "headteacher"
  with "admin," and nothing here resolves that.** `reports.headteacher-comment`
  is a real, isolated permission (currently admin-only) gating the
  report-card comment slot; the matching `headteacher_signature` setting
  lives under the admin-only Settings module. If/when a real Head Teacher
  role is added, whoever implements it will need an explicit decision on
  whether that role also gets `reports.headteacher-comment` (and signature
  access), since "Reports: full access" and "Settings: no access" pull in
  opposite directions on this one feature specifically.
- **Timetable's read tier is inconsistent across its own sub-resources.**
  Periods/Rooms/Slots have a clean `permission:...view` / `...manage` split;
  Templates, Dashboard, and Blueprints are single `.manage`-only permissions
  with no view-only tier at all. Anyone scoping a new role's Timetable
  access to "read-only" needs to explicitly decide whether that includes
  Templates/Dashboard/Blueprints or just Periods/Rooms/Slots — the current
  permission model doesn't make that decision for you.
