<?php

namespace App\Observers;

use App\Models\User;

/**
 * Phase 5 of the Spatie migration (docs/spatie-migration-worksheet.md):
 * keeps a user's Spatie role in sync with their `role` string column,
 * which stays the source of truth (nothing in this migration removes or
 * stops writing that column). Without this, every place that creates or
 * changes a user — controllers, factories, seeders — would need to
 * remember to call assignRole() itself, and any that forgot would leave
 * that user permission-less despite having a valid `role` value.
 */
class UserObserver
{
    public function created(User $user): void
    {
        $this->syncRole($user);
    }

    public function updated(User $user): void
    {
        if ($user->wasChanged('role')) {
            $this->syncRole($user);
        }
    }

    private function syncRole(User $user): void
    {
        if ($user->role) {
            $user->syncRoles([$user->role]);
        }
    }
}
