<?php

namespace App\Policies;

use App\Models\Attendance;
use App\Models\User;

class AttendancePolicy
{
    /**
     * Determine if the user can view any attendance records.
     */
    public function viewAny(User $user): bool
    {
        // Admins and teachers can view attendance
        return $user->isAdmin() || $user->isTeacher();
    }

    /**
     * Determine if the user can view a specific attendance record.
     */
    public function view(User $user, Attendance $attendance): bool
    {
        // Admins can view all
        if ($user->isAdmin()) {
            return true;
        }

        // Teachers can view attendance for their assigned grades
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            return in_array($attendance->grade_id, $teacherGradeIds);
        }

        // Guardians can view their own children's attendance
        if ($user->isGuardian()) {
            $childrenIds = $user->guardian->students->pluck('id')->toArray();
            return in_array($attendance->student_id, $childrenIds);
        }

        return false;
    }

    /**
     * Determine if the user can create attendance records.
     */
    public function create(User $user): bool
    {
        // Only admins and teachers can mark attendance
        return $user->isAdmin() || $user->isTeacher();
    }

    /**
     * Determine if the user can update attendance records.
     */
    public function update(User $user, Attendance $attendance): bool
    {
        // Admins can update any attendance
        if ($user->isAdmin()) {
            return true;
        }

        // Teachers can update attendance for their assigned grades
        if ($user->isTeacher()) {
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            return in_array($attendance->grade_id, $teacherGradeIds);
        }

        return false;
    }

    /**
     * Determine if the user can delete attendance records.
     */
    public function delete(User $user, Attendance $attendance): bool
    {
        // Only admins can delete attendance records
        return $user->isAdmin();
    }
}