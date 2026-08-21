<?php

namespace App\Policies;

use App\Models\QuranHomework;
use App\Models\User;

class QuranHomeworkPolicy
{
    /**
     * Determine whether the user can view any homework assignments.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher', 'guardian']);
    }

    /**
     * Determine whether the user can view the homework assignment.
     */
    public function view(User $user, QuranHomework $quranHomework): bool
    {
        return $user->school_id === $quranHomework->school_id
            && in_array($user->role, ['admin', 'teacher', 'guardian']);
    }

    /**
     * Determine whether the user can create homework assignments.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher']);
    }

    /**
     * Determine whether the user can update the homework assignment.
     */
    public function update(User $user, QuranHomework $quranHomework): bool
    {
        return $user->school_id === $quranHomework->school_id
            && in_array($user->role, ['admin', 'teacher']);
    }

    /**
     * Determine whether the user can delete the homework assignment.
     */
    public function delete(User $user, QuranHomework $quranHomework): bool
    {
        return $user->school_id === $quranHomework->school_id
            && in_array($user->role, ['admin', 'teacher']);
    }
}
