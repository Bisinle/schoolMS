<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The homework detail view renders Mushaf pages as live text (Option B:
 * UI/UX parity with Tracking's Show page), same pattern as
 * QuranTrackingShowVerseTextTest — but page_from/page_to are optional for
 * homework, so the page-text props must only appear when they're set.
 */
class QuranHomeworkShowVerseTextTest extends TestCase
{
    use RefreshDatabase;

    public function test_show_page_includes_page_verses_when_page_range_is_set(): void
    {
        $this->withoutVite();

        Http::fake([
            'api.quran.com/api/v4/verses/by_page/42*' => Http::response([
                'verses' => [
                    ['verse_key' => '2:255', 'text_qpc_hafs' => 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ'],
                ],
            ], 200),
            'api.quran.com/api/v4/chapters' => Http::response([
                'chapters' => [
                    ['id' => 2, 'name_simple' => 'Al-Baqarah', 'name_arabic' => 'البقرة', 'verses_count' => 286],
                ],
            ], 200),
        ]);

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'surah_from' => 2,
            'surah_to' => 2,
            'verse_from' => 255,
            'verse_to' => 255,
            'page_from' => 42,
            'page_to' => 42,
        ]);

        $response = $this->actingAs($teacherUser)
            ->get(route('quran-homework.show', $homework->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('homework.starting_verse_reference', '2:255')
            ->has('homework.page_from_verses', 1)
            ->where('homework.page_from_verses.0.text_qpc_hafs', 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ')
        );
    }

    public function test_show_page_omits_page_verses_when_no_page_range_is_set(): void
    {
        $this->withoutVite();

        // QuranHomeworkObserver auto-derives page_from/page_to from
        // surah/verse on create when they're left unset — a wildcard fake
        // is needed so that best-effort derivation genuinely fails (rather
        // than a real network call filling them in from live data), which
        // is what this test needs to exercise: a homework entry that really
        // has no page range known.
        Http::fake([
            'api.quran.com/api/v4/chapters' => Http::response([
                'chapters' => [
                    ['id' => 2, 'name_simple' => 'Al-Baqarah', 'name_arabic' => 'البقرة', 'verses_count' => 286],
                ],
            ], 200),
            'api.quran.com/*' => Http::response([], 200),
        ]);

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'surah_from' => 2,
            'surah_to' => 2,
            'verse_from' => 1,
            'verse_to' => 5,
            'page_from' => null,
            'page_to' => null,
        ]);

        $response = $this->actingAs($teacherUser)
            ->get(route('quran-homework.show', $homework->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->missing('homework.page_from_verses')
        );
        Http::assertNotSent(fn ($request) => str_contains($request->url(), '/verses/by_page/'));
    }
}
