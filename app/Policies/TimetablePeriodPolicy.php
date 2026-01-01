<?php

namespace App\Policies;

use App\Models\TimetablePeriod;
use App\Models\User;

class TimetablePeriodPolicy
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
    public function view(User $user, TimetablePeriod $timetablePeriod): bool
    {
        return in_array($user->role, ['admin', 'teacher']);
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
    public function update(User $user, TimetablePeriod $timetablePeriod): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, TimetablePeriod $timetablePeriod): bool
    {
        // Can only delete if not used in any timetable slots
        if (!$user->isAdmin()) {
            return false;
        }

        return !$timetablePeriod->slots()->exists();
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, TimetablePeriod $timetablePeriod): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, TimetablePeriod $timetablePeriod): bool
    {
        return $user->isAdmin();
    }
}
