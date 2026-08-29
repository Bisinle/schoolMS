<?php

namespace Tests\Feature;

use App\Models\IncidentReport;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * IncidentReportPolicy::update() scopes non-admin access to the reporting
 * user AND status !== 'closed' — same shape as AccidentReportPolicy. Had no
 * negative-case test until now — added 2026-08-27 per the Phase 5
 * negative-case coverage audit.
 */
class IncidentReportOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function makeReport(School $school, User $reporter, string $status = 'open'): IncidentReport
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
            'status' => $status,
        ]);
    }

    public function test_non_reporting_teacher_cannot_update_another_teachers_report(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $reportingTeacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $otherTeacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $report = $this->makeReport($school, $reportingTeacher);

        $response = $this->actingAs($otherTeacher)
            ->put(route('incident-reports.update', $report->id), []);

        $response->assertForbidden();
    }

    public function test_reporting_teacher_cannot_update_once_closed(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $reportingTeacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $report = $this->makeReport($school, $reportingTeacher, status: 'closed');

        $response = $this->actingAs($reportingTeacher)
            ->put(route('incident-reports.update', $report->id), []);

        $response->assertForbidden();
    }

    public function test_reporting_teacher_can_update_while_open(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $reportingTeacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $report = $this->makeReport($school, $reportingTeacher, status: 'open');

        $response = $this->actingAs($reportingTeacher)
            ->put(route('incident-reports.update', $report->id), [
                'title' => 'Updated title',
                'incident_date' => now()->toDateString(),
                'incident_time' => '09:00',
                'location' => 'Main hall',
                'incident_type' => 'other',
                'severity' => 'minor',
                'students_involved' => [1],
                'description' => 'Updated description',
            ]);

        $response->assertSessionDoesntHaveErrors();
        $response->assertRedirect();
    }
}
