<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ExamResult;

class ExamResultPolicy
{
    /**
     * Determine if the user can view any exam results.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher', 'guardian']);
    }

    /**
     * Determine if the user can view a specific exam result.
     */
    public function view(User $user, ExamResult $examResult): bool
    {
        // Admins can view all results
        if ($user->isAdmin()) {
            return true;
        }

        // Teachers can view results for their assigned grades
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            return in_array($examResult->exam->grade_id, $teacherGradeIds);
        }

        // Guardians can view their children's results
        if ($user->isGuardian()) {
            $childrenIds = $user->guardian->students->pluck('id')->toArray();
            return in_array($examResult->student_id, $childrenIds);
        }

        return false;
    }

    /**
     * Determine if the user can create exam results.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }

    /**
     * Determine if the user can update exam results.
     */
    public function update(User $user, ExamResult $examResult): bool
    {
        // Admins can update any result
        if ($user->isAdmin()) {
            return true;
        }

        // Teachers can update results for their assigned grades
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
        // Only admins can delete results
        return $user->isAdmin();
    }
}