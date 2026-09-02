<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherAvailability;
use App\Models\TimetablePeriod;
use App\Models\TimetableSlot;
use App\Models\TimetableTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression coverage for the teacher-delete 500: timetable_slots.teacher_id
 * and teacher_availability.teacher_id both carry a restrictOnDelete foreign
 * key, so a hard DELETE on a teacher who still has either kind of record
 * threw an uncaught QueryException. TeacherController::destroy() now blocks
 * with a friendly error when either exists, and otherwise soft-deletes the
 * teacher (and its user) instead of hard-deleting.
 */
class TeacherDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_delete_teacher_with_no_dependent_records(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        $response = $this->actingAs($admin)->delete("/teachers/{$teacher->id}");

        $response->assertRedirect(route('teachers.index'));
        $response->assertSessionHas('success');

        $this->assertSoftDeleted('teachers', ['id' => $teacher->id]);
        $this->assertSoftDeleted('users', ['id' => $teacherUser->id]);
    }

    public function test_admin_cannot_delete_teacher_with_timetable_slots(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        $template = TimetableTemplate::factory()->create(['school_id' => $school->id]);
        $period = TimetablePeriod::factory()->create(['school_id' => $school->id]);
        TimetableSlot::factory()->create([
            'school_id' => $school->id,
            'timetable_template_id' => $template->id,
            'timetable_period_id' => $period->id,
            'teacher_id' => $teacher->id,
        ]);

        $response = $this->actingAs($admin)->delete("/teachers/{$teacher->id}");

        $response->assertRedirect();
        $response->assertSessionHas('error');

        // The teacher must survive untouched - this is the bug: a hard
        // delete attempt here used to throw a raw 500 instead of leaving
        // the record alone.
        $this->assertDatabaseHas('teachers', ['id' => $teacher->id, 'deleted_at' => null]);
        $this->assertDatabaseHas('users', ['id' => $teacherUser->id, 'deleted_at' => null]);
    }

    public function test_admin_cannot_delete_teacher_with_availability_records(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        TeacherAvailability::factory()->create([
            'school_id' => $school->id,
            'teacher_id' => $teacher->id,
        ]);

        $response = $this->actingAs($admin)->delete("/teachers/{$teacher->id}");

        $response->assertRedirect();
        $response->assertSessionHas('error');

        $this->assertDatabaseHas('teachers', ['id' => $teacher->id, 'deleted_at' => null]);
    }
}
