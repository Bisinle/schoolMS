<?php

use App\Models\User;
use App\Models\School;
use App\Models\Teacher;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\Room;
use App\Models\TimetableTemplate;
use App\Models\TimetablePeriod;
use App\Models\TimetableSlot;
use App\Models\TeacherAvailability;
use App\Models\AcademicTerm;
use App\Services\TimetableConflictDetector;

beforeEach(function () {
    // Create school
    $this->school = School::factory()->create([
        'name' => 'Test School',
        'school_type' => 'primary',
    ]);

    // Create admin user
    $this->admin = User::factory()->create([
        'school_id' => $this->school->id,
        'role' => 'admin',
    ]);

    // Create teacher
    $teacherUser = User::factory()->create([
        'school_id' => $this->school->id,
        'role' => 'teacher',
    ]);
    $this->teacher = Teacher::factory()->create([
        'user_id' => $teacherUser->id,
        'school_id' => $this->school->id,
    ]);

    // Create grade
    $this->grade = Grade::factory()->create([
        'school_id' => $this->school->id,
        'name' => 'Grade 1',
        'level' => 'primary',
    ]);

    // Create subject
    $this->subject = Subject::factory()->create([
        'school_id' => $this->school->id,
        'name' => 'Mathematics',
    ]);

    // Assign subject to grade
    $this->grade->subjects()->attach($this->subject->id, [
        'sessions_per_week' => 5,
    ]);

    // Assign teacher to grade
    $this->grade->teachers()->attach($this->teacher->id, [
        'is_class_teacher' => true,
    ]);

    // Create room
    $this->room = Room::factory()->create([
        'school_id' => $this->school->id,
        'code' => 'R101',
    ]);

    // Create academic term
    $term = AcademicTerm::factory()->create([
        'school_id' => $this->school->id,
    ]);

    // Create timetable template
    $this->template = TimetableTemplate::factory()->create([
        'school_id' => $this->school->id,
        'grade_id' => $this->grade->id,
        'academic_term_id' => $term->id,
        'name' => 'Grade 1 Timetable',
    ]);

    // Create periods
    $this->period1 = TimetablePeriod::factory()->create([
        'school_id' => $this->school->id,
        'name' => 'Period 1',
        'start_time' => '08:00:00',
        'end_time' => '09:00:00',
        'grade_level' => 'primary',
        'order' => 1,
    ]);

    $this->period2 = TimetablePeriod::factory()->create([
        'school_id' => $this->school->id,
        'name' => 'Period 2',
        'start_time' => '09:00:00',
        'end_time' => '10:00:00',
        'grade_level' => 'primary',
        'order' => 2,
    ]);

    // Initialize conflict detector
    $this->detector = new TimetableConflictDetector();
});

test('it detects teacher double booking conflict', function () {
    // Create first slot
    $slot1 = TimetableSlot::factory()->create([
        'school_id' => $this->school->id,
        'timetable_template_id' => $this->template->id,
        'timetable_period_id' => $this->period1->id,
        'day_of_week' => 'monday',
        'teacher_id' => $this->teacher->id,
        'subject_id' => $this->subject->id,
        'room_id' => $this->room->id,
        'slot_type' => 'lesson',
    ]);

    // Try to create second slot with same teacher, day, and period
    $slotData = [
        'school_id' => $this->school->id,
        'timetable_template_id' => $this->template->id,
        'timetable_period_id' => $this->period1->id,
        'day_of_week' => 'monday',
        'teacher_id' => $this->teacher->id,
        'subject_id' => $this->subject->id,
        'slot_type' => 'lesson',
    ];

    $conflicts = $this->detector->detectConflicts($slotData);

    expect($conflicts)->not->toBeEmpty()
        ->and($conflicts[0]['type'])->toBe('teacher_double_booking')
        ->and($conflicts[0]['severity'])->toBe('error');
});

test('it detects teacher availability conflict', function () {
    // Mark teacher as unavailable on Monday 8-9am
    TeacherAvailability::factory()->create([
        'school_id' => $this->school->id,
        'teacher_id' => $this->teacher->id,
        'day_of_week' => 'monday',
        'start_time' => '08:00:00',
        'end_time' => '09:00:00',
        'availability_type' => 'unavailable',
        'reason' => 'meeting',
    ]);

    // Try to create slot during unavailable time
    $slotData = [
        'school_id' => $this->school->id,
        'timetable_template_id' => $this->template->id,
        'timetable_period_id' => $this->period1->id,
        'day_of_week' => 'monday',
        'teacher_id' => $this->teacher->id,
        'subject_id' => $this->subject->id,
        'slot_type' => 'lesson',
    ];

    $conflicts = $this->detector->detectConflicts($slotData);

    expect($conflicts)->not->toBeEmpty()
        ->and($conflicts[0]['type'])->toBe('teacher_availability')
        ->and($conflicts[0]['severity'])->toBe('error');
});

test('it detects room double booking conflict', function () {
    // Create first slot
    $slot1 = TimetableSlot::factory()->create([
        'school_id' => $this->school->id,
        'timetable_template_id' => $this->template->id,
        'timetable_period_id' => $this->period1->id,
        'day_of_week' => 'monday',
        'teacher_id' => $this->teacher->id,
        'subject_id' => $this->subject->id,
        'room_id' => $this->room->id,
        'slot_type' => 'lesson',
    ]);

    // Create another teacher
    $teacher2User = User::factory()->create([
        'school_id' => $this->school->id,
        'role' => 'teacher',
    ]);
    $teacher2 = Teacher::factory()->create([
        'user_id' => $teacher2User->id,
        'school_id' => $this->school->id,
    ]);

    // Try to create second slot with same room, day, and period
    $slotData = [
        'school_id' => $this->school->id,
        'timetable_template_id' => $this->template->id,
        'timetable_period_id' => $this->period1->id,
        'day_of_week' => 'monday',
        'teacher_id' => $teacher2->id,
        'subject_id' => $this->subject->id,
        'room_id' => $this->room->id,
        'slot_type' => 'lesson',
    ];

    $conflicts = $this->detector->detectConflicts($slotData);

    expect($conflicts)->not->toBeEmpty();
    $roomConflict = collect($conflicts)->firstWhere('type', 'room_double_booking');
    expect($roomConflict)->not->toBeNull()
        ->and($roomConflict['severity'])->toBe('warning');
});

test('it allows non conflicting slots', function () {
    // Create first slot
    $slot1 = TimetableSlot::factory()->create([
        'school_id' => $this->school->id,
        'timetable_template_id' => $this->template->id,
        'timetable_period_id' => $this->period1->id,
        'day_of_week' => 'monday',
        'teacher_id' => $this->teacher->id,
        'subject_id' => $this->subject->id,
        'room_id' => $this->room->id,
        'slot_type' => 'lesson',
    ]);

    // Try to create second slot in different period (no conflict)
    $slotData = [
        'school_id' => $this->school->id,
        'timetable_template_id' => $this->template->id,
        'timetable_period_id' => $this->period2->id, // Different period
        'day_of_week' => 'monday',
        'teacher_id' => $this->teacher->id,
        'subject_id' => $this->subject->id,
        'slot_type' => 'lesson',
    ];

    $conflicts = $this->detector->detectConflicts($slotData);

    expect($conflicts)->toBeEmpty();
});

test('it excludes current slot when updating', function () {
    // Create a slot
    $slot = TimetableSlot::factory()->create([
        'school_id' => $this->school->id,
        'timetable_template_id' => $this->template->id,
        'timetable_period_id' => $this->period1->id,
        'day_of_week' => 'monday',
        'teacher_id' => $this->teacher->id,
        'subject_id' => $this->subject->id,
        'room_id' => $this->room->id,
        'slot_type' => 'lesson',
    ]);

    // Update the same slot (should not conflict with itself)
    $slotData = [
        'school_id' => $this->school->id,
        'timetable_template_id' => $this->template->id,
        'timetable_period_id' => $this->period1->id,
        'day_of_week' => 'monday',
        'teacher_id' => $this->teacher->id,
        'subject_id' => $this->subject->id,
        'slot_type' => 'lesson',
    ];

    $conflicts = $this->detector->detectConflicts($slotData, $slot->id);

    expect($conflicts)->toBeEmpty();
});

test('it does not check conflicts for non lesson slots', function () {
    // Create a break slot (should not check conflicts)
    $slotData = [
        'school_id' => $this->school->id,
        'timetable_template_id' => $this->template->id,
        'timetable_period_id' => $this->period1->id,
        'day_of_week' => 'monday',
        'slot_type' => 'break',
    ];

    $conflicts = $this->detector->detectConflicts($slotData);

    expect($conflicts)->toBeEmpty();
});
