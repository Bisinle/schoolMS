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

    /**
     * A teacher from School B must not be able to create a schedule for a
     * student who belongs to School A, even by supplying that student's ID
     * directly. Before the fix, `student_id => exists:students,id` accepted
     * any student system-wide.
     */
    public function test_teacher_cannot_create_schedule_for_another_schools_student(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $schoolB = School::factory()->create();

        $guardianUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'guardian']);
        $guardianA = Guardian::factory()->create(['school_id' => $schoolA->id, 'user_id' => $guardianUserA->id]);
        $studentA = Student::factory()->create(['school_id' => $schoolA->id, 'guardian_id' => $guardianA->id]);

        $teacherUserB = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $schoolB->id, 'user_id' => $teacherUserB->id]);

        $response = $this->actingAs($teacherUserB)
            ->post(route('quran-schedule.store'), [
                'student_id' => $studentA->id,
                'surah_from' => 1,
                'verse_from' => 1,
                'surah_to' => 2,
                'verse_to' => 5,
                'start_date' => now()->toDateString(),
            ]);

        $response->assertSessionHasErrors('student_id');

        $this->assertDatabaseMissing('quran_schedules', ['student_id' => $studentA->id]);
    }

    /**
     * A guardian must not be able to view another child's schedule by
     * guessing/enumerating its ID. Before the 2026-08-26 fix,
     * QuranSchedulePolicy::view() granted any guardian access to any
     * schedule in the school with no ownership check at all.
     */
    public function test_guardian_cannot_view_another_childs_schedule(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        $otherGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $otherGuardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $otherGuardianUser->id]);
        $otherStudent = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $otherGuardian->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $otherStudent->id,
            'teacher_id' => $teacherUser->id,
        ]);

        $unrelatedGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $unrelatedGuardianUser->id]);

        $response = $this->actingAs($unrelatedGuardianUser)
            ->get(route('quran-schedule.show', $schedule->id));

        $response->assertStatus(403);
    }

    /**
     * A guardian must still be able to view their own child's schedule —
     * the fix must not overcorrect into blocking legitimate access.
     */
    public function test_guardian_can_view_own_childs_schedule(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
        ]);

        $response = $this->actingAs($guardianUser)
            ->get(route('quran-schedule.show', $schedule->id));

        $response->assertStatus(200);
    }
}
