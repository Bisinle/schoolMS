# Document Display Names — Design Spec

## Context

The Documents module (`app/Models/Document.php`, `DocumentController`, `resources/js/Pages/Documents/*`) stores every uploaded file's raw client-supplied filename (`original_filename`, e.g. `screenshot05032850248.png`) and, until this session, rendered that raw filename as the primary label everywhere a document is listed. That makes the Documents list and Show page unreadable — same category can show `IMG_2049.jpg`, `scan(3).pdf`, `screenshot05032850248.png` side by side with no way to tell what any of them actually are without opening each one.

A prior pass this session (already implemented, not part of this plan) added a `getDisplayName()`/`getEntityName()` helper pair to `Documents/Index.jsx` and `Documents/Show.jsx` that derives `{Category} – {Owner Name}` instead, using the polymorphic `documentable` relation (`Teacher`/`Student`/`Guardian`/`User`) already loaded on each `Document`. That first pass used the *uploader* (`Document::uploaded_by`) as a stand-in for "owner" wherever the direct owner lookup didn't already resolve a name.

This spec covers a correction and extension to that naming logic, based on how the school actually operates:

- Students never upload their own documents. Every document attached to a `Student` (e.g. a birth certificate) was uploaded by a guardian, or by an admin on the guardian's behalf (e.g. during bulk onboarding before a parent has been trained to use the system themselves).
- Because of that admin-bulk-upload case, `uploaded_by` is **not** a reliable stand-in for "which guardian does this belong to" — an admin-uploaded document would show the admin's name, which is wrong; the document belongs to the child's actual parent, not whoever happened to click upload.
- Every student in this system has at least one guardian linked (confirmed by the system owner — no orphan-student case to design around).

## Goals

- Documents owned by a `Teacher` display as `{Category} – {Teacher Name}` (unchanged from the prior pass).
- Documents owned by a `Guardian` (the guardian's own documents, e.g. their own ID) display as `{Category} – {Guardian Name}` (unchanged from the prior pass).
- Documents owned by a generic `User` display as `{Category} – {User Name}` (unchanged from the prior pass).
- Documents owned by a `Student` (a child's documents) display as `{Category} – {Guardian Name} – {Child Name}`, where "Guardian Name" is the child's **actual linked guardian** (`Student::guardians()`, the `guardian_student` pivot, preferring the row flagged `is_primary`), never the uploader.
- `original_filename` stays visible as a secondary/muted line under the display name everywhere (unchanged from the prior pass) — the raw filename is still useful for support/provenance, just no longer the primary label.

## Non-goals

- Changing what's stored in the database. `original_filename`, `stored_filename`, `uploaded_by` all stay exactly as they are — this is a display-derivation change only.
- Any change to upload flow, validation, storage disks, or authorization (`DocumentPolicy`).
- Fixing every possible data-quality gap. If a student genuinely has zero linked guardians (not expected per the system owner, but the code should not crash if it happens), display degrades to just the child's name, no guardian segment.

## Bug found during design (pre-existing, unrelated to any prior edit this session)

`DocumentController::index()` and `::show()` eager-load `'documentable'` as a flat relation — this loads the base `Teacher`/`Guardian`/`Student`/`User` row only, never its nested `user` relation (for `Teacher`/`Guardian`) or `guardians` relation (for `Student`). Confirmed empirically via `php artisan tinker`: pulling a real Guardian-owned `Document` and inspecting `$doc->documentable->getRelations()` came back empty, and the JSON serialization has no `user` key at all.

Practical effect: **today, right now**, the admin's "Owner" column on the Documents list already silently shows `Unknown Teacher` / `Unknown Guardian` for every Teacher/Guardian-owned document, because `getEntityName()` falls through to its `|| "Unknown Teacher"` / `|| "Unknown Guardian"` fallback. This plan's eager-load fix (needed anyway to reach `guardians.user` for the Student case) fixes this latent bug as a direct side effect — it is not a separate feature, just the same query change covering both.

## Data model / relations used (no schema change)

- `Student::guardians()` — `belongsToMany(Guardian::class, 'guardian_student')`, pivot columns include `is_primary` (bool). A student can have more than one guardian (mother + father); `is_primary` marks the primary contact.
- `Guardian::user()` — `belongsTo(User::class)`. `Guardian::studentsMany()` is the mirror relation, not needed here.
- `Teacher::user()` — `belongsTo(User::class)`.
- No migration, no new column, no new pivot table — `guardian_student` already exists with `is_primary`.

## Backend change

`DocumentController::index()` (currently `app/Http/Controllers/DocumentController.php:29-30`) and `::show()` (currently line 198) both currently do:

```php
->with(['category', 'documentable', 'uploader', 'verifier'])
```

Change to use `MorphTo::morphWith()` so the nested relation loaded depends on which concrete type `documentable` resolves to:

```php
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
])
```

`Teacher`, `Guardian`, `Student` are already imported in `DocumentController.php`. No new imports needed (the closure parameter is left untyped, matching how the rest of the file avoids importing `Illuminate\Database\Eloquent\Relations\MorphTo` purely for a type hint).

## Frontend change

`getEntityName()` in both `resources/js/Pages/Documents/Index.jsx` and `resources/js/Pages/Documents/Show.jsx` currently has (identical logic, one takes `doc` as a param, the other closes over `document`):

```js
} else if (doc.documentable_type.includes("Student")) {
    return `${doc.documentable.first_name} ${doc.documentable.last_name}`;
}
```

Changes to:

```js
} else if (doc.documentable_type.includes("Student")) {
    const guardians = doc.documentable.guardians || [];
    const primary = guardians.find((g) => g.pivot?.is_primary) || guardians[0];
    const childName = `${doc.documentable.first_name} ${doc.documentable.last_name}`;
    return primary?.user?.name ? `${primary.user.name} – ${childName}` : childName;
}
```

No other branch (`Teacher`/`Guardian`/`User`) changes — they already read `documentable.user?.name` / `documentable.name`, which will simply start resolving correctly once the backend eager-load fix lands.

Everywhere `getEntityName()`'s return value flows into `getDisplayName()` (`{Category} – {getEntityName()}`), a Student-owned document now naturally renders as `{Category} – {Guardian Name} – {Child Name}` with no further template change needed — `getDisplayName()` just concatenates category with whatever `getEntityName()` returns.

## Testing approach and its limit

This repo has no JS test runner at all (no vitest/jest/testing-library, no `test` script in `package.json`), and the project owner has said explicitly not to install anything new. That means `getEntityName()`/`getDisplayName()` — plain client-side JS/JSX functions — **cannot be unit-tested directly** in this pass.

What can and will be tested, using the existing Pest/PHPUnit setup: a **data-contract test** — asserting that the Inertia response's `documentable` prop actually contains the nested shape the frontend code depends on (`documentable.user.name` for Teacher/Guardian, `documentable.guardians[].pivot.is_primary` + `documentable.guardians[].user.name` for Student). This proves the backend half is correct and regression-proof; it does not execute or verify the JS naming logic itself. That gap is closed by the manual Playwright pass at the end of the implementation plan.

## Verification (manual, after automated tests pass)

Using the already-reset admin credentials (`admin@demoschool.com` / `DemoSchool2026!`), a Playwright-driven click-through of `/documents` and one document's Show page, for one Teacher-owned doc, one Guardian-owned doc, and one Student-owned doc, confirming the rendered label matches this spec's Goals section exactly.
