<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ReportComment;

class ReportCommentPolicy
{
    /**
     * Determine if the user can view any report comments.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher', 'guardian']);
    }

    /**
     * Determine if the user can view a specific report comment.
     */
    public function view(User $user, ReportComment $reportComment): bool
    {
        // Admins can view all comments
        if ($user->isAdmin()) {
            return true;
        }

        // Teachers can view comments for their assigned grades
        if ($user->isTeacher()) {
            $student = $reportComment->student;
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            return in_array($student->grade_id, $teacherGradeIds);
        }

        // Guardians can view their children's comments
        if ($user->isGuardian()) {
            $childrenIds = $user->guardian->students->pluck('id')->toArray();
            return in_array($reportComment->student_id, $childrenIds);
        }

        return false;
    }

    /**
     * Determine if the user can create report comments.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isTeacher();
    }

    /**
     * Determine if the user can update report comments.
     */
    public function update(User $user, ReportComment $reportComment): bool
    {
        // Admins can always update
        if ($user->isAdmin()) {
            return true;
        }

        // Teachers can update if not locked
        if ($user->isTeacher()) {
            return $reportComment->canEditTeacherComment($user);
        }

        return false;
    }

    /**
     * Determine if the user can delete report comments.
     */
    public function delete(User $user, ReportComment $reportComment): bool
    {
        // Only admins can delete comments
        return $user->isAdmin();
    }

    /**
     * Determine if the user can lock/unlock comments.
     */
    public function manageLock(User $user, ReportComment $reportComment): bool
    {
        return $user->isAdmin();
    }
}