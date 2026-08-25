

**Prompt for Claude Code:**

> Audit the current roles/permissions system. No code changes — this is audit + feasibility report only.
>
> **Part 1 — Document what exists today.**
> - What roles currently exist (teacher, guardian, admin, etc.) and how is role/permission checking implemented — a package (e.g. spatie/laravel-permission), a raw `role` column with hardcoded string checks, policies, gates, middleware, or some mix?
> - List every place in the codebase a role is checked — backend (middleware, controllers, policies, form requests) and frontend (Inertia shared props, conditional rendering in JSX, route guards). Full inventory, not a sample.
> - For each existing role, what can it currently access across these modules: Students, Teachers, Guardians, Users, Fees, Settings, Attendance, Grades, Subjects, Exams, Timetable, Reports, Documents.
>
> **Part 2 — Feasibility of adding a new "Head Teacher" role**, with this exact target permission matrix:
>
> | Module | Head Teacher access |
> |---|---|
> | Students | Read-only (no create/edit/delete) |
> | Teachers | Read-only |
> | Guardians | Read-only |
> | Users | No access |
> | Fees | No access |
> | Settings | No access |
> | Attendance | Full access (same as admin) |
> | Grades | Read-only |
> | Subjects | Read-only |
> | Exams | Full access (same as admin) |
> | Timetable | Read-only |
> | Reports | Full access (same as admin) |
> | Documents | Same access as every other role currently has (upload allowed; only Admin can approve/reject) |
>
> Report: is the current permission system granular enough (per-module, per-action) to express this matrix cleanly, or is it currently coarser (e.g. hardcoded "is admin" boolean checks) such that adding this role means retrofitting a more granular system first? Estimate complexity as low/medium/high with reasoning, and list every file/touchpoint from Part 1's inventory that would need a change to support this new role. Flag anything ambiguous or risky (e.g. shared components that assume only 2-3 roles exist, hardcoded role arrays, etc.).
>
> Guardian phone number visibility is explicitly out of scope — do not address it.
>
> **Write the full report to `reports/head-teacher-role-audit-report.md`**   Use a proper markdown table for the permission matrix and touchpoint list so it renders correctly when opened as a file. Do not implement anything yet — audit and report only.

