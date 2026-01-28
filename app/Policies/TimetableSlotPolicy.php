<?php

namespace App\Policies;

use App\Models\TimetableSlot;
use App\Models\User;

class TimetableSlotPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, TimetableSlot $timetableSlot): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isTeacher()) {
            // Teachers can view slots they're assigned to
            return $timetableSlot->teacher_id === $user->teacher->id;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, TimetableSlot $timetableSlot): bool
    {
        // Admins can update slots even when published
        // Teachers can only update slots in draft templates
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isTeacher()) {
            return $timetableSlot->timetableTemplate->isDraft();
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, TimetableSlot $timetableSlot): bool
    {
        // Admins can delete slots even when published
        // Teachers cannot delete slots
        if ($user->isAdmin()) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, TimetableSlot $timetableSlot): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, TimetableSlot $timetableSlot): bool
    {
        return $user->isAdmin();
    }
}
