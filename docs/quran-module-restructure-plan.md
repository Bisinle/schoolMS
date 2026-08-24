# Quran Module Restructure — Implementation Plan

**Status:** Active
**Branch:** `restructure/quran-module` (Claude creates this branch and works only on it — see Git Rules below)
**Stack:** Laravel + Inertia + React
**Source documents:** `quran-module-audit.md`, `quran-functionality-audit.md`, `quran-features-audit.md` (all three already produced — do not re-audit unless a phase explicitly says to verify something)

This file is the single source of truth for this work. Claude Code must re-read this file at the start of every session working on this module, and must not start a phase out of order unless explicitly told to.

---

## 0. Non-negotiable rules (apply to every phase, no exceptions)

### 0.1 School ID isolation
Every Quran table, query, model, controller action, and new feature must enforce School ID as the tenant boundary. Concretely:
- Any new or modified model touching Quran data must use the `BelongsToSchool` trait (or an equivalent global scope) — not a manual `where('school_id', ...)` sprinkled into some methods and not others.
- Any single-record route (`show`, `edit`, `update`, `destroy`, `activate`, etc.) must be checked against a real ownership/tenancy mechanism (global scope and/or Policy), never role-only authorization.
- When a phase touches `QuranHomework`, `QuranSchedule`, or `QuranHomePractice`, fixing their missing `BelongsToSchool` scoping is in scope by default, even if not the phase's main goal, because these three currently have a live IDOR gap (see audit §16).
- Every phase's write-up (see "Phase completion report" below) must state explicitly how School ID is enforced for anything new in that phase. "It will inherit the existing scope" is an acceptable answer only if verified, not assumed.

### 0.2 Nothing existing gets silently discarded
Where the audits show functionality already exists (✅ or ⚠️), it is extended, not rebuilt from scratch, unless a phase explicitly proposes replacing it and that's called out as a decision, not a side effect.

### 0.3 Git rules — read carefully
- Claude creates and works on a single branch: `restructure/quran-module`, created from the current default branch before Phase 1 begins.
- **Claude does not commit and does not push, ever, at any point, in any phase.** All commits and pushes are done by the human. Claude leaves changes as uncommitted working-tree modifications for review.
- Any superpowers skill step that normally ends in "commit" or "push" (e.g. parts of `finishing-a-development-branch`, `using-git-worktrees`) stops short of that step — Claude prepares the change and hands it back with a summary of what changed and why, and waits.
- Claude does not merge, rebase onto, or otherwise touch any other branch.
- If a superpowers skill's default behavior would commit automatically, Claude must interrupt that flow and ask instead.

### 0.4 Superpowers must actually fire
This project intentionally leans on the `superpowers` plugin for engineering discipline. For each phase below, the relevant skills are listed. Claude should invoke them explicitly (don't just "keep them in mind") — treat the skill list per phase as required steps, not suggestions:
- Start of any phase with real design ambiguity → `superpowers:brainstorming` first, before writing code.
- Before writing implementation code for anything with behavior to verify → `superpowers:test-driven-development`.
- Any bug encountered mid-phase → `superpowers:systematic-debugging` (4-phase root cause process), not a guess-and-patch.
- Before declaring any phase done → `superpowers:verification-before-completion` — this must include actually running the relevant tests/queries and showing the output, not asserting success.
- Phases marked "parallelizable" below → `superpowers:dispatching-parallel-agents` / `superpowers:subagent-driven-development`.
- `superpowers:writing-plans` / `superpowers:executing-plans` should structure each phase's internal steps.
- `superpowers:using-git-worktrees` governs the branch setup in 0.3, minus the commit step.

### 0.5 No test safety net exists yet
The audit confirms zero tests, zero factories, zero seeders for this module. Phase 1 includes building a minimal characterization-test baseline before any behavioral change ships, specifically so later phases aren't refactoring blind.

---

## Phase 1 — Stop the bleeding: fix the production 500s + close the IDOR gap

**Goal:** Module loads without fatal errors, and the live cross-tenant vulnerability is closed. No new features yet.

**Skills:** `systematic-debugging` (root cause already known from audit, but confirm live), `test-driven-development`, `verification-before-completion`.

**Work:**
1. Confirm `QURAN_API_CLIENT_ID`/`QURAN_API_CLIENT_SECRET` status in the real environment; make `QuranApiService`'s typed properties nullable so a missing credential degrades gracefully instead of crashing container resolution.
2. Fix `QuranHomePracticeController::getAllSurahs()` → `getSurahs()` (both call sites).
3. Add HTTP timeouts to `QuranApiService`'s outbound calls.
4. Apply `BelongsToSchool` (or equivalent scope) to `QuranHomework`, `QuranSchedule`, `QuranHomePractice`. Write characterization tests first that prove the current cross-tenant leak (a factory/seeder for these three models needs to exist for this — build minimal ones now), then fix, then confirm the tests pass and cross-school access is denied on `show`/`edit`/`update`/`destroy` for all three.
5. Introduce `QuranHomeworkPolicy`, `QuranSchedulePolicy`, `QuranHomePracticePolicy` to replace the inline role-only `if` checks, registered like the other 11 policies in `AppServiceProvider`.
6. Fix the swapped-argument bugs in `QuranTrackingController` (`calculateTotalVerses`/`calculatePageRange` argument order).
7. Fix `name_english` → `name_simple` in HomePractice Create/Edit.

**Phase completion report must state:** School ID enforcement mechanism for each of the 3 newly-scoped models; test coverage added; confirmation the 30 previously-500ing routes now resolve.

---

## Phase 2 — Data model: Hizb, Juz as a real structural unit, fractional page precision

**Goal:** Schema and models support Hizb, a stored (not just derived) Juz range, and fractional page positions — the missing structural units from audit item #1 and #3.

**Skills:** `brainstorming` (needs a real design decision on how fractional pages are represented — decimal column vs. page+fraction pair vs. verse-anchored — and how Hizb is sourced/stored), `test-driven-development`.

**Work:**
1. Decide and document (in the phase report) the fractional-page representation. Consider: does "page 2.5" mean a specific verse boundary, or an arbitrary half? Recommend anchoring to a verse boundary if possible, since verse-level precision already exists (`verse_from`/`verse_to`) and is more meaningful than an arbitrary decimal.
2. Add Hizb columns/derivation consistent with how Juz is currently handled, but note the audit's finding that Juz is *derived-only* today — decide if Hizb should be derived (like Juz) or stored (`hizb_from`/`hizb_to`), and do the same reconsideration for whether Juz should become a stored range instead of a derived count, since Phase 4 (assignments) will need to reference these ranges directly.
3. Resolve the two-integration ambiguity flagged in the features audit: confirm whether `QuranComApiClient` (public, unauthenticated, `api.quran.com`) or `QuranApiService` (authenticated, Quran Foundation) is the source of record going forward, and consolidate — the current duplicated 30-entry juz table in both should not survive this phase as two copies.
4. Migrations must not break existing rows — plan a backfill step for existing `quran_tracking`/`quran_homework` data, following the pattern already used by `quran:backfill-pages`.

**School ID note:** schema changes only, no new tables introduced yet — confirm migrations don't touch tenant scoping.

**Phase completion report must state:** the fractional-page decision and why; which API integration is the source of record and what happened to the other; backfill results.

---

## Phase 3 — Arabic text rendering (Uthmani script)

**Goal:** Arabic verse text is actually fetched and rendered, not discarded (audit §10 — currently fetched and thrown away in one place, unreachable in the other).

**Skills:** `test-driven-development`.

**Work:**
1. Using the integration confirmed as source-of-record in Phase 2, wire up real verse-text fetching (`text_uthmani`) to at least one view.
2. Decide caching strategy (this data doesn't change — cache aggressively, similar to the existing 24h juz-range cache pattern).
3. This phase does not need to solve page-image-vs-reconstructed-layout (that's a separate, larger redesign per audit item #2, explicitly out of scope unless you decide otherwise later) — it targets displaying Arabic text somewhere real (e.g. a verse detail view), building the foundation reconstructed layout would need anyway.

**School ID note:** Arabic text is shared reference content, not school-scoped data — confirm no accidental school-scoping is added to what is legitimately global content.

---

## Phase 4 — Assignments with partial-page precision

**Goal:** `QuranHomework` (and/or `QuranSchedule`) can represent "Surah Al-Baqarah, pages 1–2.5" using the Phase 2 schema.

**Skills:** `brainstorming` if the Phase 2 decision leaves open questions, `test-driven-development`.

**Work:**
1. Extend `QuranHomework` creation/edit to accept the fractional/verse-anchored range from Phase 2.
2. Update `QuranHomework::matchesTracking()` and `QuranTrackingObserver::autoCompleteHomework()` so auto-completion logic still works correctly against the new precision (currently matches on whole surah/verse equality — confirm this still behaves correctly, don't just assume).
3. Update Create/Edit React forms.

**School ID note:** `QuranHomework` is already scoped as of Phase 1 — confirm new fields don't bypass that scope (e.g. no raw queries that skip the global scope).

**Phase completion report must state:** confirmation the auto-complete matching logic was tested against the new precision, not just the UI.

---

## Phase 5 — Parent visibility of assignments

**Goal:** Guardians can actually reach their child's homework in-app (audit item #4 — route access exists, nav link and ownership check do not).

**Skills:** `test-driven-development`.

**Work:**
1. Add the missing "Homework" nav entry to the guardian submenu (`navigation.js`, and the mobile nav variants).
2. Fix `QuranHomeworkController`'s `show`/`student` actions to verify the homework/student actually belongs to that guardian's own child — this is a School ID *and* a parent-child ownership check, both are required, not just one.
3. This overlaps with Phase 1's `QuranHomeworkPolicy` — extend that policy rather than adding another inline check.

**School ID note:** two layers required here — tenant (School ID) and ownership (this guardian's own child) — state both explicitly in the completion report, since the audit flagged this exact feature as having neither today.

---

## Phase 6 — Teacher review/grading per page

**Goal:** Move grading from "tied to one tracking session" to something that can be pulled up and graded per completed page/assignment (audit item #7).

**Skills:** `brainstorming` (real design decision: does grading move to be `QuranHomework`-scoped, page-scoped, or does the session-based model stay and a new page-level rollup view get built on top?), `test-driven-development`.

**Work:**
1. Decide the grading unit and document why.
2. Migrate/extend `QuranAssessment` accordingly without breaking the existing session-based aggregate reporting (`studentReport()`).
3. Build the teacher-facing "completed pages for Student X, grade each" view described in the original requirement.

**School ID note:** `QuranAssessment` currently has no direct `school_id` — confirm it inherits scoping correctly through its `QuranTracking` relationship, or add scoping directly if the new structure needs it (e.g. if it becomes `QuranHomework`-linked instead of purely session-linked).

---

## Phase 7 — Circular/rotation group reading (halaqah)

**Goal:** New feature — genuinely absent today, no schema, no terminology in the codebase (audit item #6). This is the largest net-new phase.

**Skills:** `brainstorming` (mandatory — this is a multi-student, turn-taking construct with no existing pattern in the codebase to extend; needs real design before any code), `writing-plans`, `test-driven-development`, likely `dispatching-parallel-agents` given the size (schema + backend + frontend can plausibly split into parallel workstreams once the design is settled).

**Work (design questions to resolve in brainstorming before implementation starts):**
1. What's the session unit — a new `QuranHalaqahSession` model grouping N students with a sequenced turn order through a consecutive ayah range?
2. How does turn-taking state get recorded — per-student completion within the session, order, timestamps?
3. How does this interact with `QuranTracking` (does a halaqah session generate one `QuranTracking` row per participating student, or is it a fully separate model)?
4. Who can create/run a session — teacher only? Does a guardian ever see halaqah participation the way they see tracking history today?

**School ID note:** this is a brand-new table (or set of tables) — `BelongsToSchool` must be applied from the start, not retrofitted. State the scoping design explicitly in the brainstorming output before any migration is written.

**Phase completion report must state:** the design decisions from the brainstorming session and why, since this phase has no prior pattern in the codebase to point to as precedent.

---

## Phase 8 — Final verification pass

**Goal:** Confirm the whole module holds together — this is not a new feature phase, it's a checkpoint.

**Skills:** `verification-before-completion` (the whole point of this phase), `systematic-debugging` if anything surfaces.

**Work:**
1. Re-run School ID isolation tests across all 5 Quran models (including the 2 new ones from Phase 7) — every single-record route, not just index/create.
2. Confirm the two external API integrations situation from Phase 2 is actually consolidated, not left half-migrated.
3. Full regression pass against the test baseline built in Phase 1.
4. Produce a final summary diffing this plan's phases against what actually shipped, flagging any phase that changed scope mid-implementation.

---

## Phase completion report — required format

At the end of every phase, before moving to the next, Claude must produce a short report with:
- What changed (files, models, migrations)
- School ID enforcement statement (per rule 0.1)
- Verification evidence (actual test output / query results, per `verification-before-completion` — not a claim without evidence)
- Anything deferred or descoped, and why
- Confirmation nothing was committed or pushed (per rule 0.3)

The human reviews this report, runs their own review, and handles commit/push before the next phase starts.