<?php

namespace App\Policies;

use App\Models\Room;
use App\Models\User;

class RoomPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('timetable-rooms.view');
    }

    public function view(User $user, Room $room): bool
    {
        return $user->can('timetable-rooms.view');
    }

    public function create(User $user): bool
    {
        return $user->can('timetable-rooms.manage');
    }

    public function update(User $user, Room $room): bool
    {
        return $user->can('timetable-rooms.manage');
    }

    public function delete(User $user, Room $room): bool
    {
        // Can only delete if not used in any timetable slots
        if (! $user->can('timetable-rooms.manage')) {
            return false;
        }

        return ! $room->slots()->exists();
    }

    public function restore(User $user, Room $room): bool
    {
        return $user->can('timetable-rooms.manage');
    }

    public function forceDelete(User $user, Room $room): bool
    {
        return $user->can('timetable-rooms.manage');
    }
}
