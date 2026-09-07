# Teacher/Guardian Login-Access Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `users.is_active` the single, authoritative "can this person log in" signal for teachers and guardians — displayed consistently everywhere — while keeping the guardian→student deactivation cascade intact but explicitly decoupled from login access.

**Architecture:** `users.is_active` is already the only field `LoginRequest`/`RoleMiddleware` check at login/session time, and it's already toggled from exactly one place (`SuperAdmin\UserController`/school-level `UserController` via `UserManagementService`). That part is not broken and needs no change. What's broken is *display*: `Teachers/*.jsx` and `Guardians/*.jsx` render `teacher.status`/`guardian.status` — two fields nothing else in the app treats as a login gate — so admins see a badge that doesn't reflect whether the person can actually log in. Fix: Teacher pages stop reading `teacher.status` entirely and read `teacher.user.is_active` instead (verified via full-codebase grep that nothing else — no timetable, grade-assignment, or scheduling code — reads `teachers.status` as a gate; `Grade::getAllowedTeachers()` already independently filters on `user.is_active`). Guardian pages keep `guardian.status` exactly as-is (it drives a real, separate cascade to `Student.status` and must keep doing so) but relabel it as an enrollment/family concept, and gain a second, independent "Portal Access" indicator sourced from `guardian.user.is_active`, so the two concepts are visible side by side instead of conflated into one ambiguous badge.

**Tech Stack:** Laravel 12 (Pest tests), Inertia.js + React 18.

**Spec:** This plan's spec is the design established in-conversation (see plan body below for the two options that were weighed and the chosen resolution) — there is no separate spec doc; the "Global Constraints" section below carries the load-bearing decisions.

## Global Constraints

- `users.is_active` remains the only field checked at login (`app/Http/Requests/Auth/LoginRequest.php`) and per-request (`app/Http/Middleware/RoleMiddleware.php`) — do not add `teachers.status`/`guardians.status` checks to either.
- `users.is_active` remains toggleable only from the Users index page (`UserManagementService::updateUser()`) — do not add a second `is_active`-toggling code path.
- `Guardian::deactivate()`/`reactivate()` keep cascading to `Student.status` exactly as today (`app/Models/Guardian.php:39-70`) — this plan does not touch that method's logic, only its UI framing.
- `teachers.status` column is **not** dropped or migrated in this plan — it becomes vestigial (unread, unwritten) rather than removed, to minimize schema-change risk. A future plan can drop it once confirmed nothing else was relying on it.
- No changes to `UserManagementService`, `LoginRequest`, or `RoleMiddleware` — they already implement the target behavior correctly.

---

## Task 1: Teacher pages read `user.is_active`, not `teacher.status`

**Files:**
- Modify: `app/Http/Controllers/TeacherController.php:85` (store validation), `:117` (store create), `:199` (update validation), `:222` (update apply)
- Modify: `resources/js/Pages/Teachers/Index.jsx:50` (mobile badge), `:363` (desktop badge)
- Modify: `resources/js/Pages/Teachers/Show.jsx:48-54` (header badge)
- Modify: `resources/js/Pages/Teachers/Edit.jsx:25` (form state), `:171-180` (status field)
- Test: `tests/Feature/TeacherStatusDisplayTest.php`

**Interfaces:**
- Consumes: `teacher.user.is_active` (boolean, already present on every Inertia `teacher` prop today — `User::$hidden` only hides `password`/`remember_token`, and every controller action already eager-loads `user`, so no controller prop changes are needed to expose it).
- Produces: nothing consumed by later tasks — Task 1 and Task 2 are independent.

- [ ] **Step 1: Write the failing test asserting the Teacher show/index pages no longer depend on `teachers.status` for their data contract**

```php
<?php

use App\Models\Grade;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;

test('teacher update request is rejected if it tries to send a status field alongside valid data, without error, because status is no longer validated', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = Subject::factory()->create(['school_id' => $admin->school_id]);
    $teacherUser = User::factory()->create(['role' => 'teacher', 'school_id' => $admin->school_id, 'is_active' => true]);
    $teacher = Teacher::factory()->create([
        'user_id' => $teacherUser->id,
        'school_id' => $admin->school_id,
        'subject_id' => $subject->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($admin)->put("/teachers/{$teacher->id}", [
        'name' => $teacherUser->name,
        'email' => $teacherUser->email,
        'phone_number' => '0700000000',
        'subject_id' => $subject->id,
        'subject_ids' => [$subject->id],
        'status' => 'inactive', // legacy field — must be silently ignored, not required
    ]);

    $response->assertRedirect('/teachers');
    // teachers.status is untouched by update() now — still whatever it was seeded as
    expect($teacher->fresh()->status)->toBe('active');
    // the field that actually gates login is untouched by this endpoint
    expect($teacherUser->fresh()->is_active)->toBeTrue();
});

test('deactivating a teacher via the Users page is what the teacher record now reflects on display, not teachers.status', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $subject = Subject::factory()->create(['school_id' => $admin->school_id]);
    $teacherUser = User::factory()->create(['role' => 'teacher', 'school_id' => $admin->school_id, 'is_active' => true]);
    $teacher = Teacher::factory()->create([
        'user_id' => $teacherUser->id,
        'school_id' => $admin->school_id,
        'subject_id' => $subject->id,
        'status' => 'active', // deliberately stale/wrong to prove display no longer reads this
    ]);

    $this->actingAs($admin)->post("/users/{$teacherUser->id}/toggle-active")
        ?? $this->actingAs($admin)->patch("/users/{$teacherUser->id}/toggle-active");

    $response = $this->actingAs($admin)->get("/teachers/{$teacher->id}");

    $response->assertInertia(fn ($page) => $page
        ->component('Teachers/Show')
        ->where('teacher.user.is_active', false)
    );
});
```

- [ ] **Step 2: Run the tests to verify they fail (or reveal the real toggle route)**

Run: `php artisan test --filter=TeacherStatusDisplayTest`

Expected: the first test currently FAILS because `TeacherController::update()` still requires/writes `status`; the second test's toggle route needs confirming first — run `php artisan route:list --name=users.toggle-active` to get the exact HTTP verb (`app/Http/Controllers/UserController.php` toggle action, routed in `routes/web.php`) and fix the test's HTTP verb accordingly before treating a failure here as real signal.

- [ ] **Step 3: Remove `status` from `TeacherController::store()` and `update()`**

In `app/Http/Controllers/TeacherController.php`, delete the line `'status' => 'required|in:active,inactive',` from both validation blocks (currently line 85 in `store()`, line 199 in `update()`), and delete the line `'status' => $validated['status'],` from both the `Teacher::create()` call (currently line 117) and the `$teacher->update()` call (currently line 222). The `teachers.status` column keeps its DB default (`'active'`, per `database/migrations/2025_10_29_134249_create_teachers_table.php:20`) for any new row — it is no longer read or written by this controller.

- [ ] **Step 4: Update `Teachers/Edit.jsx` to drop the Status field**

In `resources/js/Pages/Teachers/Edit.jsx`, remove `status: teacher.status || 'active',` from the `useForm()` initializer (line 25), and remove the entire `<SelectInput label="Status" ... />` block (lines 171-180).

- [ ] **Step 5: Update `Teachers/Index.jsx` badges to read `teacher.user.is_active`**

Replace (mobile item, ~line 48-54):
```jsx
<Badge
    variant="status"
    value={teacher.status}
    size="sm"
    className="flex-shrink-0 ml-2"
/>
```
with:
```jsx
<Badge
    variant="status"
    value={teacher.user?.is_active ? 'active' : 'inactive'}
    size="sm"
    className="flex-shrink-0 ml-2"
/>
```

Replace (desktop table, line 363):
```jsx
<Badge variant="status" value={teacher.status} />
```
with:
```jsx
<Badge variant="status" value={teacher.user?.is_active ? 'active' : 'inactive'} />
```

- [ ] **Step 6: Update `Teachers/Show.jsx` header badge**

Replace lines 48-54:
```jsx
<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
    teacher.status === 'active' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
}`}>
    {teacher.status.toUpperCase()}
</span>
```
with:
```jsx
<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
    teacher.user?.is_active 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
}`}>
    {teacher.user?.is_active ? 'ACTIVE' : 'INACTIVE'} (Portal Access)
</span>
```
The "(Portal Access)" suffix is deliberate — it tells the admin this badge means login access, not an employment/assignment status, closing the exact ambiguity that caused the original bug report.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `php artisan test --filter=TeacherStatusDisplayTest`

Expected: PASS

- [ ] **Step 8: Manually verify in the browser**

Start `composer dev`, log in as an admin, deactivate a teacher from `/users`, then visit that teacher's `/teachers/{id}` show page and `/teachers` index — confirm the badge now shows "Inactive"/"INACTIVE (Portal Access)" even though `teachers.status` in the DB is still `'active'` (query it directly to confirm the column is untouched). Also open `/teachers/{id}/edit` and confirm the Status dropdown is gone and the form still submits successfully.

- [ ] **Step 9: Commit**

```bash
git add app/Http/Controllers/TeacherController.php resources/js/Pages/Teachers/Index.jsx resources/js/Pages/Teachers/Show.jsx resources/js/Pages/Teachers/Edit.jsx tests/Feature/TeacherStatusDisplayTest.php
git commit -m "$(cat <<'EOF'
Make teacher pages display login access from users.is_active, not teachers.status

teachers.status was writable independently of users.is_active but nothing
in the app (timetable/grade-assignment/scheduling) ever read it as a gate —
Grade::getAllowedTeachers() already filters on user.is_active. The only
consumers were the Teacher Index/Show/Edit pages, which meant an admin could
deactivate a teacher's login from the Users page while their own profile
still showed "Active", or flip the Edit-form dropdown to "Inactive" with
zero effect on their ability to log in. Retiring teachers.status as a
display/toggle source closes that gap; the column itself is left in place
(unread, DB-default only) rather than migrated away, to keep this change
low-risk.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bvb13oEi9dc8pLVTe6NDBf
EOF
)"
```

---

## Task 2: Guardian pages show Portal Access and Enrollment Status as two distinct signals

**Files:**
- Modify: `resources/js/Pages/Guardians/Index.jsx:54` (mobile status badge), `:400` (desktop status badge), `:474-478` (deactivate modal copy), `:485-489` (reactivate modal copy)
- Modify: `resources/js/Pages/Guardians/Show.jsx` (add a status block — none exists today)
- Test: `tests/Feature/GuardianDeactivationConsistencyTest.php`

**Interfaces:**
- Consumes: `guardian.user.is_active` (same as Task 1 — already present on every `guardian` Inertia prop via the eager-loaded `user` relation, e.g. `GuardianController::index()`/`show()` both `with(['user', ...])`).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the failing test locking in the decoupled contract**

```php
<?php

use App\Models\Guardian;
use App\Models\Student;
use App\Models\User;

test('deactivating a guardian cascades to students but does not touch the guardians user is_active login flag', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $guardianUser = User::factory()->create(['role' => 'guardian', 'school_id' => $admin->school_id, 'is_active' => true]);
    $guardian = Guardian::factory()->create(['user_id' => $guardianUser->id, 'school_id' => $admin->school_id]);
    $student = Student::factory()->create(['school_id' => $admin->school_id, 'guardian_id' => $guardian->id, 'status' => 'active']);

    $this->actingAs($admin)->patch("/guardians/{$guardian->id}/deactivate", ['reason' => 'Withdrew from school']);

    expect($guardian->fresh()->status)->toBe('inactive');
    expect($student->fresh()->status)->toBe('inactive');
    // the actual login gate is untouched — this is the decoupling this plan enforces
    expect($guardianUser->fresh()->is_active)->toBeTrue();
});

test('a guardian deactivated only via the Users page keeps full enrollment status but loses login', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $guardianUser = User::factory()->create(['role' => 'guardian', 'school_id' => $admin->school_id, 'is_active' => true]);
    $guardian = Guardian::factory()->create(['user_id' => $guardianUser->id, 'school_id' => $admin->school_id, 'status' => 'active']);
    $student = Student::factory()->create(['school_id' => $admin->school_id, 'guardian_id' => $guardian->id, 'status' => 'active']);

    $guardianUser->update(['is_active' => false]);

    expect($guardian->fresh()->status)->toBe('active'); // enrollment untouched
    expect($student->fresh()->status)->toBe('active'); // children untouched

    $response = $this->actingAs($admin)->get("/guardians/{$guardian->id}");

    $response->assertInertia(fn ($page) => $page
        ->component('Guardians/Show')
        ->where('guardian.user.is_active', false)
        ->where('guardian.status', 'active')
    );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `php artisan test --filter=GuardianDeactivationConsistencyTest`

Expected: the first test PASSES already (no backend change needed — it documents existing, correct behavior). The second test FAILS on the Inertia assertion only if `Guardians/Show` doesn't currently expose enough to distinguish the two — it already will, since `guardian.user.is_active` is present in props today; this step is a safety net confirming the *display* gap, not a backend gap. If it passes immediately, that confirms no backend change is needed for Task 2 and the remaining steps are pure frontend/copy changes.

- [ ] **Step 3: Update `Guardians/Index.jsx` desktop table — add a second Portal Access badge next to the existing status badge**

Replace line 400:
```jsx
<Badge variant="status" value={guardian.status || 'active'} />
```
with:
```jsx
<div className="flex flex-col gap-1">
    <Badge variant="status" value={guardian.status || 'active'} label={guardian.status === 'inactive' ? 'Enrollment: Inactive' : 'Enrollment: Active'} />
    <Badge variant="status" value={guardian.user?.is_active ? 'active' : 'inactive'} label={guardian.user?.is_active ? 'Portal: Active' : 'Portal: Blocked'} size="xs" />
</div>
```

- [ ] **Step 4: Update `Guardians/Index.jsx` mobile card badge the same way**

Replace line 54:
```jsx
<Badge variant="status" value={guardian.status || 'active'} size="sm" />
```
with:
```jsx
<Badge variant="status" value={guardian.status || 'active'} label={guardian.status === 'inactive' ? 'Enrollment: Inactive' : 'Enrollment: Active'} size="sm" />
<Badge variant="status" value={guardian.user?.is_active ? 'active' : 'inactive'} label={guardian.user?.is_active ? 'Portal: Active' : 'Portal: Blocked'} size="xs" className="ml-1" />
```

- [ ] **Step 5: Reframe the Deactivate/Reactivate modal copy so it stops implying login is affected**

Replace the Deactivate modal (lines 470-478):
```jsx
<ConfirmationModal
    show={showDeactivateModal}
    onClose={() => setShowDeactivateModal(false)}
    onConfirm={handleDeactivate}
    title="Deactivate Guardian"
    message={`This will mark ${selectedGuardian?.user?.name} as inactive and also deactivate all their linked students. All records (attendance, invoices, reports) are preserved and can still be reviewed. You can reactivate them at any time.`}
    confirmText="Deactivate"
    type="warning"
/>
```
with:
```jsx
<ConfirmationModal
    show={showDeactivateModal}
    onClose={() => setShowDeactivateModal(false)}
    onConfirm={handleDeactivate}
    title="Deactivate Enrollment"
    message={`This marks ${selectedGuardian?.user?.name}'s enrollment record inactive and also deactivates all their linked students. This does NOT block their portal login — to revoke login access, use the toggle on the Users page instead. All records (attendance, invoices, reports) are preserved and can still be reviewed.`}
    confirmText="Deactivate"
    type="warning"
/>
```

Replace the Reactivate modal (lines 481-489) title/message the same way:
```jsx
<ConfirmationModal
    show={showReactivateModal}
    onClose={() => setShowReactivateModal(false)}
    onConfirm={handleReactivate}
    title="Reactivate Enrollment"
    message={`Reactivate ${selectedGuardian?.user?.name}'s enrollment record? Their linked students will remain inactive — reactivate each student individually if needed. Portal login access is managed separately from the Users page.`}
    confirmText="Reactivate"
    type="success"
/>
```

- [ ] **Step 6: Add a status block to `Guardians/Show.jsx` (none exists today)**

In `resources/js/Pages/Guardians/Show.jsx`, immediately after the closing `</div>` of the name/relationship block (after line 49, before the outer `</div></div>` at line 50-51), add:
```jsx
<div className="flex items-center gap-2 mt-2">
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        guardian.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
    }`}>
        Enrollment: {guardian.status === 'inactive' ? 'Inactive' : 'Active'}
    </span>
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        guardian.user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
        Portal Access: {guardian.user?.is_active ? 'Active' : 'Blocked'}
    </span>
</div>
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `php artisan test --filter=GuardianDeactivationConsistencyTest`

Expected: PASS

- [ ] **Step 8: Manually verify in the browser**

On `/guardians`, deactivate a guardian via the dedicated button — confirm the modal copy now says it doesn't affect login, confirm both badges appear (Enrollment: Inactive, Portal: Active) and that the guardian can still log in. Separately, deactivate a different guardian's login from `/users` — confirm `/guardians/{id}` now shows Enrollment: Active but Portal Access: Blocked.

- [ ] **Step 9: Commit**

```bash
git add resources/js/Pages/Guardians/Index.jsx resources/js/Pages/Guardians/Show.jsx tests/Feature/GuardianDeactivationConsistencyTest.php
git commit -m "$(cat <<'EOF'
Show guardian enrollment status and portal login access as two distinct signals

Guardian::deactivate() has always cascaded to linked students as a real
enrollment/business action — separate from users.is_active, which is the
only field that actually gates login. The old single "status" badge and
"Deactivate" button copy implied deactivating a guardian blocked their
login, which was never true. Rather than merging the two into one toggle
(which would either lose the cascade-to-children capability or silently
bolt it onto the generic Users-page toggle), this keeps them as two
independent, clearly-labeled signals: Enrollment (guardian.status, still
cascades to students) and Portal Access (user.is_active, toggled only from
the Users page).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bvb13oEi9dc8pLVTe6NDBf
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** Task 1 covers "teacher status has no other consumers, retire it as a display/toggle source." Task 2 covers "guardian cascade must not be merged into is_active — keep it, but decouple the display and copy." Both options discussed in-conversation (true merge vs. mirrored field) are superseded by this third resolution once the guardian cascade's product implications were traced through — neither Task touches `UserManagementService`, `LoginRequest`, or `RoleMiddleware`, per Global Constraints, since those already implement the target login behavior correctly.
- **Placeholder scan:** no TBD/"add validation"/"similar to Task N" — every step has literal before/after code.
- **Type consistency:** `teacher.user.is_active` and `guardian.user.is_active` are used identically in both tasks (boolean, read via Eloquent's already-loaded `user` relation, already unhidden per `User::$hidden`).
