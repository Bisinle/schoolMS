<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * JSON endpoint backing the live text-based page preview (replacing the
 * dead-CDN PageImagePreview/PageImageViewer image components) in both
 * Tracking/Create.jsx (live, as the teacher types a page number) and
 * Tracking/Show.jsx's fullscreen reading mode (page navigation).
 */
class QuranTrackingPageVersesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_ordered_verses_for_a_page(): void
    {
        Http::fake([
            'api.quran.com/api/v4/verses/by_page/42*' => Http::response([
                'verses' => [
                    ['verse_key' => '2:253', 'text_qpc_hafs' => 'نص الآية ٢٥٣'],
                    ['verse_key' => '2:254', 'text_qpc_hafs' => 'نص الآية ٢٥٤'],
                    ['verse_key' => '2:255', 'text_qpc_hafs' => 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ'],
                    ['verse_key' => '2:256', 'text_qpc_hafs' => 'نص الآية ٢٥٦'],
                ],
            ], 200),
        ]);

        $school = School::factory()->create();
        $teacher = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);

        $response = $this->actingAs($teacher)->getJson('/api/quran/page/42/verses');

        $response->assertOk();
        $response->assertJsonCount(4);
        $response->assertJsonPath('0.verse_key', '2:253');
        $response->assertJsonPath('2.verse_key', '2:255');
        $response->assertJsonPath('2.text_qpc_hafs', 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ');
    }

    public function test_it_requires_authentication(): void
    {
        $response = $this->getJson('/api/quran/page/42/verses');

        $response->assertUnauthorized();
    }
}
