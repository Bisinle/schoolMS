# Document Display Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Student-owned documents (a child's birth certificate, etc.) display as `{Category} – {Guardian Name} – {Child Name}` using the child's *actual linked guardian*, not whoever technically clicked upload — and fix the pre-existing eager-load gap that makes Teacher/Guardian-owned document names show as "Unknown" today.

**Architecture:** One backend query change (`DocumentController::index()`/`::show()` switch from a flat `'documentable'` eager-load to `MorphTo::morphWith()`, loading `Teacher::user`, `Guardian::user`, and `Student::guardians.user` depending on the polymorphic type), plus a matching frontend change (`getEntityName()`'s Student branch in `Documents/Index.jsx` and `Documents/Show.jsx` reads the newly-available `guardians` pivot data instead of just the child's own name).

**Tech Stack:** Laravel 12 (PHP 8.4 — see Global Constraints), Inertia.js + React 18, Pest-syntax-free PHPUnit-style test classes with `RefreshDatabase` (house convention, confirmed via `tests/Feature/DocumentOwnershipTest.php`).

**Spec:** `docs/superpowers/specs/2026-09-19-document-display-names-design.md`

## Global Constraints

- `school_id` tenant isolation must not be touched or weakened. This plan doesn't need to — `Student`/`Guardian`/`Teacher` all already use `BelongsToSchool`, and the new eager-loads stay inside those existing scoped queries. No cross-school risk introduced.
- Use `php8.4` explicitly for every `artisan`/`composer` test command — the default `php` on this machine resolves to 8.5, which has no `pdo_sqlite`, and `php artisan test` fails immediately with `could not find driver` otherwise.
- Test classes extend `Tests\TestCase` with explicit `use Illuminate\Foundation\Testing\RefreshDatabase;`, matching `tests/Feature/DocumentOwnershipTest.php` exactly (hand-built `Model::create([...])` fixtures, not factories, for `Document` rows; factories for `School`/`User`/`Teacher`/`Guardian`/`Student`).
- Every test hitting an Inertia route must call `$this->withoutVite();` first (house convention, confirmed in `DocumentOwnershipTest.php` and elsewhere).
- `tests/TestCase.php` auto-seeds `RolePermissionSeeder` (`protected $seed = true;`) for every test, and `App\Observers\UserObserver` auto-syncs a created `User`'s Spatie role from its plain `role` column — so `User::factory()->create(['role' => 'admin'])` etc. is sufficient to get real permission checks passing; no manual `assignRole()`/permission setup needed in tests.
- No new packages, no `npm install`/`composer require` of any kind — confirmed explicitly by the project owner twice this session.
- No `git push` — commits only (per this repo's `CLAUDE.md`).
- Do not touch `tests/Feature/FeeModuleGatingTest.php` or try to fix its 1 pre-existing failure (`Unable to locate file in Vite manifest: resources/js/Pages/Fees/MonthlyFees/Index.jsx`) — confirmed unrelated to this feature, out of scope.
- Baseline before this plan: `php8.4 artisan test` → 372 tests, 371 passed, 1 pre-existing unrelated failure. After Task 1's new test file, expect 372 + N passed (N = new tests added), same 1 known failure, zero new failures.

---

### Task 1: Backend eager-load fix + data-contract test

**Files:**
- Modify: `app/Http/Controllers/DocumentController.php:29-30` (inside `index()`) and `:198` (inside `show()`)
- Test: Create `tests/Feature/DocumentDisplayNameDataTest.php`

**Interfaces:**
- Produces: `DocumentController::index()`'s and `::show()`'s Inertia response, where every document's `documentable` prop includes, depending on `documentable_type`:
  - `Teacher` → nested `user` object (`{id, name, ...}`)
  - `Guardian` → nested `user` object (`{id, name, ...}`)
  - `Student` → nested `guardians` array, each entry with a `pivot.is_primary` boolean and a nested `user` object
- Consumes: nothing from an earlier task (this is the first task).

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/DocumentDisplayNameDataTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\Guardian;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Data-contract test for the document display-name feature
 * (docs/superpowers/specs/2026-09-19-document-display-names-design.md).
 * getEntityName()/getDisplayName() in Documents/Index.jsx and Show.jsx are
 * plain client-side JS with no test runner in this repo — this test proves
 * the backend half (the eager-loaded shape those functions depend on) is
 * correct and regression-proof. It does not execute the JS itself; that is
 * covered by the manual Playwright pass in Task 4 of the implementation plan.
 */
class DocumentDisplayNameDataTest extends TestCase
{
    use RefreshDatabase;

    private function makeCategory(): DocumentCategory
    {
        return DocumentCategory::create([
            'name' => 'National ID',
            'slug' => 'national-id-'.uniqid(),
        ]);
    }

    private function makeDocument(School $school, DocumentCategory $category, string $documentableType, int $documentableId, User $uploadedBy): Document
    {
        return Document::create([
            'school_id' => $school->id,
            'document_category_id' => $category->id,
            'documentable_type' => $documentableType,
            'documentable_id' => $documentableId,
            'original_filename' => 'file.pdf',
            'stored_filename' => uniqid().'.pdf',
            'file_path' => 'documents/'.uniqid().'.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'status' => 'pending',
            'uploaded_by' => $uploadedBy->id,
        ]);
    }

    public function test_index_loads_teacher_owner_user_name(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher', 'name' => 'Hassan Ibrahim']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $document = $this->makeDocument($school, $category, Teacher::class, $teacher->id, $teacherUser);

        $response = $this->actingAs($admin)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('documents.data.0.id', $document->id)
            ->where('documents.data.0.documentable.user.name', 'Hassan Ibrahim')
        );
    }

    public function test_index_loads_guardian_owner_user_name(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian', 'name' => 'Amina Hassan']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);
        $document = $this->makeDocument($school, $category, Guardian::class, $guardian->id, $guardianUser);

        $response = $this->actingAs($admin)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('documents.data.0.id', $document->id)
            ->where('documents.data.0.documentable.user.name', 'Amina Hassan')
        );
    }

    public function test_index_loads_students_primary_guardian_and_user_name(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $motherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian', 'name' => 'Amina Hassan']);
        $mother = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $motherUser->id]);

        $fatherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian', 'name' => 'Ali Mohamed']);
        $father = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $fatherUser->id]);

        $child = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $mother->id, 'first_name' => 'Yusuf', 'last_name' => 'Hassan']);
        $child->guardians()->attach($mother->id, ['is_primary' => true, 'relationship' => 'mother']);
        $child->guardians()->attach($father->id, ['is_primary' => false, 'relationship' => 'father']);

        $document = $this->makeDocument($school, $category, Student::class, $child->id, $motherUser);

        $response = $this->actingAs($admin)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('documents.data.0.id', $document->id)
            ->has('documents.data.0.documentable.guardians', 2)
            ->where('documents.data.0.documentable.guardians.0.pivot.is_primary', true)
            ->where('documents.data.0.documentable.guardians.0.user.name', 'Amina Hassan')
        );
    }

    public function test_index_falls_back_to_first_guardian_when_none_marked_primary(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian', 'name' => 'Omar Abdi']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);

        $child = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id, 'first_name' => 'Safia', 'last_name' => 'Abdi']);
        $child->guardians()->attach($guardian->id, ['is_primary' => false, 'relationship' => 'father']);

        $document = $this->makeDocument($school, $category, Student::class, $child->id, $admin);

        $response = $this->actingAs($admin)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('documents.data.0.documentable.guardians', 1)
            ->where('documents.data.0.documentable.guardians.0.user.name', 'Omar Abdi')
        );
    }

    public function test_index_returns_empty_guardians_array_when_student_has_no_pivot_guardians(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        // StudentFactory sets the legacy guardian_id column but attaches
        // nothing to the guardian_student pivot table - this is the
        // "somehow no guardian linked" edge case the spec calls out
        // (not expected in real data, but must not crash).
        $child = Student::factory()->create(['school_id' => $school->id, 'first_name' => 'Zainab', 'last_name' => 'Issa']);
        $document = $this->makeDocument($school, $category, Student::class, $child->id, $admin);

        $response = $this->actingAs($admin)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('documents.data.0.id', $document->id)
            ->has('documents.data.0.documentable.guardians', 0)
        );
    }

    public function test_show_loads_students_primary_guardian_and_user_name(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian', 'name' => 'Fatima Ahmed']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);

        $child = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id, 'first_name' => 'Ibrahim', 'last_name' => 'Aden']);
        $child->guardians()->attach($guardian->id, ['is_primary' => true, 'relationship' => 'mother']);

        $document = $this->makeDocument($school, $category, Student::class, $child->id, $guardianUser);

        $response = $this->actingAs($admin)->get("/documents/{$document->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('document.documentable.guardians.0.pivot.is_primary', true)
            ->where('document.documentable.guardians.0.user.name', 'Fatima Ahmed')
        );
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `php8.4 artisan test tests/Feature/DocumentDisplayNameDataTest.php`
Expected: FAIL on every test — `documentable.user`/`documentable.guardians` come back `null`/missing, because the controller only eager-loads the flat `documentable` relation today.

- [ ] **Step 3: Implement the eager-load fix**

In `app/Http/Controllers/DocumentController.php`, `index()` currently has (around line 29-30):

```php
        $query = $user->accessibleDocuments()
            ->with(['category', 'documentable', 'uploader', 'verifier']);
```

Replace with:

```php
        $query = $user->accessibleDocuments()
            ->with([
                'category',
                'uploader',
                'verifier',
                'documentable' => function ($morphTo) {
                    $morphTo->morphWith([
                        Teacher::class => ['user'],
                        Guardian::class => ['user'],
                        Student::class => ['guardians.user'],
                    ]);
                },
            ]);
```

`show()` currently has (around line 198):

```php
        $document->load(['category', 'documentable', 'uploader', 'verifier']);
```

Replace with:

```php
        $document->load([
            'category',
            'uploader',
            'verifier',
            'documentable' => function ($morphTo) {
                $morphTo->morphWith([
                    Teacher::class => ['user'],
                    Guardian::class => ['user'],
                    Student::class => ['guardians.user'],
                ]);
            },
        ]);
```

`Teacher`, `Guardian`, `Student` are already imported at the top of this file — no new `use` statements needed.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `php8.4 artisan test tests/Feature/DocumentDisplayNameDataTest.php`
Expected: PASS, all 6 tests.

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `php8.4 artisan test`
Expected: `378 passed, 1 failed` (the 1 pre-existing `FeeModuleGatingTest` failure — same as the documented baseline, nothing new).

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/DocumentController.php tests/Feature/DocumentDisplayNameDataTest.php
git commit -m "fix: eager-load documentable.user/guardians for document owner names"
```

---

### Task 2: Frontend — Documents/Index.jsx Student naming

**Files:**
- Modify: `resources/js/Pages/Documents/Index.jsx:273-284` (the `getEntityName` function's `Student` branch)

**Interfaces:**
- Consumes: Task 1's `documentable.guardians[].pivot.is_primary` and `documentable.guardians[].user.name` (only present once Task 1 is merged — this task has no effect, and cannot be visually verified, before Task 1 lands).
- Produces: no new exported interface — `getEntityName(doc)`'s return value is already consumed by `getDisplayName(doc)` (line 233) and `MobileDocumentItem` (via the `getEntityName` prop, line 456), both already wired from a prior session pass. No caller changes needed.

- [ ] **Step 1: Make the change**

In `resources/js/Pages/Documents/Index.jsx`, `getEntityName` currently reads (lines 273-284):

```js
    const getEntityName = (doc) => {
        if (doc.documentable_type.includes("Teacher")) {
            return doc.documentable.user?.name || "Unknown Teacher";
        } else if (doc.documentable_type.includes("Student")) {
            return `${doc.documentable.first_name} ${doc.documentable.last_name}`;
        } else if (doc.documentable_type.includes("Guardian")) {
            return doc.documentable.user?.name || "Unknown Guardian";
        } else if (doc.documentable_type.includes("User")) {
            return doc.documentable.name || "Unknown User";
        }
        return "Unknown";
    };
```

Change the `Student` branch to:

```js
    const getEntityName = (doc) => {
        if (doc.documentable_type.includes("Teacher")) {
            return doc.documentable.user?.name || "Unknown Teacher";
        } else if (doc.documentable_type.includes("Student")) {
            const guardians = doc.documentable.guardians || [];
            const primary = guardians.find((g) => g.pivot?.is_primary) || guardians[0];
            const childName = `${doc.documentable.first_name} ${doc.documentable.last_name}`;
            return primary?.user?.name ? `${primary.user.name} – ${childName}` : childName;
        } else if (doc.documentable_type.includes("Guardian")) {
            return doc.documentable.user?.name || "Unknown Guardian";
        } else if (doc.documentable_type.includes("User")) {
            return doc.documentable.name || "Unknown User";
        }
        return "Unknown";
    };
```

- [ ] **Step 2: Run the full suite to confirm no regressions**

Run: `php8.4 artisan test`
Expected: `378 passed, 1 failed` — same as after Task 1 (this is a frontend-only change; no backend test count changes). This step cannot verify the JS logic itself (no JS test runner exists in this repo) — it only confirms the change didn't break any backend contract. Visual confirmation happens in Task 4.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Pages/Documents/Index.jsx
git commit -m "feat: derive Student document owner name from linked guardian, not uploader"
```

---

### Task 3: Frontend — Documents/Show.jsx Student naming

**Files:**
- Modify: `resources/js/Pages/Documents/Show.jsx:127-138` (the `getEntityName` function's `Student` branch)

**Interfaces:**
- Consumes: same as Task 2 — Task 1's eager-loaded `documentable.guardians`.
- Produces: no new exported interface — `getEntityName()` (no-arg, closes over `document`) already feeds `getDisplayName()` (line 144), which already feeds the page `<h1>` (line 186), the browser tab title (line 163), and the verify/delete confirm messages (lines 62, 85). No caller changes needed.

- [ ] **Step 1: Make the change**

In `resources/js/Pages/Documents/Show.jsx`, `getEntityName` currently reads (lines 127-138):

```js
    const getEntityName = () => {
        if (document.documentable_type.includes("Teacher")) {
            return document.documentable.user?.name || "Unknown Teacher";
        } else if (document.documentable_type.includes("Student")) {
            return `${document.documentable.first_name} ${document.documentable.last_name}`;
        } else if (document.documentable_type.includes("Guardian")) {
            return document.documentable.user?.name || "Unknown Guardian";
        } else if (document.documentable_type.includes("User")) {
            return document.documentable.name || "Unknown User";
        }
        return "Unknown";
    };
```

Change the `Student` branch to:

```js
    const getEntityName = () => {
        if (document.documentable_type.includes("Teacher")) {
            return document.documentable.user?.name || "Unknown Teacher";
        } else if (document.documentable_type.includes("Student")) {
            const guardians = document.documentable.guardians || [];
            const primary = guardians.find((g) => g.pivot?.is_primary) || guardians[0];
            const childName = `${document.documentable.first_name} ${document.documentable.last_name}`;
            return primary?.user?.name ? `${primary.user.name} – ${childName}` : childName;
        } else if (document.documentable_type.includes("Guardian")) {
            return document.documentable.user?.name || "Unknown Guardian";
        } else if (document.documentable_type.includes("User")) {
            return document.documentable.name || "Unknown User";
        }
        return "Unknown";
    };
```

- [ ] **Step 2: Run the full suite to confirm no regressions**

Run: `php8.4 artisan test`
Expected: `378 passed, 1 failed` — same as after Task 1/2.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Pages/Documents/Show.jsx
git commit -m "feat: derive Student document owner name from linked guardian, not uploader (Show page)"
```

---

### Task 4: Manual Playwright verification (final checkpoint)

**Files:** none modified — this task only drives the already-running app in a browser and reports back. This is the human-review checkpoint the project owner explicitly asked for before considering the feature done.

**Interfaces:**
- Consumes: Tasks 1-3 fully merged and all automated tests passing (378 passed, 1 known pre-existing failure).

- [ ] **Step 1: Confirm the app is running**

The dev server should already be running from this session (`composer dev`, confirmed reachable at `http://127.0.0.1:8000`). Verify with:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/login
```

Expected: `200`. If not running, start it with `composer dev` (do not start a second/duplicate instance if one is already up — check `ps aux | grep "artisan serve"` first).

- [ ] **Step 2: Log in as admin via Playwright**

Use the `playwright-cli` skill (or `agent-browser` skill) to open `http://127.0.0.1:8000/login`, sign in with `admin@demoschool.com` / `DemoSchool2026!` (reset earlier this session — this is the project owner's real local admin account, not a throwaway).

- [ ] **Step 3: Confirm a Student-owned document exists to look at**

Navigate to `/documents`, filter by Entity Type = Student. If none exist in the seeded demo data, upload one live through the UI (`/documents/create`, pick any seeded child under "Student") so there's a concrete example to verify against.

- [ ] **Step 4: Verify the Documents list**

Screenshot `/documents`. Confirm:
- A Teacher-owned row reads `{Category} – {Teacher Name}` (not `Unknown Teacher`).
- A Guardian-owned row reads `{Category} – {Guardian Name}` (not `Unknown Guardian`).
- The Student-owned row reads `{Category} – {Guardian Name} – {Child Name}`.
- Every row's original filename still shows as the secondary/muted line underneath.

- [ ] **Step 5: Verify the Show page**

Click into the Student-owned document. Screenshot the Show page. Confirm the `<h1>` and the "Document Owner" field both reflect the same `{Guardian Name} – {Child Name}` format, and the browser tab title matches.

- [ ] **Step 6: Report back**

Report the screenshots and a plain confirmation of each check in Steps 4-5 back to the project owner for their review. Do not mark this feature done until they've reviewed it.
