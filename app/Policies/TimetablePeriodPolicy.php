<?php

namespace App\Policies;

use App\Models\TimetablePeriod;
use App\Models\User;

class TimetablePeriodPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('timetable-periods.view');
    }

    public function view(User $user, TimetablePeriod $timetablePeriod): bool
    {
        return $user->can('timetable-periods.view');
    }

    public function create(User $user): bool
    {
        return $user->can('timetable-periods.manage');
    }

    public function update(User $user, TimetablePeriod $timetablePeriod): bool
    {
        return $user->can('timetable-periods.manage');
    }

    public function delete(User $user, TimetablePeriod $timetablePeriod): bool
    {
        // Can only delete if not used in any timetable slots
        if (! $user->can('timetable-periods.manage')) {
            return false;
        }

        return ! $timetablePeriod->slots()->exists();
    }

    public function restore(User $user, TimetablePeriod $timetablePeriod): bool
    {
        return $user->can('timetable-periods.manage');
    }

    public function forceDelete(User $user, TimetablePeriod $timetablePeriod): bool
    {
        return $user->can('timetable-periods.manage');
    }
}
