<?php

use App\Models\School;
use App\Models\User;

beforeEach(function () {
    $this->school = School::factory()->create();
});

test('profile page is displayed', function () {
    $user = User::factory()->create(['school_id' => $this->school->id, 'role' => 'admin']);

    $response = $this
        ->actingAs($user)
        ->get('/profile');

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create(['school_id' => $this->school->id, 'role' => 'admin']);

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $user->refresh();

    $this->assertSame('Test User', $user->name);
    $this->assertSame('test@example.com', $user->email);
    $this->assertNull($user->email_verified_at);
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create(['school_id' => $this->school->id, 'role' => 'admin']);

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $this->assertNotNull($user->refresh()->email_verified_at);
});

test('user can delete their account', function () {
    $user = User::factory()->create(['school_id' => $this->school->id, 'role' => 'admin']);

    $response = $this
        ->actingAs($user)
        ->delete('/profile', [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    // User::fresh() bypasses all global scopes (newQueryWithoutScopes()),
    // including SoftDeletingScope, so it would still find a soft-deleted
    // row - not a valid "is this user gone" check once User uses
    // SoftDeletes. assertSoftDeleted() is the correct assertion here.
    $this->assertSoftDeleted($user);
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create(['school_id' => $this->school->id, 'role' => 'admin']);

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->delete('/profile', [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/profile');

    $this->assertNotNull($user->fresh());
});
