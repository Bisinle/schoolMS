<?php

use App\Models\School;
use App\Models\User;

beforeEach(function () {
    $this->school = School::factory()->create();
    $this->admin = User::factory()->create(['school_id' => $this->school->id, 'role' => 'admin']);
});

test('a bare host is normalized to an https url on save', function () {
    $response = $this->actingAs($this->admin)->put(route('settings.profile.update'), [
        'name' => $this->school->name,
        'website' => 'example.com',
    ]);

    $response->assertSessionHasNoErrors();
    expect($this->school->refresh()->website)->toBe('https://example.com');
});

test('a url with an explicit scheme is kept as-is', function () {
    $response = $this->actingAs($this->admin)->put(route('settings.profile.update'), [
        'name' => $this->school->name,
        'website' => 'http://example.com',
    ]);

    $response->assertSessionHasNoErrors();
    expect($this->school->refresh()->website)->toBe('http://example.com');
});

test('clearing the field sets website back to null', function () {
    $this->school->update(['website' => 'https://old-site.example.com']);

    $response = $this->actingAs($this->admin)->put(route('settings.profile.update'), [
        'name' => $this->school->name,
        'website' => '',
    ]);

    $response->assertSessionHasNoErrors();
    expect($this->school->refresh()->website)->toBeNull();
});

test('a javascript scheme is rejected by validation', function () {
    $response = $this->actingAs($this->admin)->put(route('settings.profile.update'), [
        'name' => $this->school->name,
        'website' => 'javascript:alert(1)',
    ]);

    $response->assertSessionHasErrors('website');
    expect($this->school->refresh()->website)->toBeNull();
});

test('updating one school never touches another school\'s website', function () {
    $otherSchool = School::factory()->create(['website' => 'https://other-school.example.com']);

    $response = $this->actingAs($this->admin)->put(route('settings.profile.update'), [
        'name' => $this->school->name,
        'website' => 'https://my-school.example.com',
    ]);

    $response->assertSessionHasNoErrors();
    expect($this->school->refresh()->website)->toBe('https://my-school.example.com');
    expect($otherSchool->refresh()->website)->toBe('https://other-school.example.com');
});

test('the shared inertia school prop includes the website', function () {
    $this->school->update(['website' => 'https://my-school.example.com']);

    $response = $this->actingAs($this->admin)->get(route('settings.profile'));

    $response->assertInertia(fn ($page) => $page
        ->where('school.website', 'https://my-school.example.com')
    );
});
