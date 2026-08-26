<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Subject;

class SubjectPolicy
{
    /**
     * Determine if the user can view any subjects.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('subjects.view');
    }

    /**
     * Determine if the user can view a specific subject.
     */
    public function view(User $user, Subject $subject): bool
    {
        return $user->can('subjects.view');
    }

    /**
     * Determine if the user can create subjects.
     */
    public function create(User $user): bool
    {
        return $user->can('subjects.create');
    }

    /**
     * Determine if the user can update subjects.
     */
    public function update(User $user, Subject $subject): bool
    {
        return $user->can('subjects.update');
    }

    /**
     * Determine if the user can delete subjects.
     */
    public function delete(User $user, Subject $subject): bool
    {
        return $user->can('subjects.delete');
    }
}
