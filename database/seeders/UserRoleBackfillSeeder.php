<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Phase 5 of the Spatie migration (docs/spatie-migration-worksheet.md):
 * assigns every existing user to the Spatie role matching their current
 * `role` string column. This is a pure backfill — it does not touch the
 * `role` column itself, and does not grant or remove any capability by
 * itself, since nothing yet consults `$user->can(...)`/`hasRole(...)` at
 * runtime until the Policy/middleware rewrites in this same phase land.
 *
 * Idempotent: syncRoles() replaces a user's role set with exactly the one
 * matching their `role` column, safe to re-run (e.g. after seeding fresh
 * fake users in local dev) without creating duplicate model_has_roles rows.
 */
class UserRoleBackfillSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->chunkById(200, function ($users) {
            foreach ($users as $user) {
                if (! $user->role) {
                    continue;
                }

                $user->syncRoles([$user->role]);
            }
        });
    }
}
