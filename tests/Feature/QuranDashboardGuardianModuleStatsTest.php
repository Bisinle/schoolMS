<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\QuranHomework;
use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The Module Cards' "Quran Homework" / "Quran Schedules" total/thisMonth
 * counts (stats.homework / stats.schedule) previously showed the school-wide
 * totals to every role, including guardians — a mismatch with the card's
 * own click-through target once that's guardian-scoped. Confirms both are
 * now scoped via Guardian::allStudentIds(), same as the rest of the
 * guardian dashboard, and that another family's records at the same school
 * don't leak into the count.
 */
class QuranDashboardGuardianModuleStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guardian_module_card_counts_only_include_their_own_children(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);
        $ownChild = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id]);

        QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $ownChild->id,
            'teacher_id' => $teacherUser->id,
        ]);
        QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $ownChild->id,
            'teacher_id' => $teacherUser->id,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDays(10),
        ]);

        // Noise: another family at the same school with more records —
        // must not leak into this guardian's counts.
        $otherGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $otherGuardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $otherGuardianUser->id]);
        $otherChild = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $otherGuardian->id]);
        QuranHomework::factory()->count(3)->create([
            'school_id' => $school->id,
            'student_id' => $otherChild->id,
            'teacher_id' => $teacherUser->id,
        ]);
        QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $otherChild->id,
            'teacher_id' => $teacherUser->id,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDays(10),
        ]);

        $response = $this->actingAs($guardianUser)->get(route('quran.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('stats.homework.total', 1)
            ->where('stats.homework.thisMonth', 1)
            ->where('stats.schedule.total', 1)
            ->where('stats.schedule.thisMonth', 1)
        );
    }
}
