<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Teacher;

class TeacherPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, Teacher $teacher): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Teacher $teacher): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Teacher $teacher): bool
    {
        return $user->isAdmin();
    }
}