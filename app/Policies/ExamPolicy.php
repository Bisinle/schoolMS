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
        return in_array($user->role, ['admin', 'teacher']);
    }

    /**
     * Determine if the user can view a specific exam.
     */
    public function view(User $user, Exam $exam): bool
    {
        // Admins can view all exams
        if ($user->isAdmin()) {
            return true;
        }

        // Teachers can view exams for their assigned grades
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
        return $user->isAdmin() || $user->isTeacher();
    }

    /**
     * Determine if the user can update exams.
     */
    public function update(User $user, Exam $exam): bool
    {
        // Admins can update any exam
        if ($user->isAdmin()) {
            return true;
        }

        // Teachers can update exams for their assigned grades
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            return in_array($exam->grade_id, $teacherGradeIds);
        }

        return false;
    }

    /**
     * Determine if the user can delete exams.
     */
    public function delete(User $user, Exam $exam): bool
    {
        // Only admins can delete exams
        return $user->isAdmin();
    }
}