<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Exam;

class ExamPolicy
{
    /**
     * Determine if the user can view any exams.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('exams.view');
    }

    /**
     * Determine if the user can view a specific exam.
     */
    public function view(User $user, Exam $exam): bool
    {
        if (! $user->can('exams.view')) {
            return false;
        }

        if ($user->isAdmin() || $user->isHeadTeacher()) {
            return true;
        }

        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            return in_array($exam->grade_id, $teacherGradeIds);
        }

        return false;
    }

    /**
     * Determine if the user can create exams.
     */
    public function create(User $user): bool
    {
        return $user->can('exams.create');
    }

    /**
     * Determine if the user can update exams.
     *
     * Decision 1 (2026-08-26, resolving Phase 2 disagreement #1): teacher
     * gets scoped update access to exams they created themselves
     * (exams.created_by), rather than the previous admin-only restriction
     * that contradicted teacher already being allowed to create() them.
     */
    public function update(User $user, Exam $exam): bool
    {
        if (! $user->can('exams.update')) {
            return false;
        }

        if ($user->isAdmin() || $user->isHeadTeacher()) {
            return true;
        }

        return $exam->created_by === $user->id;
    }

    /**
     * Determine if the user can delete exams.
     */
    public function delete(User $user, Exam $exam): bool
    {
        return $user->can('exams.delete');
    }
}
