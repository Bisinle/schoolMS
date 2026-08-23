<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\QuranHomePractice;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Contract test for the data HomePractice/Create.jsx and Edit.jsx rely on:
 * each surah in the 'surahs' prop must carry 'verses_count' (the real field
 * name from the API), not 'total_verses' (which the frontend was reading and
 * which does not exist in the response — the verse-number sub-dropdown was
 * silently empty as a result).
 */
class QuranHomePracticeSurahVersesCountTest extends TestCase
{
    use RefreshDatabase;

    private function fakeSurahs(): void
    {
        Http::fake([
            'api.quran.com/api/v4/chapters' => Http::response([
                'chapters' => [
                    ['id' => 1, 'name_simple' => 'Al-Fatihah', 'name_arabic' => 'الفاتحة', 'verses_count' => 7],
                ],
            ], 200),
        ]);
    }

    public function test_create_page_surahs_prop_carries_verses_count(): void
    {
        $this->withoutVite();
        $this->fakeSurahs();

        $school = School::factory()->create();
        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);

        $response = $this->actingAs($guardianUser)
            ->get(route('quran-home-practice.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('surahs.0.id', 1)
            ->where('surahs.0.verses_count', 7)
            ->missing('surahs.0.total_verses')
        );
    }

    public function test_edit_page_surahs_prop_carries_verses_count(): void
    {
        $this->withoutVite();
        $this->fakeSurahs();

        $school = School::factory()->create();
        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id]);

        $practice = QuranHomePractice::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'guardian_id' => $guardian->id,
        ]);

        $response = $this->actingAs($guardianUser)
            ->get(route('quran-home-practice.edit', $practice->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('surahs.0.id', 1)
            ->where('surahs.0.verses_count', 7)
            ->missing('surahs.0.total_verses')
        );
    }
}
