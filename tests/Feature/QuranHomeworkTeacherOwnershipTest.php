<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * QuranHomeworkPolicy::update()/delete() previously allowed any teacher at
 * the school to update, delete, grade, or mark-ungraded any other teacher's
 * homework record — no ownership check at all. Scoped to teacher_id
 * (2026-08-26 decision), mirroring QuranSchedulePolicy. grade() and
 * markUngraded() both authorize against 'update', so scoping that one
 * ability covers all four actions.
 */
class QuranHomeworkTeacherOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_owning_teacher_cannot_update_another_teachers_homework(): void
    {
        $this->withoutVite();
        $this->fakeQuranApi();

        $school = School::factory()->create();
        $owningTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $owningTeacherUser->id]);
        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $owningTeacherUser->id,
        ]);

        $response = $this->actingAs($otherTeacherUser)
            ->put(route('quran-homework.update', $homework->id), [
                'surah_to' => 2,
                'verse_to' => 10,
                'reading_type' => 'new_learning',
            ]);

        $response->assertForbidden();
    }

    public function test_non_owning_teacher_cannot_delete_another_teachers_homework(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $owningTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $owningTeacherUser->id]);
        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $owningTeacherUser->id,
        ]);

        $response = $this->actingAs($otherTeacherUser)
            ->delete(route('quran-homework.destroy', $homework->id));

        $response->assertForbidden();
        $this->assertDatabaseHas('quran_homework', ['id' => $homework->id]);
    }

    public function test_non_owning_teacher_cannot_grade_another_teachers_homework(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $owningTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $owningTeacherUser->id]);
        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $owningTeacherUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($otherTeacherUser)
            ->post(route('quran-homework.grade', $homework->id), [
                'quality_rating' => 'excellent',
            ]);

        $response->assertForbidden();
        $this->assertSame('pending', $homework->fresh()->status);
    }

    public function test_non_owning_teacher_cannot_mark_ungraded_another_teachers_homework(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $owningTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $owningTeacherUser->id]);
        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $owningTeacherUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($otherTeacherUser)
            ->post(route('quran-homework.mark-ungraded', $homework->id), [
                'status' => 'absent',
            ]);

        $response->assertForbidden();
        $this->assertSame('pending', $homework->fresh()->status);
    }

    public function test_admin_can_still_update_any_teachers_homework(): void
    {
        $this->withoutVite();
        $this->fakeQuranApi();

        $school = School::factory()->create();
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
        ]);

        $response = $this->actingAs($adminUser)
            ->put(route('quran-homework.update', $homework->id), [
                'surah_to' => 2,
                'verse_to' => 10,
                'reading_type' => 'new_learning',
            ]);

        $response->assertRedirect();
    }

    protected function fakeQuranApi(): void
    {
        \Illuminate\Support\Facades\Http::fake([
            'api.quran.com/api/v4/chapters' => \Illuminate\Support\Facades\Http::response([
                'chapters' => [
                    ['id' => 2, 'name_simple' => 'Al-Baqarah', 'name_arabic' => 'البقرة', 'verses_count' => 286],
                ],
            ], 200),
            'api.quran.com/*' => \Illuminate\Support\Facades\Http::response([], 200),
        ]);
    }
}
