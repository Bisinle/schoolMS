<?php

namespace App\Policies;

use App\Models\QuranHomework;
use App\Models\Student;
use App\Models\User;

class QuranHomeworkPolicy
{
    /**
     * Determine whether the user can view any homework assignments.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher', 'guardian']);
    }

    /**
     * Determine whether the user can view the homework assignment.
     */
    public function view(User $user, QuranHomework $quranHomework): bool
    {
        return $user->school_id === $quranHomework->school_id
            && in_array($user->role, ['admin', 'teacher', 'guardian']);
    }

    /**
     * Determine whether the user can create homework assignments.
     *
     * A teacher may only create for a student in a grade they're assigned
     * to via grade_teacher; an admin may create for any student in the
     * school (the controller's own student_id validation already scopes to
     * the school). This is grade-scoping only — it does not attempt to
     * answer whether the teacher specifically teaches Quran, which the
     * current schema can't yet express (see docs/quran-teacher-subject-grade-audit.md).
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
     * Determine whether the user can update the homework assignment.
     *
     * Teacher scoping (2026-08-26 decision): previously any teacher at the
     * school could update any other teacher's homework record. Scoped to
     * teacher_id, the same ownership column QuranSchedulePolicy::update()
     * already uses — also covers the controller's grade() and
     * markUngraded() actions, which both authorize against 'update' rather
     * than a separate ability.
     */
    public function update(User $user, QuranHomework $quranHomework): bool
    {
        if ($user->school_id !== $quranHomework->school_id) {
            return false;
        }

        if ($user->role === 'teacher') {
            return $quranHomework->teacher_id === $user->id;
        }

        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can delete the homework assignment.
     *
     * Same teacher scoping as update() — see note there.
     */
    public function delete(User $user, QuranHomework $quranHomework): bool
    {
        return $this->update($user, $quranHomework);
    }
}
