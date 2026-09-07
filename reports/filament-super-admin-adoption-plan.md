# Filament Adoption Plan — Super Admin Panel

Point-in-time design note from an in-conversation discussion (2026-09-07). Not implemented yet. Read this before starting any Filament work in this repo.

## Why this came up

The super-admin surface (`app/Http/Controllers/SuperAdmin/*`, `routes/super-admin.php`, `resources/js/Pages/SuperAdmin/*`) is hand-rolled Inertia/React CRUD — schools, users, impersonation, a dashboard. It's thin (no create/role-change UI for users, no System Logs/Settings pages — see `reports/super-admin-fixes-required.md`). Filament (a Laravel admin-panel builder) was raised as a way to get a lot of that scaffolding — tables, filters, forms, bulk actions — for free instead of hand-building it in React for every one of the ~42 models in this app that don't yet have any admin UI.

## Compatibility check (done — no blocker)

- Filament v4 requires PHP 8.2+ and Laravel v11.28+ — this app satisfies both (Laravel 12, `composer.json`).
- Filament v4's default panel theme requires Tailwind v4.1+ *only if you customize the panel's own CSS*. This app's frontend is on Tailwind v3.4.18, but Filament ships its own pre-built, isolated CSS/JS bundle for the default (non-custom-themed) panel — it does not share a build pipeline with `resources/js`/Vite. **No Tailwind version conflict for a stock panel.** This stops being true the moment anyone builds a custom Filament theme (which does need Filament's own Tailwind v4 toolchain) — flag that explicitly if a future session considers theming.

## Complexity rating

**Bootstrap phase (install Filament, stand up an empty panel, wire super-admin auth): 2/10.**
Doable in a single session. Steps: `composer require filament/filament`, `php artisan filament:install --panels`, point the panel's auth/guard at the existing `super_admin` role check (mirror what `super.admin` route middleware already does — see `app/Http/Middleware` — don't reinvent it), confirm the panel boots at its own route prefix without touching any existing Inertia routes. No schema changes required for this phase.

**Full rollout across all ~42 uncovered models: 7/10.**
Not technically hard — the difficulty is volume and review overhead, not framework friction. Each model needs its own `Resource` class (table columns, filters, form schema, authorization policy wiring), and every one needs a human pass to decide what's actually worth exposing (a raw CRUD grid over `TimetableSlot` or `QuranTracking` is not obviously useful without curation). Rated 7, not higher, because Filament's generator (`php artisan make:filament-resource`) does most of the boilerplate — the remaining work is customization + review, not novel engineering.

## The specific risk to flag before touching Teacher/Guardian

Any Filament resource built for `Teacher` or `Guardian` must **not** hand-roll a fresh `$teacher->user->name` / `$guardian->user->email` accessor without checking for orphaned rows first. A prior session (commits `c1b53b6`, `5769a98`) fixed exactly this class of bug — teacher/guardian rows whose `user_id` pointed at a deleted or null `User` were crashing the dashboard and timetable services on unguarded `->user->` access. Any Filament table column or form field that reaches through `teacher.user`/`guardian.user` needs the same `?->` null-safe guard those fixes introduced, or Filament will reproduce the identical crash in its own UI. Additionally, whatever Filament resource is built for `Teacher`/`Guardian` must respect the display split introduced in `reports/super-admin-fixes-required.md` / `docs/superpowers/plans/2026-09-07-teacher-guardian-status-unification.md` — i.e. surface `user.is_active` (portal login access) and `teacher`/`guardian` business status as distinct columns, not one conflated "status" field, or the same admin-facing confusion this plan just fixed in the React UI will reappear in the Filament UI.

## Recommendation

1. Do the bootstrap phase now/soon (2/10, low risk, no schema change, isolated from the existing Inertia app).
2. Pick 2-3 low-stakes, low-blast-radius models first (e.g. `Subject`, `DocumentCategory` — no cross-tenant sensitivity, no orphan-relation risk) to validate the pattern and get a real feel for per-model effort before committing to the rest.
3. Batch the remaining ~39 models in groups of 5-8, review each batch as its own PR/session rather than attempting all 42 at once.
4. Put `Teacher`, `Guardian`, and any `School`/tenant-crossing model (impersonation, billing) **last** in the batching order — they carry the null-guard and multi-tenant (`school_id`) risks called out above and in `CLAUDE.md`'s data-isolation rule, and benefit most from the team having already built pattern-fluency on safer models first.

This file and `reports/super-admin-fixes-required.md` are meant to be read together by whichever session picks this up next.
