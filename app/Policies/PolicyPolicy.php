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
        return $user->can('policies.view');
    }

    /**
     * Determine whether the user can view the policy.
     */
    public function view(User $user, Policy $policy): bool
    {
        // Users can view policies from their school
        return $user->can('policies.view') && $user->school_id === $policy->school_id;
    }

    /**
     * Determine whether the user can create policies.
     */
    public function create(User $user): bool
    {
        return $user->can('policies.manage');
    }

    /**
     * Determine whether the user can update the policy.
     */
    public function update(User $user, Policy $policy): bool
    {
        return $user->can('policies.manage') && $user->school_id === $policy->school_id;
    }

    /**
     * Determine whether the user can delete the policy.
     *
     * Cannot delete published policies.
     */
    public function delete(User $user, Policy $policy): bool
    {
        return $user->can('policies.manage')
            && $user->school_id === $policy->school_id
            && $policy->status !== 'published';
    }

    /**
     * Determine whether the user can publish the policy.
     */
    public function publish(User $user, Policy $policy): bool
    {
        return $user->can('policies.manage') && $user->school_id === $policy->school_id;
    }

    /**
     * Determine whether the user can acknowledge the policy.
     */
    public function acknowledge(User $user, Policy $policy): bool
    {
        return $user->can('policies.acknowledge')
            && $user->school_id === $policy->school_id
            && $policy->status === 'published'
            && $policy->requires_acknowledgment;
    }
}
