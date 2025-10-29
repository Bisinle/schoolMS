<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Guardian;

class GuardianPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'teacher']);
    }

    public function view(User $user, Guardian $guardian): bool
    {
        if ($user->isAdmin() || $user->isTeacher()) {
            return true;
        }

        if ($user->isGuardian()) {
            return $user->guardian && $user->guardian->id === $guardian->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Guardian $guardian): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Guardian $guardian): bool
    {
        return $user->isAdmin();
    }
}