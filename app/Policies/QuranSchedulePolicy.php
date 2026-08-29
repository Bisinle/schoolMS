<?php

namespace App\Policies;

use App\Models\QuranSchedule;
use App\Models\Student;
use App\Models\User;

class QuranSchedulePolicy
{
    /**
     * Determine whether the user can view any schedules.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('quran-schedule.view-all') || $user->can('quran-schedule.view');
    }

    /**
     * Determine whether the user can view the schedule.
     *
     * Formalizes the controller's previous inline check: a teacher may only
     * view schedules they're assigned to; admins may view any in their school.
     *
     * Guardian scoping (2026-08-26 security fix): previously any guardian
     * could view any schedule in the school by ID (no ownership check at
     * all). Scoped to the guardian's own children via
     * Guardian::allStudents(), the same merged legacy-column + pivot lookup
     * already used for guardian scoping elsewhere in this module (see
     * QuranController::guardianStats() and QuranHomeworkController's inline
     * guardian checks).
     */
    public function view(User $user, QuranSchedule $quranSchedule): bool
    {
        if (! $user->can('quran-schedule.view') || $user->school_id !== $quranSchedule->school_id) {
            return false;
        }

        if ($user->isTeacher()) {
            return $quranSchedule->teacher_id === $user->id;
        }

        if ($user->isGuardian()) {
            return $user->guardian
                && $user->guardian->allStudents()->where('id', $quranSchedule->student_id)->exists();
        }

        return $user->isAdmin();
    }

    /**
     * Determine whether the user can create schedules.
     *
     * A teacher may only create for a student in a grade they're assigned
     * to via grade_teacher; an admin may create for any student in the
     * school (the controller's own student_id validation already scopes to
     * the school). This is grade-scoping only — see the same note on
     * QuranHomeworkPolicy::create().
     */
    public function create(User $user, ?Student $student = null): bool
    {
        if (! $user->can('quran-schedule.create')) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        if (! $student || ! $user->teacher) {
            return false;
        }

        return $user->teacher->grades->contains('id', $student->grade_id);
    }

    /**
     * Determine whether the user can update the schedule.
     */
    public function update(User $user, QuranSchedule $quranSchedule): bool
    {
        if (! $user->can('quran-schedule.update') || $user->school_id !== $quranSchedule->school_id) {
            return false;
        }

        if ($user->isTeacher()) {
            return $quranSchedule->teacher_id === $user->id;
        }

        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the schedule.
     */
    public function delete(User $user, QuranSchedule $quranSchedule): bool
    {
        return $this->update($user, $quranSchedule);
    }
}
