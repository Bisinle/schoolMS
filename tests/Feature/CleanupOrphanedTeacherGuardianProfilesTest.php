<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\School;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Coverage for the `profiles:cleanup-orphaned` artisan command, added
 * alongside the TimetableComplianceService null-guard fix to let orphaned
 * teacher/guardian rows already sitting in a database be found and repaired
 * without a fresh 500 report per one.
 */
class CleanupOrphanedTeacherGuardianProfilesTest extends TestCase
{
    use RefreshDatabase;

    public function test_dry_run_reports_orphans_without_deleting_them(): void
    {
        $school = School::factory()->create();

        $orphanUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $orphanTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $orphanUser->id]);
        $orphanUser->delete();

        $healthyUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $healthyTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $healthyUser->id]);

        $this->artisan('profiles:cleanup-orphaned')
            ->expectsOutputToContain('Found 1 orphaned teacher row(s)')
            ->expectsOutputToContain('Dry run - no changes made')
            ->assertSuccessful();

        $this->assertDatabaseHas('teachers', ['id' => $orphanTeacher->id, 'deleted_at' => null]);
        $this->assertDatabaseHas('teachers', ['id' => $healthyTeacher->id, 'deleted_at' => null]);
    }

    public function test_apply_soft_deletes_only_the_orphaned_rows(): void
    {
        $school = School::factory()->create();

        $orphanUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $orphanTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $orphanUser->id]);
        $orphanUser->delete();

        $healthyUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $healthyTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $healthyUser->id]);

        $orphanGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $orphanGuardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $orphanGuardianUser->id]);
        $orphanGuardianUser->delete();

        $this->artisan('profiles:cleanup-orphaned', ['--apply' => true])
            ->expectsConfirmation('Soft-delete all of the rows listed above?', 'yes')
            ->assertSuccessful();

        $this->assertSoftDeleted('teachers', ['id' => $orphanTeacher->id]);
        $this->assertSoftDeleted('guardians', ['id' => $orphanGuardian->id]);
        $this->assertDatabaseHas('teachers', ['id' => $healthyTeacher->id, 'deleted_at' => null]);
    }

    public function test_school_id_option_scopes_the_scan(): void
    {
        $schoolA = School::factory()->create();
        $schoolB = School::factory()->create();

        $orphanUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'teacher']);
        $orphanTeacherA = Teacher::factory()->create(['school_id' => $schoolA->id, 'user_id' => $orphanUserA->id]);
        $orphanUserA->delete();

        $orphanUserB = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'teacher']);
        $orphanTeacherB = Teacher::factory()->create(['school_id' => $schoolB->id, 'user_id' => $orphanUserB->id]);
        $orphanUserB->delete();

        $this->artisan('profiles:cleanup-orphaned', ['--apply' => true, '--school-id' => $schoolA->id])
            ->expectsConfirmation('Soft-delete all of the rows listed above?', 'yes')
            ->assertSuccessful();

        $this->assertSoftDeleted('teachers', ['id' => $orphanTeacherA->id]);
        $this->assertDatabaseHas('teachers', ['id' => $orphanTeacherB->id, 'deleted_at' => null]);
    }
}
