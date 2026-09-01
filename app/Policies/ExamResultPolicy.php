<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ExamResult;

class ExamResultPolicy
{
    /**
     * Determine if the user can view any exam results.
     *
     * Guardian dropped here (2026-08-26, Phase 5) per the decision on Phase 2
     * disagreement #3: guardian's grant here was dead code (no route ever
     * reached it — guardians see results via the separate Reports module).
     */
    public function viewAny(User $user): bool
    {
        return $user->can('exam-results.view');
    }

    /**
     * Determine if the user can view a specific exam result.
     */
    public function view(User $user, ExamResult $examResult): bool
    {
        if (! $user->can('exam-results.view')) {
            return false;
        }

        if ($user->isAdmin() || $user->isHeadTeacher()) {
            return true;
        }

        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            return in_array($examResult->exam->grade_id, $teacherGradeIds);
        }

        return false;
    }

    /**
     * Determine if the user can create exam results.
     */
    public function create(User $user): bool
    {
        return $user->can('exam-results.create');
    }

    /**
     * Determine if the user can update exam results.
     */
    public function update(User $user, ExamResult $examResult): bool
    {
        if (! $user->can('exam-results.update')) {
            return false;
        }

        if ($user->isAdmin() || $user->isHeadTeacher()) {
            return true;
        }

        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            return in_array($examResult->exam->grade_id, $teacherGradeIds);
        }

        return false;
    }

    /**
     * Determine if the user can delete exam results.
     */
    public function delete(User $user, ExamResult $examResult): bool
    {
        return $user->can('exam-results.delete');
    }
}
