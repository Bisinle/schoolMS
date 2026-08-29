<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Grade;

class GradePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('grades.view');
    }

    public function view(User $user, Grade $grade): bool
    {
        if (! $user->can('grades.view')) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isTeacher()) {
            // Teacher can view grades they're assigned to
            return $user->teacher->grades()->where('grades.id', $grade->id)->exists();
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->can('grades.create');
    }

    public function update(User $user, Grade $grade): bool
    {
        return $user->can('grades.update');
    }

    public function delete(User $user, Grade $grade): bool
    {
        return $user->can('grades.delete');
    }
}
