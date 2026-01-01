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
        // Only admins can update, and only if the template is in draft status
        return $user->isAdmin() && $timetableSlot->timetableTemplate->isDraft();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, TimetableSlot $timetableSlot): bool
    {
        // Only admins can delete, and only if the template is in draft status
        return $user->isAdmin() && $timetableSlot->timetableTemplate->isDraft();
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
