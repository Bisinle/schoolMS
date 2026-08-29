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
        return $user->can('attendance.view');
    }

    /**
     * Determine if the user can view a specific attendance record.
     *
     * Not currently reached by any $this->authorize() call in
     * AttendanceController (confirmed 2026-08-26, Phase 5) — kept in sync
     * with the permission model anyway, in case something starts consulting
     * it later.
     */
    public function view(User $user, Attendance $attendance): bool
    {
        if ($user->isAdmin()) {
            return $user->can('attendance.view');
        }

        if ($user->isTeacher()) {
            if (! $user->can('attendance.view')) {
                return false;
            }
            $teacherGradeIds = $user->teacher->grades->pluck('id')->toArray();
            return in_array($attendance->grade_id, $teacherGradeIds);
        }

        if ($user->isGuardian()) {
            if (! $user->can('attendance.view-own-children')) {
                return false;
            }
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
        return $user->can('attendance.create');
    }

    /**
     * Determine if the user can update attendance records.
     */
    public function update(User $user, Attendance $attendance): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isTeacher() && $user->can('attendance.create')) {
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
        return $user->can('attendance.delete');
    }
}
