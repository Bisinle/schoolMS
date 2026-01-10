<?php

namespace App\Policies;

use App\Models\Stream;
use App\Models\User;

class StreamPolicy
{
    /**
     * Determine whether the user can view any streams.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can view the stream.
     */
    public function view(User $user, Stream $stream): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can create streams.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can update the stream.
     */
    public function update(User $user, Stream $stream): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the stream.
     */
    public function delete(User $user, Stream $stream): bool
    {
        return $user->isAdmin();
    }
}
