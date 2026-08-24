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
        return in_array($user->role, ['admin', 'teacher', 'guardian']);
    }

    /**
     * Determine whether the user can view the schedule.
     *
     * Formalizes the controller's previous inline check: a teacher may only
     * view schedules they're assigned to; admins may view any in their school.
     */
    public function view(User $user, QuranSchedule $quranSchedule): bool
    {
        if ($user->school_id !== $quranSchedule->school_id) {
            return false;
        }

        if ($user->role === 'teacher') {
            return $quranSchedule->teacher_id === $user->id;
        }

        return in_array($user->role, ['admin', 'guardian']);
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
        if (! in_array($user->role, ['admin', 'teacher'])) {
            return false;
        }

        if ($user->role === 'admin') {
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
        if ($user->school_id !== $quranSchedule->school_id) {
            return false;
        }

        if ($user->role === 'teacher') {
            return $quranSchedule->teacher_id === $user->id;
        }

        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can delete the schedule.
     */
    public function delete(User $user, QuranSchedule $quranSchedule): bool
    {
        return $this->update($user, $quranSchedule);
    }
}
