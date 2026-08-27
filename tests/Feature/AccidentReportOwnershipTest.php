<?php

namespace Tests\Feature;

use App\Models\AccidentReport;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * AccidentReportPolicy::update() scopes non-admin access to the reporting
 * user AND status !== 'closed'. Had no negative-case test until now —
 * added 2026-08-27 per the Phase 5 negative-case coverage audit.
 */
class AccidentReportOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function makeReport(School $school, User $reporter, string $status = 'draft'): AccidentReport
    {
        return AccidentReport::create([
            'school_id' => $school->id,
            'title' => 'Test accident',
            'incident_date' => now()->toDateString(),
            'incident_time' => '09:00:00',
            'location' => 'Playground',
            'incident_type' => 'injury',
            'severity' => 'minor',
            'people_involved' => [],
            'description' => 'Test accident',
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
            ->put(route('accident-reports.update', $report->id), []);

        $response->assertForbidden();
    }

    public function test_reporting_teacher_cannot_update_once_closed(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $reportingTeacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $report = $this->makeReport($school, $reportingTeacher, status: 'closed');

        $response = $this->actingAs($reportingTeacher)
            ->put(route('accident-reports.update', $report->id), []);

        $response->assertForbidden();
    }

    public function test_reporting_teacher_can_update_while_open(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $reportingTeacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $report = $this->makeReport($school, $reportingTeacher, status: 'draft');

        $response = $this->actingAs($reportingTeacher)
            ->put(route('accident-reports.update', $report->id), [
                'title' => 'Updated title',
                'incident_date' => now()->toDateString(),
                'incident_time' => '09:00',
                'location' => 'Playground',
                'incident_type' => 'other',
                'severity' => 'minor',
                'people_involved' => [['type' => 'student', 'id' => 1, 'name' => 'Test Student']],
                'description' => 'Updated description',
                'immediate_action_taken' => 'First aid applied',
            ]);

        $response->assertSessionDoesntHaveErrors();
        $response->assertRedirect();
    }
}
