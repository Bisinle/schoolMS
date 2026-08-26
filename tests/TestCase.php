<?php

namespace Tests;

use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Phase 5 of the Spatie migration: every route/Policy now checks real
     * Spatie permissions, so the 90 permissions / 4 roles from
     * RolePermissionSeeder must exist in the test database too, not just
     * the real one. RefreshDatabase runs this once per test run (after the
     * initial migrate:fresh), then each test's own transaction rolls back
     * to this seeded baseline — cheap, not re-seeded per test.
     */
    protected $seed = true;

    protected $seeder = RolePermissionSeeder::class;
}
