<?php

namespace App\Policies;

use App\Models\QuranHomePractice;
use App\Models\User;

class QuranHomePracticePolicy
{
    /**
     * Determine whether the user can view any home-practice logs.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher', 'guardian']);
    }

    /**
     * Determine whether the user can view the home-practice log.
     *
     * Formalizes the controller's previous inline check: a guardian may only
     * view their own logs; admins/teachers may view any in their school.
     */
    public function view(User $user, QuranHomePractice $quranHomePractice): bool
    {
        if ($user->school_id !== $quranHomePractice->school_id) {
            return false;
        }

        if ($user->role === 'guardian') {
            return $user->guardian && $quranHomePractice->guardian_id === $user->guardian->id;
        }

        return in_array($user->role, ['admin', 'teacher']);
    }

    /**
     * Determine whether the user can create home-practice logs.
     */
    public function create(User $user): bool
    {
        return $user->role === 'guardian';
    }

    /**
     * Determine whether the user can update the home-practice log.
     */
    public function update(User $user, QuranHomePractice $quranHomePractice): bool
    {
        return $user->school_id === $quranHomePractice->school_id
            && $user->role === 'guardian'
            && $user->guardian
            && $quranHomePractice->guardian_id === $user->guardian->id;
    }

    /**
     * Determine whether the user can delete the home-practice log.
     */
    public function delete(User $user, QuranHomePractice $quranHomePractice): bool
    {
        return $this->update($user, $quranHomePractice);
    }
}
