<?php

namespace Tests\Feature;

use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Grade;
use App\Models\School;
use App\Models\Teacher;
use App\Models\TimetableSlot;
use App\Models\TimetableTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * TimetableSlotPolicy::view() scopes teacher access to
 * $timetableSlot->teacher_id === $user->teacher->id, reached via
 * TimetableSlotController::show()'s `authorize('view', $slot)`. Had no
 * negative-case test until now — added 2026-08-29 per the Phase 7
 * negative-case coverage backfill.
 */
class TimetableSlotOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function makeSlot(School $school, Teacher $teacher): TimetableSlot
    {
        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade A', 'level' => 'LOWER PRIMARY']);
        $year = AcademicYear::create(['school_id' => $school->id, 'year' => '2026', 'start_date' => now()->startOfYear(), 'end_date' => now()->endOfYear(), 'is_active' => true]);
        $term = AcademicTerm::create(['school_id' => $school->id, 'academic_year_id' => $year->id, 'term_number' => 1, 'name' => 'Term 1', 'start_date' => now()->startOfYear(), 'end_date' => now()->addMonths(3), 'is_active' => true]);
        $template = TimetableTemplate::create(['school_id' => $school->id, 'grade_id' => $grade->id, 'academic_term_id' => $term->id, 'name' => 'Grade A - Term 1']);

        return TimetableSlot::create([
            'school_id' => $school->id,
            'timetable_template_id' => $template->id,
            'day_of_week' => 'monday',
            'teacher_id' => $teacher->id,
        ]);
    }

    public function test_teacher_cannot_view_another_teachers_slot(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $ownerTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $ownerTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $ownerTeacherUser->id]);
        $slot = $this->makeSlot($school, $ownerTeacher);

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)->get("/timetables/slots/{$slot->id}");

        $response->assertForbidden();
    }

    public function test_teacher_can_view_own_slot(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $slot = $this->makeSlot($school, $teacher);

        $response = $this->actingAs($teacherUser)->get("/timetables/slots/{$slot->id}");

        $response->assertOk();
    }

    public function test_admin_can_view_any_slot(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $slot = $this->makeSlot($school, $teacher);

        $response = $this->actingAs($adminUser)->get("/timetables/slots/{$slot->id}");

        $response->assertOk();
    }
}
