<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\QuranHomePractice;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuranHomePracticeTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * An admin from School B must not be able to view a home-practice log
     * belonging to School A. The controller's existing check only guards
     * against a non-owning guardian; it never checks school_id, so an admin
     * (who can also reach this route) bypasses it entirely.
     */
    public function test_admin_cannot_view_another_schools_home_practice(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $schoolB = School::factory()->create();

        $guardianUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'guardian']);
        $guardianA = Guardian::factory()->create(['school_id' => $schoolA->id, 'user_id' => $guardianUserA->id]);
        $studentA = Student::factory()->create(['school_id' => $schoolA->id, 'guardian_id' => $guardianA->id]);

        $practiceA = QuranHomePractice::factory()->create([
            'school_id' => $schoolA->id,
            'student_id' => $studentA->id,
            'guardian_id' => $guardianA->id,
        ]);

        $adminUserB = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'admin']);

        $response = $this->actingAs($adminUserB)
            ->get(route('quran-home-practice.show', $practiceA->id));

        $response->assertStatus(404);
    }

    /**
     * A teacher from School B must not be able to view a home-practice log
     * belonging to School A either (teachers can also reach this route).
     *
     * Note: destroy/edit/update are guardian-only routes, and the controller's
     * existing guardian_id ownership check already fully blocks cross-tenant
     * access there regardless of school scoping (a guardian's id can never
     * coincidentally match one from another school) — so those actions don't
     * characterize a distinct tenant gap the way show() does.
     */
    public function test_teacher_cannot_view_another_schools_home_practice(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $schoolB = School::factory()->create();

        $guardianUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'guardian']);
        $guardianA = Guardian::factory()->create(['school_id' => $schoolA->id, 'user_id' => $guardianUserA->id]);
        $studentA = Student::factory()->create(['school_id' => $schoolA->id, 'guardian_id' => $guardianA->id]);

        $practiceA = QuranHomePractice::factory()->create([
            'school_id' => $schoolA->id,
            'student_id' => $studentA->id,
            'guardian_id' => $guardianA->id,
        ]);

        $teacherUserB = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'teacher']);

        $response = $this->actingAs($teacherUserB)
            ->get(route('quran-home-practice.show', $practiceA->id));

        $response->assertStatus(404);
    }
}
