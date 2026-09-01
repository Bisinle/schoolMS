<?php

namespace App\Policies;

use App\Models\TimetableSlot;
use App\Models\User;

class TimetableSlotPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('timetable-slots.view');
    }

    public function view(User $user, TimetableSlot $timetableSlot): bool
    {
        if (! $user->can('timetable-slots.view')) {
            return false;
        }

        if ($user->isAdmin() || $user->isHeadTeacher()) {
            return true;
        }

        if ($user->isTeacher()) {
            // Teachers can view slots they're assigned to
            return $timetableSlot->teacher_id === $user->teacher->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->can('timetable-slots.manage');
    }

    /**
     * Determine whether the user can update the model.
     *
     * The previous teacher-can-edit-a-draft-template's-slots branch was
     * dropped here (2026-08-26, Phase 5) — confirmed dead: the update route
     * has always been role:admin-only (now permission:timetable-slots.manage,
     * admin-only per the taxonomy), so no teacher could ever reach an action
     * that checks this ability.
     */
    public function update(User $user, TimetableSlot $timetableSlot): bool
    {
        return $user->can('timetable-slots.manage');
    }

    public function delete(User $user, TimetableSlot $timetableSlot): bool
    {
        return $user->can('timetable-slots.manage');
    }

    public function restore(User $user, TimetableSlot $timetableSlot): bool
    {
        return $user->can('timetable-slots.manage');
    }

    public function forceDelete(User $user, TimetableSlot $timetableSlot): bool
    {
        return $user->can('timetable-slots.manage');
    }
}
