<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\QuranHomework;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuranHomeworkObserverStructuralUnitsTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_tracking_record_sets_juz_hizb_and_rub_ranges(): void
    {
        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id]);

        // Default factory verse range is Surah 1 (Al-Fatihah), verses 1-7.
        Http::fake([
            'api.quran.com/api/v4/verses/by_key/1:1*' => Http::response(['verse' => ['rub_el_hizb_number' => 1]], 200),
            'api.quran.com/api/v4/verses/by_key/1:7*' => Http::response(['verse' => ['rub_el_hizb_number' => 1]], 200),
        ]);

        // Pages 5-25 span Juz 1-2 (1-21, 22-41) and Hizb 1-3 (1-11, 12-21, 22-31).
        $tracking = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'page_from' => 5,
            'page_to' => 25,
        ]);

        $tracking->refresh();

        $this->assertSame(1, $tracking->juz_from);
        $this->assertSame(2, $tracking->juz_to);
        $this->assertSame(1, $tracking->hizb_from);
        $this->assertSame(3, $tracking->hizb_to);
        $this->assertSame(1, $tracking->rub_from);
        $this->assertSame(1, $tracking->rub_to);
    }
}
