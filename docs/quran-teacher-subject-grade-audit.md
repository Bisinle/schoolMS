# Teacher × Subject × Grade Audit — Does "Teacher X Teaches Quran to Grade Y" Exist as Data?

**Status:** Audit only — no code changed. For go-ahead review before any implementation.
**Scope:** Resolves the specific gap left open by
[`docs/quran-dashboard-role-scoping-audit.md`](./quran-dashboard-role-scoping-audit.md)
(hereafter "the prior audit"): whether the schema can answer "who teaches
Quran, specifically, to Grade 2, specifically" — as opposed to the broader
"which grades is this teacher assigned to" relationship (A) that audit
documented. Read that document first; this one does not repeat its findings
on Guardian↔Student relationships or the Quran Policies table.

**Worktree:** `.worktrees/restructure-quran-module` (branch
`restructure/quran-module`). All findings from static code/migration
inspection — no live DB was reachable in this environment (`.env` points at
`127.0.0.1:3306`, MySQL not running), so row counts below note "schema
confirmed, live population unconfirmed" wherever that applies.

---

## 1. Subject-to-grade: the `grade_subject` pivot

**Confirmed and fully wired end-to-end.** `Grade::subjects()` / `Subject::grades()`
is a `belongsToMany` through pivot table `grade_subject`
(`app/Models/Grade.php:55-60`, `app/Models/Subject.php:37-42`).

**Columns** (built across 3 migrations):

| Column | Source migration |
|---|---|
| `id`, `grade_id` (FK→grades), `subject_id` (FK→subjects) | `2025_10_30_151446_create_grade_subject_table.php` |
| `sessions_per_week` (int, default 4) | `2025_12_25_110122_add_sessions_per_week_to_grade_subject_table.php` |
| `priority` (enum: high/neutral/low, default neutral), `must_be_daily` (bool), `can_repeat_same_day` (bool) | `2025_12_31_000003_add_priority_fields_to_grade_subject_table.php` |
| `created_at`, `updated_at` | base migration |

Unique constraint on `(grade_id, subject_id)`. **No `school_id` column on the
pivot itself** — isolation is implicit via both FKs pointing at
`BelongsToSchool`-scoped tables.

**Populated by:** `GradeController::store()` (`attach`, line 166-168),
`::update()` (`sync`, line 316-320), a per-school curriculum editor
(`GradeController::manageCurriculum`/`updateCurriculum`, lines 487-526,
routes at `routes/web.php:129-130`) that edits the extra pivot columns, and
`SubjectSeeder.php:79-91` which attaches every subject to every grade per
school at seed time. `Grade::isSubjectAllowed()` (`Grade.php:400-403`) reads
this pivot and backs `App\Rules\SubjectAssignedToGrade`, used to validate
timetable slot subject choices against grade curriculum.

**Flagged gap (adjacent, not this audit's core question):**
`GradeController::store()`/`::update()` validate `subject_ids.*` with a raw
`exists:subjects,id` rule (lines 130-131, 286-287) — this does **not** go
through Eloquent's `SchoolScope`, so nothing in the validation layer itself
stops a `subject_id` belonging to a different school from being attached.
In practice the picker UI only ever offers same-school subjects, so this is
latent rather than observed, but it's a school-id isolation gap worth a
separate look given this repo's non-negotiable isolation rule.

**Verdict:** Grade↔Subject is a real, populated, well-formed many-to-many —
not in question for your dashboard-scoping decision.

---

## 2. Teacher-to-grade: the `grade_teacher` pivot, in full

The prior audit named this pivot (relationship A) and its `is_class_teacher`
flag but didn't enumerate every column. Full picture:

**Migration** (`database/migrations/2025_10_29_154259_create_grade_teacher_table.php`
— the only migration that ever touches this table):

```php
Schema::create('grade_teacher', function (Blueprint $table) {
    $table->id();
    $table->foreignId('grade_id')->constrained()->onDelete('cascade');
    $table->foreignId('teacher_id')->constrained()->onDelete('cascade');
    $table->boolean('is_class_teacher')->default(false);
    $table->timestamps();
    $table->unique(['grade_id', 'teacher_id']);
});
```

**Full column list:** `id`, `grade_id`, `teacher_id`, `is_class_teacher`,
`created_at`, `updated_at`. That's it — **no subject column, no status/active
flag, no ordering column.** Unique on `(grade_id, teacher_id)`: a teacher can
appear at most once per grade, full stop — the schema has no room to record
"this teacher teaches Math to Grade 2 AND Quran to Grade 2 as two separate
facts" even if you wanted to bolt a subject column on without redesigning the
uniqueness constraint.

**Eloquent relationships:**
- `Teacher::grades()` (`Teacher.php:43-48`) — `belongsToMany(Grade::class, 'grade_teacher')->withPivot('is_class_teacher')`
- `Teacher::assignedGrades()` / `::classTeacherGrades()` (`Teacher.php:59-67`) — split on the pivot flag
- `Grade::teachers()` (`Grade.php:48-53`) — inverse, same `withPivot('is_class_teacher')`
- `Grade::getClassTeacher()` (`Grade.php:101-104`) — first teacher where flag is true

**Every write site** (all in `TeacherController.php` and `GradeController.php`
— `store`, `update`, `assignTeacher`, `removeTeacher`,
`updateTeacherAssignment`, `destroy`) only ever sets `is_class_teacher`. None
of the request validation on any of these endpoints includes a subject field
for the grade-teacher assignment itself.

**Verdict, explicit:** `grade_teacher` **DOES NOT** have a subject dimension.
This confirms and hardens the prior audit's framing of relationship (A) as
"generic class assignment," now with full schema evidence.

---

## 3. Does a teacher+grade+subject three-way relationship exist anywhere?

This is the core question. Short answer: **not as a single table/pivot with
three FK columns — but a real one exists as a two-table join, and there's
dead code showing this was previously handled a different way.**

### 3a. Two-way teacher↔subject relationships (no grade) — there are *two* of these

1. **`teacher_subject` pivot** — `Teacher::subjects()` (`Teacher.php:53-57`),
   `belongsToMany(Subject::class, 'teacher_subject')`. Migration:
   `2026_01_03_140445_create_teacher_subject_table.php` — columns `id,
   teacher_id, subject_id, timestamps`, unique `(teacher_id, subject_id)`.
   Exposed in the admin UI as **"Subject Specializations"** (multi-select) on
   `resources/js/Pages/Teachers/{Create,Edit}.jsx`. Populated via
   `TeacherController.php:115,157,216` (`sync()`).

2. **`teachers.subject_id`** — a *second*, independent, single-valued FK.
   `Teacher::subject()` (`Teacher.php:38-41`), `belongsTo(Subject::class)`.
   Added by `2026_01_02_195715_change_subject_specialization_to_subject_id_in_teachers_table.php`,
   replacing an older free-text `subject_specialization` string column.
   Labeled **"Primary Subject (for reference)"** in the same Teacher
   forms — explicitly informational per its own UI copy.

Neither carries a grade. A teacher can have a "Subject Specializations" set
that includes Quran (via #1) and/or a "Primary Subject" of Quran (via #2)
with zero connection to which grade(s) they teach it in.

### 3b. The only real three-way link: `timetable_slots` + `timetable_templates`

`timetable_slots` has **both** `teacher_id` and `subject_id` as columns on
the same row (migration `2025_12_24_000004_create_timetable_slots_table.php`,
plus later ALTERs — verified no migration ever added `grade_id` directly to
this table). Grade comes in one hop up: `timetable_templates.grade_id`
(`2025_12_24_000001_create_timetable_templates_table.php:23`,
`TimetableTemplate::grade()` at `TimetableTemplate.php:40-43`), and
`timetable_slots.timetable_template_id` FKs into it.

So the query **is** expressible today:

```php
TimetableSlot::whereHas('template', fn ($q) => $q->where('grade_id', $gradeId))
    ->where('subject_id', $quranSubjectId)
    ->pluck('teacher_id');
```

This answers "who is scheduled to teach Quran to Grade 2 this timetable
cycle" — a real, schema-enforced fact, populated whenever a timetable exists
for that grade. It is **not** a stable "assignment" record though — it's
schedule data: it reflects what's on the current timetable, can be
regenerated/edited/deleted by admins, and answers "is scheduled to teach,"
not necessarily "is the assigned/qualified Quran teacher" in a durable sense
independent of whether a timetable happens to exist.

### 3c. Dead code that shows the intended design

`app/Services/TimetableGenerationService.php:336-372` — the **active**
`assignTeachers()` logic just assigns the grade's single class teacher
(`$this->grade->getClassTeacher()`) to every slot regardless of subject,
with an inline comment: *"Admins can manually change to specialist teachers
after generation."* Immediately below it, **commented out** (lines 356-370):

```php
// $this->grade->teachers()->whereHas('subjects', fn ($q) =>
//     $q->where('subjects.id', $slot->subject_id)
// )->get()
```

This is exactly the intersection your question is asking about — teachers
assigned to this grade (`grade_teacher`) AND specializing in this subject
(`teacher_subject`) — and it used to run, but is currently disabled in favor
of "just use the class teacher for everything." This is strong evidence the
system's own prior design intended `grade_teacher ∩ teacher_subject` as the
answer to "who can teach subject X to grade Y," but that logic isn't live
anywhere right now.

### 3d. What doesn't exist

No table/model named `teacher_subject_grade`, `subject_teacher`,
`grade_subject_teacher`, or similar — confirmed by listing every migration
touching `teacher`/`subject`/`grade` and by case-insensitive grep of `app/`
and `database/` for `teacher_subject`/`subject_teacher` as literal strings.
No `TeacherSubject*`-named controller exists.

### Verdict

| Question | Answer |
|---|---|
| Single pivot with teacher+grade+subject on one row? | **No.** |
| Real three-way fact obtainable at all? | **Yes** — via `timetable_slots` (has teacher_id+subject_id) joined to `timetable_templates.grade_id`. Reflects *scheduled* teaching, not a durable assignment. |
| Plain teacher↔subject (no grade)? | **Yes, two of them** — `teacher_subject` pivot ("Subject Specializations") and `teachers.subject_id` ("Primary Subject", explicitly informational). |
| Any live code currently computing grade+subject→teacher by intersecting `grade_teacher`+`teacher_subject`? | **No** — that logic exists but is commented out (`TimetableGenerationService.php:356-370`). |

---

## 4. Is teacher-to-subject assignment enforced anywhere, or purely descriptive?

**Direct answer: not enforced anywhere.** Grepped `app/Http/Controllers`,
`app/Policies`, `app/Http/Middleware` for every use of "subject" touching a
teacher's own subject relation:

- `app/Http/Middleware`: **zero hits** for "subject" of any kind.
- `app/Policies`: only `SubjectPolicy` — governs CRUD on the `Subject`
  entity itself (can an admin/teacher create/edit/delete a Subject record),
  not "does this teacher teach this subject." Not a gate.
- `app/Http/Controllers`: the only hits touching a *teacher's own* subjects
  relation are `TeacherController.php:115,157,216` (admin CRUD — syncing the
  "Subject Specializations" multi-select) and
  `TimetableTemplateController.php:317-334` (builds a display array of a
  teacher's subjects purely to populate timetable-builder dropdowns for an
  admin). Both are descriptive/administrative data, not access checks. The
  actual enforcement in the timetabling module (`App\Rules\SubjectAssignedToGrade`,
  used in `TimetableSlotController.php:203`) validates subject↔**grade**
  compatibility, not teacher↔subject.

**So: if you removed "Quran" from a teacher's Subject Specializations today,
nothing in the current codebase would change.** No controller, policy,
middleware, or UI check reads `Teacher::subjects()` (or `teachers.subject_id`)
before deciding what a teacher can see or do in the Quran module, or
anywhere else. It is pure descriptive/reference data.

### Does a teacher assigned to a grade but NOT assigned Quran as a subject see Quran homework/schedules for that grade anyway? **Yes — and the access path is broader than even that.**

Traced the actual chain a teacher takes to reach Quran features:

1. **Nav visibility** (`resources/js/Config/navigation.js:61-71,123-133`):
   Quran submenu shown to `admin`/`teacher`/`guardian` roles gated **only**
   by `isMadrasah` (see §5) — no subject or grade check in the nav config.
2. **Route middleware** (`routes/web.php:433-483`): `auth` → `school.admin`
   → `school.active` → `madrasah.only` → `role:admin,teacher[,guardian]`.
   No grade or subject middleware anywhere in this stack.
3. **Read path** — `QuranHomeworkController::studentsForUser()`
   (`app/Http/Controllers/QuranHomeworkController.php:493-512`), used by
   both `index()` and `create()`: for a teacher, builds the student list from
   `$user->teacher->grades->pluck('id')` — i.e. plain `grade_teacher`
   membership, the grade-only relationship from §2, zero subject filter. **A
   teacher assigned to Grade 2 for Mathematics sees the same Grade 2 student
   list for Quran homework as a teacher actually assigned to Grade 2 for
   Quran** — the two are indistinguishable to this query, because the data
   to distinguish them (§3) isn't consulted.
4. **Write path — worse than the read path.** This goes beyond what was
   asked but is directly relevant and worth flagging clearly:
   - `QuranHomeworkController::store()` (line 67-79) authorizes via
     `QuranHomeworkPolicy::create()` (bare role check, no grade/subject
     condition — `app/Policies/QuranHomeworkPolicy.php:28-31`), then
     validates `student_id` only with `Rule::exists('students','id')->where('school_id', ...)`.
     **No grade check at all on write** — the `grade_teacher` scoping in
     step 3 is a client-side dropdown convenience only, not a server-side
     boundary. A teacher can POST a `student_id` for a student in a grade
     they aren't even assigned to (same school) and it's accepted.
   - `QuranScheduleController::create()`/`index()` (lines 43,55-63) build
     their student list from `Student::where('school_id', $user->school_id)->get()`
     — the **entire school's roster**, not even filtered by `grade_teacher`.
     `store()` (68-95) authorizes via `QuranSchedulePolicy::create()` (again
     a bare role check) and validates `student_id` only against
     `QuranSchedule::validationRules()` (`school_id` exists-check only,
     `QuranSchedule.php:226-238`). **A teacher can currently create a Quran
     schedule for any student in the school, in any grade, regardless of
     which teacher (if anyone) is actually assigned to that grade.**

   `QuranController` (the dashboard) is the one place that correctly
   self-scopes — teacher stat cards filter by `teacher_id` on records the
   teacher already created (lines 156-166, matching relationship B from the
   prior audit) — but that's an ownership filter on existing records, not a
   gate on what a teacher is allowed to create in the first place.

**This means the grade-scoping the prior audit described (relationship A,
`grade_teacher`) is itself only enforced as a UI convenience on two of the
four Quran write endpoints, and not at all on the other two.** Any
teacher-scoped access-control work should treat this as a prerequisite gap,
independent of the subject question — restricting by subject on top of a
grade check that doesn't currently exist server-side would still leave the
underlying write paths open.

---

## 5. Current Quran module gating (school level)

Confirms and fully sources what the prior audit summarized as "a
school-level Madrasah school flag."

- **Middleware:** `App\Http\Middleware\CheckMadrasahSchool`
  (`app/Http/Middleware/CheckMadrasahSchool.php:18-44`). Logic: not
  authenticated → redirect to login; super admin → `abort(404)`; no
  `school_id` → `abort(404)`; school not found or
  `school->school_type !== 'madrasah'` → `abort(404)`; else pass through.
- **Source field:** `schools.school_type`, `enum('islamic_school',
  'madrasah')`, default `islamic_school`
  (`database/migrations/2025_11_22_100000_add_school_type_to_schools_table.php:15-17`),
  plain fillable column on `School` — no accessor/cast, fetched fresh via
  `School::find()` on every request (not cached).
- **Registered as:** a named middleware alias in `bootstrap/app.php:19-38`
  (Laravel 12 has no `Kernel.php`), applied per-route-group (not global) —
  used at exactly two places in `routes/web.php`: line 184 (guardian's
  read-only `/guardian/quran-homework`) and lines 433-483 (the entire
  admin/teacher/guardian Quran module block).
- **Set/edited:** only by Super Admins, via
  `SuperAdmin\SchoolController::store()`/`::update()`
  (`app/Http/Controllers/SuperAdmin/SchoolController.php:74,110,210`), no
  self-service toggle exists for school admins.
- **Frontend:** `resources/js/Layouts/AuthenticatedLayout.jsx:14,31-32`
  reads the shared Inertia `school` prop (populated in
  `HandleInertiaRequests.php:38-52`, explicitly excluded for super admins)
  and computes `isMadrasah = school?.school_type === "madrasah"`, passed
  into `getNavigation()` which injects the Quran submenu into the
  `admin`/`teacher`/`guardian` nav arrays only when true.

**Verdict:** purely an all-or-nothing per-school switch. Within a madrasah
school, the only further variation is the pre-existing `role:` route
middleware (admin/teacher get the full CRUD screens, guardian gets a
narrower read-only view) — no per-teacher, per-subject, or per-grade
conditional exists at this layer, consistent with §4's finding that nothing
downstream adds subject-level filtering either.

---

## 6. Conclusion

**The data model does not currently support "teacher X teaches Quran to
grade Y" as a single, durable, queryable fact — and none of the pieces that
exist are actively used to compute it anywhere in the running application.**
What exists instead is four separate, independently-maintained relationships
— grade↔teacher (`grade_teacher`, §2), teacher↔subject in two forms
(`teacher_subject` pivot and `teachers.subject_id`, §3a), and a two-hop
"who's scheduled" answer through `timetable_slots` → `timetable_templates.grade_id`
(§3b) that reflects the current timetable rather than a stable assignment
and would go silent for any grade without a generated timetable. The
system's own prior code (§3c) shows the intended fix was to intersect
`grade_teacher` and `teacher_subject`, but that logic is currently dead. On
top of that, §4 found the *existing* grade-level scoping (`grade_teacher`)
isn't even enforced server-side on Quran homework/schedule creation today —
so building subject-scoped access control on the current foundation would be
layering a new filter on top of write paths that don't yet enforce the
filters that already exist.

**If you want "teacher X teaches Quran to grade Y" as a queryable,
enforceable fact, new schema is needed.** Minimal shape, for you to decide
between (not proposed in detail per your instructions):

- **Option A — extend `grade_teacher` with a `subject_id` column.**
  Requires relaxing its current `unique(grade_id, teacher_id)` constraint to
  `unique(grade_id, teacher_id, subject_id)` (a teacher can currently only
  appear once per grade at all — that invariant would need to change to let
  one teacher teach two subjects to the same grade, or to let two different
  teachers each own one subject for the same grade).
- **Option B — a new `teacher_subject_grade` pivot** (`teacher_id`,
  `subject_id`, `grade_id`, own timestamps, unique on the triple), left
  alongside the existing `grade_teacher` and `teacher_subject` pivots rather
  than modifying either.

Both are schema-level decisions with knock-on effects on `TeacherController`,
`GradeController`, the Teacher admin forms, and potentially
`TimetableGenerationService`'s dead intersection logic (§3c) if it's ever
revived — worth deciding deliberately rather than as a side effect of the
Quran dashboard work, since whichever shape you pick would likely become the
answer for other subject-scoped features too, not just Quran.

---

## Cross-reference to the prior audit

- Prior audit's relationship (A) = `grade_teacher`, confirmed here in full
  (§2) — including that it structurally cannot carry a subject today.
- Prior audit's relationship (B) (`teacher_id` on `QuranSchedule`/`QuranHomework`)
  is unaffected by this audit's findings — it remains the recommended basis
  for teacher-scoped dashboard cards, as it already reflects "records this
  specific person created," independent of the grade/subject-assignment
  questions resolved here.
- The prior audit noted (A) "conflates generic class assignment with Quran
  teaching" and recommended not building dashboard cards on it. This audit
  confirms that recommendation was correct and goes further: even using (A)
  for *access control* (not just dashboard display) would be unsound today,
  both because it carries no subject dimension (§2, §3) and because it isn't
  actually enforced server-side on the endpoints that matter (§4).
