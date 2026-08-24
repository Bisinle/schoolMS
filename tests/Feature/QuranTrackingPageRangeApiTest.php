<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * JSON endpoint backing Create.jsx's auto-derived Page From/To fields: once
 * a teacher selects the surah/verse range, the page numbers are computed
 * from it rather than typed in manually.
 */
class QuranTrackingPageRangeApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_the_page_range_for_a_verse_selection(): void
    {
        Http::fake([
            'api.quran.com/api/v4/verses/by_key/2:255*' => Http::response(['verse' => ['page_number' => 42]], 200),
            'api.quran.com/api/v4/verses/by_key/2:256*' => Http::response(['verse' => ['page_number' => 42]], 200),
        ]);

        $school = School::factory()->create();
        $teacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);

        $response = $this->actingAs($teacher)->getJson(
            '/api/quran/page-range?surah_from=2&verse_from=255&surah_to=2&verse_to=256'
        );

        $response->assertOk();
        $response->assertExactJson(['page_from' => 42, 'page_to' => 42]);
    }

    public function test_it_requires_authentication(): void
    {
        $response = $this->getJson('/api/quran/page-range?surah_from=2&verse_from=255&surah_to=2&verse_to=256');

        $response->assertUnauthorized();
    }

    public function test_it_validates_required_query_parameters(): void
    {
        $school = School::factory()->create();
        $teacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);

        $response = $this->actingAs($teacher)->getJson('/api/quran/page-range?surah_from=2');

        $response->assertStatus(422);
    }
}
