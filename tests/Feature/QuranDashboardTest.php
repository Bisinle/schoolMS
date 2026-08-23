<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class QuranDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_quran_dashboard_loads_for_admin(): void
    {
        $this->withoutVite();

        $school = School::factory()->create(['school_type' => 'madrasah']);
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'graded',
            'reading_type' => 'new_learning',
            'pages_memorized' => 2,
        ]);

        $response = $this->actingAs($adminUser)->get(route('quran.index'));

        $response->assertOk();
    }

    public function test_dashboard_stats_only_count_graded_homework(): void
    {
        $this->withoutVite();

        $school = School::factory()->create(['school_type' => 'madrasah']);
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        // Graded — must count.
        $graded = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'graded',
            'reading_type' => 'new_learning',
        ]);
        DB::table('quran_homework')->where('id', $graded->id)->update([
            'pages_memorized' => 2,
            'juz_memorized' => 1,
        ]);

        // Pending — the observer still computes non-zero pages/juz on save,
        // but this entry was never actually graded and must not count.
        $pending = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'pending',
            'reading_type' => 'new_learning',
        ]);
        DB::table('quran_homework')->where('id', $pending->id)->update([
            'pages_memorized' => 5,
            'juz_memorized' => 3,
        ]);

        $response = $this->actingAs($adminUser)->get(route('quran.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('stats.pendingHomework', 1)
            ->where('stats.topPerformer', "{$student->full_name} — 1 Juz")
        );
    }

    public function test_active_schedules_only_counts_schedules_whose_date_range_includes_today(): void
    {
        $this->withoutVite();

        $school = School::factory()->create(['school_type' => 'madrasah']);
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        // Today falls within the range — counts.
        QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'start_date' => now()->subDays(3),
            'end_date' => now()->addDays(3),
        ]);

        // No end date — treated as ongoing, still counts.
        QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => Student::factory()->create(['school_id' => $school->id])->id,
            'teacher_id' => $teacherUser->id,
            'start_date' => now()->subDays(1),
            'end_date' => null,
        ]);

        // Already ended — must not count.
        QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => Student::factory()->create(['school_id' => $school->id])->id,
            'teacher_id' => $teacherUser->id,
            'start_date' => now()->subDays(10),
            'end_date' => now()->subDays(1),
        ]);

        // Not started yet — must not count.
        QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => Student::factory()->create(['school_id' => $school->id])->id,
            'teacher_id' => $teacherUser->id,
            'start_date' => now()->addDays(1),
            'end_date' => now()->addDays(10),
        ]);

        $response = $this->actingAs($adminUser)->get(route('quran.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('stats.activeSchedules', 2));
    }
}
