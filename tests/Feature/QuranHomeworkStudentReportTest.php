<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuranHomeworkStudentReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_shows_current_surah_arabic_name_and_juz_progress_from_latest_entry(): void
    {
        $this->withoutVite();

        Http::fake([
            'api.quran.com/api/v4/chapters' => Http::response([
                'chapters' => [
                    ['id' => 1, 'name_simple' => 'Al-Fatihah', 'name_arabic' => 'الفاتحة', 'verses_count' => 7],
                    ['id' => 2, 'name_simple' => 'Al-Baqarah', 'name_arabic' => 'البقرة', 'verses_count' => 286],
                ],
            ], 200),
        ]);

        $school = School::factory()->create();
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        // Older entry, on Al-Fatihah — must NOT be what "current" reflects.
        QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'assigned_date' => now()->subDays(2),
            'surah_from' => 1,
            'surah_to' => 1,
        ]);

        // Latest entry, on Al-Baqarah — this is "current".
        $latest = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'assigned_date' => now(),
            'surah_from' => 2,
            'surah_to' => 2,
        ]);

        // Bypass the observer's own (network-dependent) computation and set
        // the structural position directly: Juz 1 runs pages 1-21, so page 3
        // is the 3rd page into it.
        DB::table('quran_homework')->where('id', $latest->id)->update([
            'page_to' => 3,
            'juz_to' => 1,
        ]);

        $response = $this->actingAs($adminUser)
            ->get(route('quran-homework.student-report', $student->id));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('analytics.current_surah_arabic', 'البقرة')
            ->where('analytics.current_juz', 'Juz 1 — 3/21 pages')
        );
    }
}
