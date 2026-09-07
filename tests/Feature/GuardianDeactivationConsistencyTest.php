<?php

use App\Models\Guardian;
use App\Models\School;
use App\Models\Student;
use App\Models\User;

test('deactivating a guardian cascades to students but does not touch the guardian user is_active login flag', function () {
    $school = School::factory()->create();
    $admin = User::factory()->create(['role' => 'admin', 'school_id' => $school->id]);
    $guardianUser = User::factory()->create(['role' => 'guardian', 'school_id' => $school->id, 'is_active' => true]);
    $guardian = Guardian::factory()->create(['user_id' => $guardianUser->id, 'school_id' => $school->id]);
    $student = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id, 'status' => 'active']);

    $this->actingAs($admin)->patch("/guardians/{$guardian->id}/deactivate", ['reason' => 'Withdrew from school']);

    expect($guardian->fresh()->status)->toBe('inactive');
    expect($student->fresh()->status)->toBe('inactive');
    // the actual login gate is untouched — this is the decoupling this plan enforces
    expect($guardianUser->fresh()->is_active)->toBeTrue();
});

test('a guardian deactivated only via the Users page keeps full enrollment status but loses login', function () {
    $school = School::factory()->create();
    $admin = User::factory()->create(['role' => 'admin', 'school_id' => $school->id]);
    $guardianUser = User::factory()->create(['role' => 'guardian', 'school_id' => $school->id, 'is_active' => true]);
    $guardian = Guardian::factory()->create(['user_id' => $guardianUser->id, 'school_id' => $school->id, 'status' => 'active']);
    $student = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id, 'status' => 'active']);

    $this->actingAs($admin)->post("/users/{$guardianUser->id}/toggle-status");

    expect($guardianUser->fresh()->is_active)->toBeFalse();
    expect($guardian->fresh()->status)->toBe('active'); // enrollment untouched
    expect($student->fresh()->status)->toBe('active'); // children untouched

    $response = $this->actingAs($admin)->get("/guardians/{$guardian->id}");

    $response->assertInertia(fn ($page) => $page
        ->component('Guardians/Show')
        ->where('guardian.user.is_active', false)
        ->where('guardian.status', 'active')
    );
});
