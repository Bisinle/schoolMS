<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuranScheduleTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * An admin from School B must not be able to view a schedule belonging to
     * School A. The controller's existing check only guards against a
     * non-owning teacher; it never checks school_id, so an admin bypasses it.
     */
    public function test_admin_cannot_view_another_schools_schedule(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $schoolB = School::factory()->create();

        $teacherUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $schoolA->id, 'user_id' => $teacherUserA->id]);
        $guardianUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'guardian']);
        $guardianA = Guardian::factory()->create(['school_id' => $schoolA->id, 'user_id' => $guardianUserA->id]);
        $studentA = Student::factory()->create(['school_id' => $schoolA->id, 'guardian_id' => $guardianA->id]);

        $scheduleA = QuranSchedule::factory()->create([
            'school_id' => $schoolA->id,
            'student_id' => $studentA->id,
            'teacher_id' => $teacherUserA->id,
        ]);

        $adminUserB = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'admin']);

        $response = $this->actingAs($adminUserB)
            ->get(route('quran-schedule.show', $scheduleA->id));

        $response->assertStatus(404);
    }

    /**
     * An admin from School B must not be able to delete a schedule belonging
     * to School A, for the same reason as above.
     */
    public function test_admin_cannot_delete_another_schools_schedule(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $schoolB = School::factory()->create();

        $teacherUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $schoolA->id, 'user_id' => $teacherUserA->id]);
        $guardianUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'guardian']);
        $guardianA = Guardian::factory()->create(['school_id' => $schoolA->id, 'user_id' => $guardianUserA->id]);
        $studentA = Student::factory()->create(['school_id' => $schoolA->id, 'guardian_id' => $guardianA->id]);

        $scheduleA = QuranSchedule::factory()->create([
            'school_id' => $schoolA->id,
            'student_id' => $studentA->id,
            'teacher_id' => $teacherUserA->id,
        ]);

        $adminUserB = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'admin']);

        $response = $this->actingAs($adminUserB)
            ->delete(route('quran-schedule.destroy', $scheduleA->id));

        $response->assertStatus(404);

        $this->assertDatabaseHas('quran_schedules', ['id' => $scheduleA->id]);
    }
}
