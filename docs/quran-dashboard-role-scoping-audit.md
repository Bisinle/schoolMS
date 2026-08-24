# Quran Dashboard Role-Scoping Audit

**Status:** Audit only — no code changed. For go-ahead review before any implementation.
**Scope:** `/quran` dashboard (`QuranController::index`) and the role/relationship
infrastructure it would need to draw on for Teacher- and Guardian-scoped cards.

---

## 1. How roles and scoping currently work in this codebase

### Role definition and enforcement

- Roles are a plain string column on `users.role`, backed by `App\Enums\UserRole`
  (`super_admin`, `admin`, `teacher`, `guardian`, plus 6 staff roles) — not a
  permissions package.
- Enforced primarily via route middleware: `role:admin,teacher,guardian` etc.
  (`App\Http\Middleware\RoleMiddleware`), which checks `$user->role` against an
  allow-list and 403s otherwise. The `/quran` route itself is gated
  `role:admin,teacher,guardian` — all three roles reach the same controller
  action and the same view.
- `User` model has `isAdmin()`, `isTeacher()`, `isGuardian()` boolean helpers,
  and `hasOne` relations `guardian()` → `Guardian` and `teacher()` → `Teacher`
  (a `teacher`/`guardian`-role user has exactly one corresponding profile row).
- Route middleware is the actual security boundary in this app; controller-level
  ownership checks are inconsistently present. The Quran module's three
  Policies (below) are one of the more complete examples of that ownership
  layer actually being formalized.

### Existing Teacher → Student relationship(s) — **there are two, and they are not the same set**

**(A) General school-wide assignment (`grade_teacher` pivot):**
`Teacher::grades()` — `belongsToMany(Grade::class, 'grade_teacher')`, with an
`is_class_teacher` pivot flag (`assignedGrades()` / `classTeacherGrades()`
split on it). A teacher is assigned to zero or more Grades for *some* subject;
Students belong to exactly one Grade (`students.grade_id`). This pivot is
real and populated in this environment (36 rows across 13 teachers).

This is the relationship `QuranHomeworkController::studentsForUser()` already
uses to build the student picker on the Homework/Schedule **Create** screens:
teachers see students in `$user->teacher->grades->pluck('id')`. It answers
*"which students is this teacher allowed to create Quran records for,"* not
*"which students has this teacher actually taught Quran to."*

**(B) Quran-specific ownership (`teacher_id` column, direct FK to `users.id`):**
Both `QuranSchedule.teacher_id` and `QuranHomework.teacher_id` are set at
creation to `auth()->id()`/`$user->id` — i.e., whoever submitted the create
form, not necessarily a `teacher`-role user (an `admin` can also create
schedules/homework per both Policies' `create()` methods, and if they do,
`teacher_id` is the admin's own user id, not any real teacher's). This is the
relationship `QuranSchedulePolicy::view()` already uses to scope "my
schedule" (`$quranSchedule->teacher_id === $user->id`), and the one
`QuranHomeworkController::index()` already filters recent-homework listings
by (`where('teacher_id', $user->id)` when `$user->isTeacher()`).

**These two do not have to agree.** (A) is broader — every student in a grade
this teacher is assigned to for *any* subject, whether or not Quran homework
was ever assigned to them. (B) is narrower and Quran-specific — only students
this exact user has personally created Quran records for. In this
environment (B) is currently a strict subset of (A), because the Create
screens only ever offer students already scoped by (A) — but that's an
incidental consequence of the current UI flow, not a schema guarantee, and it
breaks the moment an admin creates a schedule on a teacher's behalf (their
own admin user id lands in `teacher_id`, not the real teacher's).

**Recommendation for dashboard purposes: use (B).** A Quran progress
dashboard asking "what does *my* Quran teaching load look like" should mean
*records I'm the Quran teacher of*, not *every student in a class I happen to
be assigned to for an unrelated subject*. (A) is documented here because the
task asked whether a class/section-based relationship exists — it does, but
it answers a different question than this dashboard needs.

### Existing Guardian → Student relationship(s) — **also two, one legacy-primary-only**

- **Legacy (`students.guardian_id`, `hasMany`):** `Guardian::students()`. This
  column is `NOT NULL` on every student row — always populated — but only
  ever holds **one** guardian: `StudentController::store()` sets it to
  `$validated['guardians'][0]['guardian_id']`, i.e. whichever guardian is
  first in the submitted list (commented in the code as "legacy... for
  backward compatibility").
- **Current (`guardian_student` pivot, `belongsToMany`):** `Guardian::studentsMany()`
  / `Student::guardians()`, with pivot columns `relationship`, `is_primary`,
  `can_receive_invoices`, `can_pickup`, `emergency_contact`. `StudentController::store()`
  and `::update()` sync **all** submitted guardians into this pivot
  (`$student->guardians()->sync($guardianData)`) — this is the actively
  maintained, multi-guardian-capable relationship, and student
  create/edit already supports assigning more than one guardian to a child.

**The Quran module currently only uses the legacy relation.** Both
`GuardianQuranHomeworkController::index()` (`$guardian->students()`) and
`QuranHomeworkController::studentReport()`'s guardian-ownership check
(`$guardian->students()->where('students.id', $student->id)->exists()`) go
through the legacy hasMany, not the pivot. **This means: a guardian who is a
student's second/non-primary guardian (added via the pivot only, not as
`guardians[0]` at creation) already gets nothing in the existing Quran
guardian screens today** — not wrong data, just silently empty, because the
query never looks at `guardian_student` at all. Any new Guardian-scoped
dashboard cards built the same way inherit this exact gap. See §5.

(In this environment `guardian_student` currently has 0 rows, so the gap is
latent, not currently visibly wrong — but the multi-guardian create/edit UI
is live and will populate it as soon as a second guardian is added to any
student.)

### What the Quran Policies already encode

| Policy | `school_id` isolation | Role-scoping beyond school |
|---|---|---|
| `QuranHomeworkPolicy` | ✅ `view/update/delete` all check `school_id` match | ❌ `view()` only checks role ∈ {admin, teacher, guardian} — **no ownership check at all**, so any teacher/guardian at the school can view any homework record in that school via direct URL, regardless of whose student or whose class it is |
| `QuranSchedulePolicy` | ✅ | ✅ Teacher scoped to `teacher_id === $user->id` (relationship B above); guardian/admin unscoped beyond role+school |
| `QuranHomePracticePolicy` | ✅ | ✅ Guardian scoped to `guardian_id === $user->guardian->id` (own logs only); admin/teacher unscoped beyond role+school |

**Takeaway:** the Policies handle `school_id` isolation consistently, and two
of the three encode *some* ownership scoping, but `QuranHomeworkPolicy::view()`
does not scope guardians to their own children at all — a gap that already
exists independent of the dashboard, worth a one-line mention to the user even
though it's outside this audit's direct ask (the dashboard doesn't call this
policy directly, but it shows the ownership-scoping pattern is inconsistently
applied module-wide, not something this dashboard work would be introducing
fresh).

---

## 2. Current dashboard's scoping gap — confirmed

`app/Http/Controllers/QuranController.php::index()` builds `$stats` from:

```php
QuranSchedule::where('start_date', '<=', now())->where(...)->count()   // activeSchedules
QuranHomework::distinct('student_id')->count('student_id')             // studentsTracked
QuranHomework::pending()->count()                                       // pendingHomework
QuranHomework::where(...)->groupBy('student_id')->orderByDesc(...)      // topPerformer
```

Every one of these queries is scoped **only** by the `BelongsToSchool` global
scope (implicit `school_id` filter from the authenticated user) — there is no
`$user->role` branch, no `teacher_id` filter, no guardian filter anywhere in
this method. Confirmed by reading the full controller: `$user = $request->user();`
is assigned but never referenced again except to pass to `Inertia::render`
indirectly via auth-shared props — it plays no role in any of the four stat
queries. Every admin, teacher, and guardian at a school sees the identical
school-wide numbers. This matches the reported symptom exactly.

---

## 3. Proposed Teacher cards

All scoped via relationship **(B)** — `teacher_id` on `QuranSchedule` /
`QuranHomework` matching `$user->id` — for the reasons in §1.

| Card | Shows | Query | Data reliability |
|---|---|---|---|
| **My Active Schedules** | Count of this teacher's own `QuranSchedule` rows where today falls in `[start_date, end_date]` (same date-range logic as the current school-wide card) | `QuranSchedule::where('teacher_id', $user->id)->where('start_date', '<=', now())->where(fn ⇒ null-or-future end_date)->count()` | ✅ `teacher_id` always populated (100% in this DB); reliable |
| **My Students** | Distinct student count across this teacher's own Homework/Schedule records | `QuranHomework::where('teacher_id', $user->id)->distinct('student_id')->count('student_id')` | ✅ same reliability as above |
| **My Pending Homework** | Count of this teacher's own `QuranHomework` rows with `status = 'pending'` (awaiting grading) | `QuranHomework::where('teacher_id', $user->id)->pending()->count()` | ✅ `scopePending()` already exists on the model |
| **My Top Student** (optional — same shape as school-wide "Top Performer," teacher-scoped) | Highest completed-Juz student among *this teacher's own* graded, new-learning homework | Same query as current `topPerformer`, with `where('teacher_id', $user->id)` added | ✅ reliable, though with very few records per teacher this card may read as noise more than signal — see note below |

**Note on "My Top Student":** the school-wide version makes sense because
there's a meaningful pool of students to rank. Per-teacher, once scoped, the
"pool" could be a handful of students — a "Top Student" card comparing 2-3
kids reads oddly. Worth deciding whether to keep it, drop it, or replace it
with something like **"Recent Activity"** (a small list of the teacher's most
recently graded/assigned homework) instead — flagging this as a judgment
call for you, not a data-availability problem.

**Not proposed:** anything keyed off relationship **(A)** (`grade_teacher`
pivot). It's real and populated, but conflates "generic class assignment"
with "Quran teaching," which would misrepresent teachers who are assigned to
a grade for an unrelated subject and have never touched Quran homework for
that grade — the opposite of the "wrong data" problem this whole audit exists
to fix.

---

## 4. Proposed Guardian cards

All scoped via `$user->guardian->students()` (the **legacy** relation) — see
the caveat in §5 before treating this as final.

| Card | Shows | Query | Data reliability |
|---|---|---|---|
| **My Children Tracked** | Count of this guardian's own children who have ≥1 Quran homework record (mirrors `GuardianQuranHomeworkController`'s existing filter) | `$guardian->students()->whereHas('quranHomework')->count()` | ✅ reliable, same pattern already shipping |
| **Pending Homework (mine)** | Count of pending `QuranHomework` rows belonging to this guardian's children | `QuranHomework::whereIn('student_id', $guardian->students()->pluck('id'))->pending()->count()` | ✅ reliable |
| **Recent Progress** | Per-child: latest homework entry's status/date/surah (already computed shape — reuse `GuardianQuranHomeworkController`'s `latest_tracking` block rather than inventing a new one) | Same as existing `GuardianQuranHomeworkController::index()` logic, condensed to a dashboard-card size | ✅ reliable — this is already-shipping, tested logic, not new |
| **Active Schedule(s)** | This guardian's children's own active `QuranSchedule` (start/end dates, progress %) — mirrors the "Active Schedules" school-wide card but scoped to their kids | `QuranSchedule::whereIn('student_id', $guardian->students()->pluck('id'))->active-date-range` | ✅ reliable |

**Not proposed:** a "Top Performer" analog for guardians — with typically
1-3 children per guardian, "ranking your own kids against each other" is not
a useful or kind framing for a parent-facing dashboard. If a guardian has
one child, this pattern doesn't even mean anything.

---

## 5. Gaps and risks flagged

### Gap — Guardian scoping via legacy relation misses non-primary guardians (Moderate, latent)

Covered in §1. `guardian->students()` only returns students where this
guardian was **first in the list at creation time**. A second/non-primary
guardian (real, supported feature — `guardian_student` pivot with
`is_primary`/`can_pickup`/etc., actively written by `StudentController`)
would see **zero** cards, not wrong ones, silently. This is not a new problem
this dashboard would introduce — it's the same gap already present in
`GuardianQuranHomeworkController` and `studentReport()` — but building the
dashboard the same way perpetuates it rather than fixing it. Options, for
your call:
1. Match existing behavior (`guardian->students()`) for consistency — ships
   fastest, but perpetuates a known gap.
2. Use `guardian->studentsMany()` (the pivot) instead — more correct
   long-term, but is a behavior change from every other guardian-facing Quran
   screen today, and would be worth doing everywhere at once rather than just
   on the dashboard, to avoid the module being inconsistent with itself.
3. Do both (`students()->pluck('id')->merge(studentsMany()->pluck('id'))->unique()`)
   — matches the pattern `Guardian::deactivate()` already uses to be safe
   against exactly this split (see `Guardian.php:52-56` — it explicitly
   merges "both relationship paths to avoid missing students linked only via
   the legacy guardian_id column vs. the pivot table"). This is precedent
   *in this same model* for treating the split as a real risk worth
   defending against, not a theoretical one.

### Gap — "Teacher's students" is ambiguous between two real relationships (Moderate)

Covered in §1/§3. Not a missing relationship — a *choice* between two
existing ones that answer different questions. Recommending (B) for the
reasons given, but flagging explicitly per your instructions since picking
wrong would mean cards technically work but show teachers a set of
students/records that doesn't match their actual Quran teaching load.

### Gap — `teacher_id` records the creator, not necessarily a real teacher (Minor)

Covered in §1. If an admin ever creates a Schedule/Homework "for" a teacher
(both Policies' `create()` allow admin), `teacher_id` is the admin's own user
id. That teacher's own dashboard would then under-count — records genuinely
theirs by assignment wouldn't show as theirs by `teacher_id`. Whether this
matters depends on whether admins actually do this in practice at your
schools; flagging as a possibility, not a confirmed occurrence (this DB's
only QuranSchedule/QuranHomework rows were created by a teacher, so no direct
evidence either way here).

### Tenant-isolation risk check — none found in the proposed queries, one pattern to watch for

All four proposed Teacher cards and four proposed Guardian cards filter by
`teacher_id`/`student_id` values sourced from `$user->id` or
`$user->guardian->students()` — both of which are already transitively
`school_id`-scoped (a `teacher_id`/`student_id` value can only ever belong to
users/students in that same school, since `Guardian`, `Student`, `Teacher`
all use `BelongsToSchool` and `$user` is the authenticated user's own row).
Combined with `QuranSchedule`/`QuranHomework`'s own `BelongsToSchool` global
scope, cross-school leakage isn't reachable through any of these queries as
proposed.

**The one pattern to actively avoid when implementing:** don't filter by
`student_id`/`teacher_id` alone if a query ever bypasses Eloquent's global
scope (e.g. a raw `DB::table('quran_homework')` query, or
`withoutGlobalScopes()` anywhere near this code, both of which exist
elsewhere in the codebase for legitimate reasons — see `Guardian::deactivate()`
and the migration-data-preservation test written earlier in this session). A
raw query filtered only by `teacher_id = $user->id` is still safe *in
practice* today because `teacher_id` values don't collide across schools
(they're real `users.id` values, globally unique) — but it would be a latent
foot-gun for a future refactor that reuses a query builder pattern
copy-pasted without its origin's implicit school scope. Recommend keeping
every new query as a plain Eloquent `QuranSchedule::`/`QuranHomework::` call
(inherits `BelongsToSchool` automatically) rather than raw `DB::table()`, for
this reason alone.

---

## Summary for your decision

- **Teacher cards:** recommend scoping via `teacher_id` (relationship B), not
  the `grade_teacher` assignment (relationship A). Proposed: My Active
  Schedules, My Students, My Pending Homework, and either My Top Student or a
  Recent Activity list (your call — noted as genuinely undecided above).
- **Guardian cards:** recommend My Children Tracked, Pending Homework (mine),
  Recent Progress, Active Schedule(s) — but first decide how to handle the
  legacy-vs-pivot guardian relationship split (§5, three options given,
  recommend option 3 — merge both, matching `Guardian::deactivate()`'s own
  existing precedent for this exact problem).
- No cross-school leakage risk found in any proposed query, provided
  everything stays plain Eloquent (no raw `DB::table()`/`withoutGlobalScopes()`).

Awaiting your go-ahead on which cards to build and which option to take on
the guardian-relationship gap before writing any code.
