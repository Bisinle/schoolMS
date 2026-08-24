<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\QuranHomework;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuranHomeworkCalculatedVersesBugTest extends TestCase
{
    use RefreshDatabase;

    /**
     * QuranHomeworkController::show() calls calculateTotalVerses() with the
     * verse_from/surah_to arguments swapped relative to the method's real
     * signature (surahFrom, surahTo, verseFrom, verseTo). For a single-surah
     * record this corrupts the "same surah" fast path and produces the wrong
     * verse count instead of the simple (verse_to - verse_from + 1).
     */
    public function test_calculated_total_verses_is_correct_for_a_single_surah_session(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'surah_from' => 2,
            'surah_to' => 2,
            'verse_from' => 1,
            'verse_to' => 10,
        ]);

        $response = $this->actingAs($teacherUser)
            ->get(route('quran-homework.show', $homework->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('homework.calculated_total_verses', 10)
        );
    }
}
