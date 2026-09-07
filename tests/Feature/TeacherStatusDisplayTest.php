<?php

use App\Models\School;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;

test('teacher update no longer requires or persists a status field', function () {
    $school = School::factory()->create();
    $admin = User::factory()->create(['role' => 'admin', 'school_id' => $school->id]);
    $subject = Subject::factory()->create(['school_id' => $school->id]);
    $teacherUser = User::factory()->create(['role' => 'teacher', 'school_id' => $school->id, 'is_active' => true]);
    $teacher = Teacher::factory()->create([
        'user_id' => $teacherUser->id,
        'school_id' => $school->id,
        'subject_id' => $subject->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($admin)->put("/teachers/{$teacher->id}", [
        'name' => $teacherUser->name,
        'email' => $teacherUser->email,
        'phone_number' => '0700000000',
        'address' => null,
        'qualification' => null,
        'subject_id' => $subject->id,
        'subject_ids' => [$subject->id],
        'date_of_joining' => null,
    ]);

    $response->assertRedirect('/teachers');
    expect($teacher->fresh()->status)->toBe('active');
    expect($teacherUser->fresh()->is_active)->toBeTrue();
});

test('teacher show page displays login access from user.is_active, not teachers.status', function () {
    $school = School::factory()->create();
    $admin = User::factory()->create(['role' => 'admin', 'school_id' => $school->id]);
    $subject = Subject::factory()->create(['school_id' => $school->id]);
    $teacherUser = User::factory()->create(['role' => 'teacher', 'school_id' => $school->id, 'is_active' => true]);
    $teacher = Teacher::factory()->create([
        'user_id' => $teacherUser->id,
        'school_id' => $school->id,
        'subject_id' => $subject->id,
        'status' => 'active', // deliberately stays 'active' to prove display no longer reads this
    ]);

    $this->actingAs($admin)->post("/users/{$teacherUser->id}/toggle-status");

    expect($teacherUser->fresh()->is_active)->toBeFalse();
    expect($teacher->fresh()->status)->toBe('active');

    $response = $this->actingAs($admin)->get("/teachers/{$teacher->id}");

    $response->assertInertia(fn ($page) => $page
        ->component('Teachers/Show')
        ->where('teacher.user.is_active', false)
    );
});
