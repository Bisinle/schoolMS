<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuranHomeworkChainingTest extends TestCase
{
    use RefreshDatabase;

    protected function fakeQuranApi(): void
    {
        // QuranComApiClient::getSurah() resolves via getSurahs() (the bulk
        // /chapters list, keyed "chapters" — see QuranComApiClientTest),
        // not a per-id /chapters/{id} endpoint, so the fake must match that
        // exact bare-list request/shape for validateMultiSurahRange() to
        // find Surah 2 and succeed.
        Http::fake([
            'api.quran.com/api/v4/chapters' => Http::response([
                'chapters' => [
                    ['id' => 2, 'name_simple' => 'Al-Baqarah', 'name_arabic' => 'البقرة', 'verses_count' => 286],
                ],
            ], 200),
            'api.quran.com/*' => Http::response([], 200),
        ]);
    }

    public function test_first_homework_entry_derives_from_point_from_schedule(): void
    {
        $this->withoutVite();
        $this->fakeQuranApi();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'surah_from' => 2,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 286,
        ]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.store'), [
            'student_id' => $student->id,
            'reading_type' => 'new_learning',
            'surah_to' => 2,
            'verse_to' => 10,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('quran_homework', [
            'student_id' => $student->id,
            'quran_schedule_id' => $schedule->id,
            'surah_from' => 2,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 10,
            'status' => 'pending',
        ]);
    }

    public function test_second_homework_entry_derives_from_point_from_previous_entry(): void
    {
        $this->withoutVite();
        $this->fakeQuranApi();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $schedule = QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'surah_from' => 2,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 286,
        ]);

        QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'quran_schedule_id' => $schedule->id,
            'surah_from' => 2,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 10,
        ]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.store'), [
            'student_id' => $student->id,
            'reading_type' => 'new_learning',
            'surah_to' => 2,
            'verse_to' => 20,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('quran_homework', [
            'student_id' => $student->id,
            'surah_from' => 2,
            'verse_from' => 10,
            'surah_to' => 2,
            'verse_to' => 20,
        ]);
    }

    public function test_homework_creation_is_blocked_without_an_active_schedule(): void
    {
        $this->withoutVite();
        $this->fakeQuranApi();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.store'), [
            'student_id' => $student->id,
            'reading_type' => 'new_learning',
            'surah_to' => 2,
            'verse_to' => 10,
        ]);

        $response->assertSessionHasErrors('student_id');
        $this->assertDatabaseCount('quran_homework', 0);
    }
}
