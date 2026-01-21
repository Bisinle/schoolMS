<?php

namespace App\Policies;

use App\Models\Policy;
use App\Models\User;

class PolicyPolicy
{
    /**
     * Determine whether the user can view any policies.
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view policies
        return true;
    }

    /**
     * Determine whether the user can view the policy.
     */
    public function view(User $user, Policy $policy): bool
    {
        // Users can view policies from their school
        return $user->school_id === $policy->school_id;
    }

    /**
     * Determine whether the user can create policies.
     */
    public function create(User $user): bool
    {
        // Only admins can create policies
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can update the policy.
     */
    public function update(User $user, Policy $policy): bool
    {
        // Only admins from the same school can update
        return $user->role === 'admin' && $user->school_id === $policy->school_id;
    }

    /**
     * Determine whether the user can delete the policy.
     */
    public function delete(User $user, Policy $policy): bool
    {
        // Only admins from the same school can delete
        // Cannot delete published policies
        return $user->role === 'admin' 
            && $user->school_id === $policy->school_id
            && $policy->status !== 'published';
    }

    /**
     * Determine whether the user can publish the policy.
     */
    public function publish(User $user, Policy $policy): bool
    {
        // Only admins from the same school can publish
        return $user->role === 'admin' && $user->school_id === $policy->school_id;
    }

    /**
     * Determine whether the user can acknowledge the policy.
     */
    public function acknowledge(User $user, Policy $policy): bool
    {
        // Users from the same school can acknowledge published policies
        return $user->school_id === $policy->school_id 
            && $policy->status === 'published'
            && $policy->requires_acknowledgment;
    }
}

