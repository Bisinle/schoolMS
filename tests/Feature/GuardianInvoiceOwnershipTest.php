<?php

namespace Tests\Feature;

use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Guardian;
use App\Models\GuardianInvoice;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * GuardianInvoicePolicy::view() scopes guardian access to their own
 * guardian_id. Had no negative-case test until now — added 2026-08-27 per
 * the Phase 5 negative-case coverage audit.
 */
class GuardianInvoiceOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_guardian_cannot_view_another_guardians_invoice(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $owningGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $owningGuardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $owningGuardianUser->id]);

        $otherGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $otherGuardianUser->id]);

        $academicYear = AcademicYear::create([
            'school_id' => $school->id,
            'year' => '2026',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => true,
        ]);

        $academicTerm = AcademicTerm::create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
            'term_number' => 1,
            'name' => 'Term 1',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->addMonths(3),
            'is_active' => true,
        ]);

        $invoice = GuardianInvoice::create([
            'school_id' => $school->id,
            'guardian_id' => $owningGuardian->id,
            'academic_term_id' => $academicTerm->id,
            'invoice_number' => 'INV-2026-T1-0001',
            'invoice_date' => now(),
            'due_date' => now()->addDays(30),
            'total_amount' => 100,
            'balance_due' => 100,
            'generated_by' => $admin->id,
        ]);

        $response = $this->actingAs($otherGuardianUser)
            ->get(route('guardian.invoices.show', $invoice->id));

        $response->assertForbidden();
    }

    public function test_guardian_can_view_own_invoice(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);

        $academicYear = AcademicYear::create([
            'school_id' => $school->id,
            'year' => '2026',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => true,
        ]);

        $academicTerm = AcademicTerm::create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
            'term_number' => 1,
            'name' => 'Term 1',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->addMonths(3),
            'is_active' => true,
        ]);

        $invoice = GuardianInvoice::create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'academic_term_id' => $academicTerm->id,
            'invoice_number' => 'INV-2026-T1-0002',
            'invoice_date' => now(),
            'due_date' => now()->addDays(30),
            'total_amount' => 100,
            'balance_due' => 100,
            'generated_by' => $admin->id,
        ]);

        $response = $this->actingAs($guardianUser)
            ->get(route('guardian.invoices.show', $invoice->id));

        $response->assertOk();
    }
}
