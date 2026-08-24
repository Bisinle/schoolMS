<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guardian::allStudents()/allStudentIds() merge the legacy students()
 * relation (students.guardian_id, first-guardian-only) with studentsMany()
 * (the guardian_student pivot, which supports a second/non-primary
 * guardian). Before this fix, a guardian linked to a student ONLY via the
 * pivot — never as students.guardian_id — got silently empty results (or a
 * 403) everywhere in the Quran module, because every guardian-scoping query
 * only ever looked at the legacy column.
 *
 * This test constructs exactly that scenario — a student whose legacy
 * guardian_id points at a DIFFERENT ("primary") guardian, with a second
 * ("pivot-only") guardian attached solely via guardian_student — and
 * confirms the pivot-only guardian now gets correct access everywhere the
 * fix touched: the dashboard, the guardian homework list, and all three
 * per-record ownership checks in QuranHomeworkController.
 */
class GuardianPivotOnlyAccessTest extends TestCase
{
    use RefreshDatabase;

    private function makeScenario(): array
    {
        $school = School::factory()->create();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        $primaryGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $primaryGuardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $primaryGuardianUser->id]);

        $pivotOnlyGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $pivotOnlyGuardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $pivotOnlyGuardianUser->id]);

        // Legacy column points at the primary guardian only — the
        // pivot-only guardian is NOT students.guardian_id.
        $student = Student::factory()->create([
            'school_id' => $school->id,
            'guardian_id' => $primaryGuardian->id,
            'status' => 'active',
        ]);

        // The pivot-only guardian is linked exclusively through
        // guardian_student — a real, second-guardian scenario the student
        // create/edit UI already supports.
        $student->guardians()->attach($pivotOnlyGuardian->id, [
            'relationship' => 'father',
            'is_primary' => false,
            'can_receive_invoices' => true,
            'can_pickup' => true,
            'emergency_contact' => false,
        ]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'pending',
        ]);

        QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'start_date' => now()->subDays(2),
            'end_date' => now()->addDays(5),
        ]);

        return compact('school', 'teacherUser', 'primaryGuardianUser', 'pivotOnlyGuardianUser', 'student', 'homework');
    }

    public function test_pivot_only_guardian_sees_their_child_on_the_dashboard(): void
    {
        $this->withoutVite();
        ['pivotOnlyGuardianUser' => $guardianUser, 'student' => $student] = $this->makeScenario();

        $response = $this->actingAs($guardianUser)->get(route('quran.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('stats.role', 'guardian')
            ->where('stats.childrenTracked', 1)
            ->where('stats.pendingHomework', 1)
            ->where('recentProgress.0.student_name', $student->full_name)
            ->where('activeSchedulesList.0.student_name', $student->full_name)
        );
    }

    public function test_pivot_only_guardian_sees_their_child_in_the_guardian_homework_list(): void
    {
        $this->withoutVite();
        ['pivotOnlyGuardianUser' => $guardianUser, 'student' => $student] = $this->makeScenario();

        $response = $this->actingAs($guardianUser)->get(route('guardian.quran-homework'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('students', 1)
            ->where('students.0.id', $student->id)
        );
    }

    public function test_pivot_only_guardian_can_access_student_report(): void
    {
        $this->withoutVite();
        ['pivotOnlyGuardianUser' => $guardianUser, 'student' => $student] = $this->makeScenario();

        $this->actingAs($guardianUser)
            ->get(route('quran-homework.student-report', $student->id))
            ->assertOk();
    }

    public function test_pivot_only_guardian_can_access_student_homework_list(): void
    {
        $this->withoutVite();
        ['pivotOnlyGuardianUser' => $guardianUser, 'student' => $student] = $this->makeScenario();

        $this->actingAs($guardianUser)
            ->get(route('quran-homework.student', $student->id))
            ->assertOk();
    }

    public function test_pivot_only_guardian_can_view_the_homework_record_itself(): void
    {
        $this->withoutVite();
        ['pivotOnlyGuardianUser' => $guardianUser, 'homework' => $homework] = $this->makeScenario();

        $this->actingAs($guardianUser)
            ->get(route('quran-homework.show', $homework->id))
            ->assertOk();
    }

    /**
     * Sanity check: the merge must not over-broaden access. A guardian with
     * no relationship to the student at all — neither legacy nor pivot —
     * must still be denied.
     */
    public function test_unrelated_guardian_is_still_denied(): void
    {
        $this->withoutVite();
        ['school' => $school, 'student' => $student] = $this->makeScenario();

        $unrelatedGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $unrelatedGuardianUser->id]);

        $this->actingAs($unrelatedGuardianUser)
            ->get(route('quran-homework.student-report', $student->id))
            ->assertForbidden();
    }
}
