<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuranHomePracticeGetAllSurahsBugTest extends TestCase
{
    use RefreshDatabase;

    /**
     * QuranApiService has no getAllSurahs() method (only getSurahs()), so the
     * create form currently crashes with a fatal error instead of rendering.
     */
    public function test_create_form_loads_without_crashing(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);

        $response = $this->actingAs($guardianUser)
            ->get(route('quran-home-practice.create'));

        $response->assertOk();
    }
}
