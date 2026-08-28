<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\School;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * quran-dashboard.view was flagged as "partial" coverage in the Phase 5
 * close-out audit: QuranDashboardTeacherScopingTest/
 * QuranDashboardGuardianModuleStatsTest/QuranDashboardTest all cover the
 * page's *positive* path and its module-stats scoping, but none assert a
 * genuine denial. QuranController::index() itself has no per-record
 * ownership boundary to test — it takes no route parameter and is entirely
 * derived from the acting user's own session, so there is no "another
 * user's dashboard" to leak. The one real, previously-untested denial
 * boundary for this permission is CheckMadrasahSchool: every school role
 * holds quran-dashboard.view, but the whole Quran module is
 * `madrasah.only`-gated, and no existing test ever created a non-madrasah
 * school to confirm that boundary actually holds. Added 2026-08-29 per the
 * Phase 7 negative-case coverage backfill — promotes this permission from
 * partial to fully covered.
 */
class QuranDashboardAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_at_non_madrasah_school_cannot_access_quran_dashboard(): void
    {
        $this->withoutVite();

        $school = School::factory()->create(['school_type' => 'islamic_school']);
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $response = $this->actingAs($adminUser)->get('/quran');

        $response->assertNotFound();
    }

    public function test_teacher_at_non_madrasah_school_cannot_access_quran_dashboard(): void
    {
        $this->withoutVite();

        $school = School::factory()->create(['school_type' => 'islamic_school']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        $response = $this->actingAs($teacherUser)->get('/quran');

        $response->assertNotFound();
    }

    public function test_guardian_at_non_madrasah_school_cannot_access_quran_dashboard(): void
    {
        $this->withoutVite();

        $school = School::factory()->create(['school_type' => 'islamic_school']);
        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);

        $response = $this->actingAs($guardianUser)->get('/quran');

        $response->assertNotFound();
    }

    public function test_admin_at_madrasah_school_can_access_quran_dashboard(): void
    {
        $this->withoutVite();

        $school = School::factory()->create(['school_type' => 'madrasah']);
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $response = $this->actingAs($adminUser)->get('/quran');

        $response->assertOk();
    }
}
