# Quran Module — Connected Workflow Redesign

**Status:** Proposed architecture change — audit and feasibility analysis required before any code changes.
**Relationship to existing plan:** This supersedes/merges the original Phase 4 (assignments), Phase 5 (parent visibility), and Phase 6 (teacher grading) from `docs/quran-module-restructure-plan.md`. Phases 1-3 (production fixes, structural units, Arabic text rendering) are foundational infrastructure this redesign builds on top of — nothing there is being discarded.

---

## 0. Why this document exists

The current implementation has three Quran features (`QuranTracking`, `QuranHomework`, `QuranHomePractice`, plus `QuranSchedule`) that exist as largely independent records with weak or missing connections between them. This document describes a **single connected workflow** where each stage is derived from or constrained by the previous one, rather than four features a teacher/guardian has to manually keep in sync themselves.

**Claude Code's task, in order:**
1. Document how the current module actually works today (models, relationships, what triggers what).
2. Compare that against the target workflow below.
3. Identify: what already exists and can be reused, what's partially there, what's wired incorrectly, what's fully missing.
4. Report findings and a proposed migration plan. **Do not write implementation code until this analysis is reviewed.**

---

## 1. Target workflow (the connected cycle)

```
Teacher creates a QURAN SCHEDULE for a student
   (From Surah, From Verse, To Surah, To Verse, Start date, End date —
    same input shape as today's QuranTracking create screen, just
    representing the overall target range/goal, not a single session)
        ↓
   Schedule does NOT auto-generate anything. It is a reference plan only.
        ↓
Teacher goes to the HOMEWORK section, selects a student who already
has a Schedule, and creates a HOMEWORK entry for today/this period.
   - This screen is the CURRENT QuranTracking/Create.jsx, renamed.
   - "From Surah / From Verse" is NOT freely chosen by the teacher —
     it is pre-populated from the Schedule's starting point (for the
     first homework) or from wherever the previous Homework entry for
     this student left off (for subsequent homework).
   - The teacher only picks "To Surah / To Verse" for this assignment.
        ↓
Guardian's HOME PRACTICE tab shows this Homework entry.
   - Guardian clicks it to view details: From Surah/Verse → To Surah/Verse.
   - Plus history of previous homework entries.
        ↓
Student studies at home, returns to class the next day.
        ↓
Teacher opens THAT SAME Homework entry and GRADES it.
   - This is "Tracking" — but only as a grading action, not a new record.
   - No new record is created. Stars/comments/assessment level (or
     Absent/Missed) are recorded directly against the existing Homework entry.
        ↓
Grade rolls into PROGRESS against the original Schedule.
```

**The core principle:** Schedule is a simple, manually-defined plan (not a generator). Homework is where the real day-to-day assignment work happens, chained to the Schedule's starting point so it can't drift from it. Tracking is not a thing you create — it's what happens when you grade a Homework entry that already exists.

---

## 2. Entity-by-entity target definition

### 2.1 Quran Schedule (simple — do not overbuild this)
- Belongs to one student.
- Fields: From Surah, From Verse, To Surah, To Verse, Start date, End date — the same shape as today's `QuranTracking` create form, just representing the whole target range and a timeframe rather than one session.
- System calculates and stores derived values using the existing verse→page mapping (Phase 2/3 infrastructure): starting page, ending page, total pages covered.
- Does **not** generate Homework automatically. It exists purely as the reference target a teacher consults/is constrained by when creating Homework for that student.
- Displays status (on schedule / ahead / behind) computed from actual graded Homework progress against this plan.

### 2.2 Quran Homework (replaces current `QuranTracking` create flow AND replaces current `QuranHomework` model entirely)
- **The current `QuranHomework` model is deleted** — its role is fully replaced by this redesigned entity.
- **The current `QuranTracking` create screen becomes the Homework create screen** — same fields, same page-preview UI, same everything the user already likes about it. It is being renamed and re-purposed, not rebuilt.
- A Homework entry belongs to a student who must already have an active Schedule — creation should be blocked or clearly guided if no Schedule exists yet.
- **From Surah/From Verse are constrained, not freely chosen:**
  - First Homework entry for a Schedule: From Surah/Verse = the Schedule's From Surah/Verse.
  - Every subsequent Homework entry: From Surah/Verse = wherever the previous Homework entry for this student left off (its To Surah/Verse).
  - The teacher only selects To Surah/Verse for each new entry.
- Each Homework entry must be traceable back to its parent Schedule (real foreign key).

### 2.3 Guardian Home Practice
- **Not a new model, and not the existing `QuranHomePractice` self-logging model** — this is a guardian-facing *read view* into the student's Homework entries (assigned by the teacher), plus history.
- **Open question for the audit:** the existing `QuranHomePractice` model represents guardians *self-logging* their own practice sessions, independent of anything teacher-assigned. Determine whether that capability still has a place alongside this new "view assigned homework" concept, or whether it's being replaced. Surface this explicitly — don't assume either answer.

### 2.4 Tracking = Grading (not a creation flow)
- **There is no independent "create a new tracking session" action.** The current standalone Tracking creation entry point goes away.
- Grading means: teacher opens an existing Homework entry and records an assessment against it directly — quality rating (e.g. Excellent / Very Good / Moderate / Poor / Not Prepared), optional star rating, comments, mistake notes. Whatever `QuranAssessment` already provides should be reused here, re-anchored to Homework instead of to a Tracking session.
- **Absent/Missed is a first-class, gradable status**, not something that leaves a gap in the data. If a student doesn't attend on a day the Schedule expected work, the Homework entry for that period should still exist and be explicitly marked Absent/Missed — this must count against schedule progress.

### 2.5 Progress
- Rolls up from graded Homework entries back to the parent Schedule.
- Shows what's actually been completed vs. what the Schedule's timeframe expected by now, and surfaces behind/on-track/ahead status.
- Missed or poorly-graded days visibly affect this calculation.

---

## 3. What must be preserved from existing work

This redesign changes how Homework/Tracking/Grading are created and connected — it does not invalidate the underlying Quran data infrastructure already built:

- Structural unit data (`juz_from/to`, `hizb_from/to`, `rub_from/to`, `page_from/to`, `verse_from/to`) and the verse→page/juz/hizb/rub mapping from Phase 2.
- Live Arabic text rendering (`text_qpc_hafs`, the `UthmanicHafs` font pairing, `getPageVerses()`) from Phase 3.
- `QuranComApiClient` as the sole external data source.
- School ID enforcement patterns (`BelongsToSchool`, the Policies added in Phase 1) — every entity here, especially the redesigned Homework and Schedule, must carry this forward. State explicitly how School ID is enforced on any new/changed table.

---

## 4. Explicit deletions/renames to confirm during the audit, not assume

- **Delete `QuranHomework` (current model) entirely.** Determine whether any existing data is worth a one-time backfill into the new Homework entity, or whether starting fresh is acceptable given the module's maturity — report this as a decision point, don't assume either way.
- **Rename `QuranTracking` → the new Homework entity.** Its create screen, fields, and page-preview UI are being renamed and re-purposed, not discarded.
- **Remove the standalone "create a new Tracking session" entry point entirely.** What remains is: create Homework (chained to Schedule) → grade that same Homework entry later. There is no separate Tracking creation form anymore.
- Determine what happens to the `QuranTrackingObserver`'s auto-computation logic (Juz/Hizb/Rub/page derivation) — still needed, just needs to run on Homework creation instead of Tracking creation.
- Determine what happens to existing `QuranSchedule` data, since its target model is changing from a recurring pace target (`target_pages_per_period`) to a concrete From/To range + date model.

---

## 5. Audit deliverable — what Claude Code should report back

1. Current-state map: how `QuranSchedule`, `QuranHomework`, `QuranHomePractice`, `QuranTracking`, and `QuranAssessment` actually relate today (or don't).
2. Gap analysis against §1-§4 above: reusable as-is / needs modification / needs deletion / missing entirely.
3. A proposed migration plan (schema changes, what gets deleted, what data if any needs backfilling) — no code yet.
4. Explicit resolution (or a clearly flagged open question back to the user) on the `QuranHomePractice` ambiguity in §2.3.
5. Confirmation this is feasible with current infrastructure, or a clear statement of what's blocking it.

---

## 6. The whole flow in ten lines

1. Teacher creates a Schedule for a student: From Surah/Verse → To Surah/Verse, Start date → End date — a simple plan, nothing auto-generated from it.
2. Teacher goes to Homework, picks a student who has a Schedule, and creates a Homework entry — this screen is today's Tracking creation screen, renamed.
3. The Homework entry's From Surah/Verse is locked to the Schedule's start (first entry) or the previous Homework entry's end (later entries) — the teacher only picks where this assignment ends.
4. Guardian sees that Homework entry in Home Practice — what to study, plus history.
5. Student studies at home, returns to class.
6. Teacher opens that same Homework entry — no new record is created.
7. Teacher grades it directly: quality rating, stars, comments — or marks it Absent/Missed.
8. That grade updates the student's Progress against the original Schedule.
9. Missed or poor days visibly push the student behind; strong days keep them on or ahead of pace.
10. Everything chains back to one Schedule — Schedule, Homework, and Grading are one continuous record trail, not three disconnected features.