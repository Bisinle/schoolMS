<?php

namespace Tests\Feature;

use App\Models\IncidentReport;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression coverage for a 2026-08-27 review: the cosmetic rename of
 * `incident-reports.update-status` to `incident-reports.review` (unifying
 * naming with `accident-reports.review`) risked also carrying over
 * accident-reports' narrower admin-only scope. It didn't — teacher keeps
 * the grant it had pre-migration (`in_array($user->role, ['admin',
 * 'teacher'])`) — but there was no test asserting this until now.
 */
class IncidentReportReviewPermissionTest extends TestCase
{
    use RefreshDatabase;

    private function makeReport(School $school, User $reporter): IncidentReport
    {
        return IncidentReport::create([
            'school_id' => $school->id,
            'incident_date' => now()->toDateString(),
            'incident_time' => '09:00:00',
            'location' => 'Main hall',
            'incident_type' => 'other',
            'severity' => 'minor',
            'students_involved' => [],
            'description' => 'Test incident',
            'reported_by' => $reporter->id,
        ]);
    }

    public function test_admin_can_review_incident_report(): void
    {
        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $report = $this->makeReport($school, $admin);

        $this->assertTrue($admin->can('updateStatus', $report));
    }

    public function test_teacher_can_review_incident_report(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $report = $this->makeReport($school, $teacher);

        $this->assertTrue($teacher->can('updateStatus', $report));
    }

    public function test_guardian_cannot_review_incident_report(): void
    {
        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $guardian = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $report = $this->makeReport($school, $admin);

        $this->assertFalse($guardian->can('updateStatus', $report));
    }

    public function test_teacher_cannot_review_another_schools_incident_report(): void
    {
        $school = School::factory()->create();
        $otherSchool = School::factory()->create();
        $teacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $otherAdmin = User::factory()->create(['school_id' => $otherSchool->id, 'role' => 'admin']);
        $report = $this->makeReport($otherSchool, $otherAdmin);

        $this->assertFalse($teacher->can('updateStatus', $report));
    }
}
