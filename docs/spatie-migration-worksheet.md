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
- [ ] **Phase 2** — Reverse-engineer current permissions for `super_admin, admin, teacher, guardian`
- [ ] **Phase 3** — Design the permission taxonomy
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

## Surviving roles — permission inventory (filled in during Phase 2)

| Module | `super_admin` | `admin` | `teacher` | `guardian` | Notes / disagreements between layers |
|---|---|---|---|---|---|
| Students | *pending* | | | | |
| Teachers | *pending* | | | | |
| Guardians | *pending* | | | | |
| Users | *pending* | | | | |
| Fees | *pending* | | | | |
| Settings | *pending* | | | | |
| Attendance | *pending* | | | | |
| Grades | *pending* | | | | |
| Subjects | *pending* | | | | |
| Exams | *pending* | | | | |
| Timetable | *pending* | | | | |
| Reports | *pending* | | | | |
| Documents | *pending* | | | | |
| Accident/Incident Reports | *pending* | | | | Post-Phase-1: admin-only for create/review, by design |

Table rows may be split further per-module (e.g. Students: view/create/edit/delete)
once Phase 2 is underway — this is the starting shape.

---

## Permission taxonomy (Phase 3)

*Not started.*

---

## Risks / open questions / decisions needed

- **Could not run the test suite for Phase 1 verification.** This sandbox's PHP CLI
  is missing the `pdo_sqlite` extension, which `phpunit.xml` requires (in-memory
  sqlite test DB). This is a pre-existing environment gap, confirmed earlier in this
  session before any of this migration's work — not something Phase 1 introduced.
  There are also no existing `AccidentReport`/`IncidentReport` tests to update
  (confirmed via `find tests -iname "*ccident*" -o -iname "*ncident*"` — no results).
  Verified instead via `php -l` on every touched PHP file and a full `pnpm run build`
  of the frontend — both clean. **Recommend actually running `composer test` in an
  environment with `pdo_sqlite` before this branch merges**, since that's real
  verification this worksheet can't claim was done.
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
