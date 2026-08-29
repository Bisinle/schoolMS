<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Teacher;
use App\Models\School;
use App\Models\TimetableTemplate;
use App\Models\TimetableSlot;
use App\Models\TimetablePeriod;
use App\Models\Subject;
use App\Models\Grade;
use App\Models\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test Teacher Timetable Data Partitioning
 * 
 * Verifies:
 * 1. Teachers only see their own lessons
 * 2. Multi-tenant isolation (school_id)
 * 3. Only published templates are shown
 * 4. Query-level filtering (not UI-level)
 */
class TeacherTimetableTest extends TestCase
{
    use RefreshDatabase;

    private School $school1;
    private School $school2;
    private User $teacher1User;
    private User $teacher2User;
    private Teacher $teacher1;
    private Teacher $teacher2;
    private TimetableTemplate $publishedTemplate;
    private TimetableTemplate $draftTemplate;

    protected function setUp(): void
    {
        parent::setUp();

        // Create two schools for multi-tenant testing
        $this->school1 = School::factory()->create(['name' => 'School 1', 'status' => 'active']);
        $this->school2 = School::factory()->create(['name' => 'School 2', 'status' => 'active']);

        // Create teachers in different schools
        $this->teacher1User = User::factory()->create([
            'school_id' => $this->school1->id,
            'role' => 'teacher',
            'name' => 'Teacher One',
        ]);
        $this->teacher1 = Teacher::factory()->create([
            'user_id' => $this->teacher1User->id,
            'school_id' => $this->school1->id,
        ]);

        $this->teacher2User = User::factory()->create([
            'school_id' => $this->school2->id,
            'role' => 'teacher',
            'name' => 'Teacher Two',
        ]);
        $this->teacher2 = Teacher::factory()->create([
            'user_id' => $this->teacher2User->id,
            'school_id' => $this->school2->id,
        ]);

        // Create grades, subjects, periods, rooms
        $grade = Grade::factory()->create(['school_id' => $this->school1->id]);
        $subject = Subject::factory()->create(['school_id' => $this->school1->id]);
        $period = TimetablePeriod::factory()->create(['school_id' => $this->school1->id]);
        $room = Room::factory()->create(['school_id' => $this->school1->id]);

        // Create published and draft templates
        $this->publishedTemplate = TimetableTemplate::factory()->create([
            'school_id' => $this->school1->id,
            'grade_id' => $grade->id,
            'status' => 'published',
            'is_active' => true,
        ]);

        $this->draftTemplate = TimetableTemplate::factory()->create([
            'school_id' => $this->school1->id,
            'grade_id' => $grade->id,
            'status' => 'draft',
            'is_active' => false,
        ]);

        // Create slots for teacher1 in published template
        TimetableSlot::factory()->create([
            'timetable_template_id' => $this->publishedTemplate->id,
            'school_id' => $this->school1->id,
            'teacher_id' => $this->teacher1->id,
            'subject_id' => $subject->id,
            'timetable_period_id' => $period->id,
            'room_id' => $room->id,
            'day_of_week' => 'monday',
            'slot_type' => TimetableSlot::TYPE_LESSON,
        ]);

        // Create slot for teacher1 in draft template (should NOT appear)
        TimetableSlot::factory()->create([
            'timetable_template_id' => $this->draftTemplate->id,
            'school_id' => $this->school1->id,
            'teacher_id' => $this->teacher1->id,
            'subject_id' => $subject->id,
            'timetable_period_id' => $period->id,
            'room_id' => $room->id,
            'day_of_week' => 'tuesday',
            'slot_type' => TimetableSlot::TYPE_LESSON,
        ]);
    }

    public function test_teacher_can_only_access_their_own_timetable()
    {
        $response = $this->actingAs($this->teacher1User)
            ->get(route('timetables.my-timetable'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Teacher/MyTimetable')
            ->has('teacher')
            ->has('timetable')
            ->has('stats')
        );
    }

    public function test_teacher_only_sees_published_templates()
    {
        $response = $this->actingAs($this->teacher1User)
            ->get(route('timetables.my-timetable'));

        $response->assertStatus(200);

        // Should have 1 lesson (from published template only)
        // timetable is grouped by grade name, then by day - flatten across
        // grades to check day-level counts regardless of grade grouping.
        $timetable = $response->viewData('page')['props']['timetable'];
        $mondaySlots = collect($timetable)->flatMap(fn ($days) => $days['monday'] ?? [])->all();
        $tuesdaySlots = collect($timetable)->flatMap(fn ($days) => $days['tuesday'] ?? [])->all();

        $this->assertCount(1, $mondaySlots, 'Should see lesson from published template');
        $this->assertCount(0, $tuesdaySlots, 'Should NOT see lesson from draft template');
    }

    public function test_non_teacher_cannot_access_teacher_timetable()
    {
        $admin = User::factory()->create([
            'school_id' => $this->school1->id,
            'role' => 'admin',
        ]);

        $response = $this->actingAs($admin)
            ->get(route('timetables.my-timetable'));

        $response->assertStatus(403);
    }

    public function test_multi_tenant_isolation_is_enforced()
    {
        // Teacher from school2 should not see school1's data
        $response = $this->actingAs($this->teacher2User)
            ->get(route('timetables.my-timetable'));

        $response->assertStatus(200);

        $timetable = $response->viewData('page')['props']['timetable'];
        $allSlots = collect($timetable)->flatten(1);

        $this->assertCount(0, $allSlots, 'Teacher from different school should see no lessons');
    }
}

