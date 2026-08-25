# Spatie Permission Migration — Worksheet

Tracking document for the role cleanup + `spatie/laravel-permission` migration.
Branched off `one-db` (confirmed production deploy branch) as `feature/spatie-permissions`.

Each phase gets its own commit(s) and a stop-for-review checkpoint. This file is
updated at every checkpoint so it stays the single source of truth for where the
migration currently stands.

---

## Phase checklist

- [x] **Phase 0** — Branch + worksheet skeleton
- [ ] **Phase 1** — Role cleanup: delete `accountant, receptionist, nurse, it_staff, maid, cook`
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

*(Nothing logged yet — this section fills in as phases progress. Anything that
looks like a pre-existing bug or a disagreement between enforcement layers goes
here rather than being silently fixed or silently preserved.)*

---

## Phase log

### Phase 0 — Setup
- Confirmed production deploy branch: `one-db` (per your earlier confirmation in this
  session, re-confirmed rather than assumed here).
- Branched `feature/spatie-permissions` off `one-db`.
- Created this worksheet.
