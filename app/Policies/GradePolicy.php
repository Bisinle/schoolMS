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

        if ($user->isAdmin() || $user->isHeadTeacher()) {
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

    /**
     * Curriculum mapping is a narrower carve-out than general grade
     * editing — Head Teacher gets this without grades.update (which also
     * gates Edit Grade, delete/restore, and teacher assignment).
     */
    public function manageCurriculum(User $user, Grade $grade): bool
    {
        return $user->can('grades.update') || $user->can('grades.manage-curriculum');
    }

    public function delete(User $user, Grade $grade): bool
    {
        return $user->can('grades.delete');
    }
}
