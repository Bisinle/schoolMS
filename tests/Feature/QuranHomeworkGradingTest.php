<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuranHomeworkGradingTest extends TestCase
{
    use RefreshDatabase;

    public function test_grading_marks_status_graded_and_stores_assessment(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.grade', $homework->id), [
            'quality_rating' => 'excellent',
            'fluency_rating' => 5,
            'tajweed_rating' => 4,
            'mistakes_count' => 1,
        ]);

        $response->assertRedirect();

        $homework->refresh();
        $this->assertSame('graded', $homework->status);
        $this->assertSame('excellent', $homework->quality_rating);

        $this->assertDatabaseHas('quran_assessments', [
            'quran_homework_id' => $homework->id,
            'fluency_rating' => 5,
            'tajweed_rating' => 4,
        ]);
    }

    /**
     * A re-grade that supplies neither fluency_rating nor tajweed_rating
     * must not leave a prior grading pass's QuranAssessment row behind with
     * stale values — grade() must delete it, mirroring markUngraded().
     */
    public function test_regrading_without_ratings_deletes_the_stale_assessment(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'pending',
        ]);

        // First grading pass: leaves ratings behind.
        $this->actingAs($teacherUser)->post(route('quran-homework.grade', $homework->id), [
            'quality_rating' => 'excellent',
            'fluency_rating' => 5,
            'tajweed_rating' => 4,
        ]);
        $this->assertNotNull($homework->assessment()->first());

        // Re-grade with no ratings supplied at all.
        $response = $this->actingAs($teacherUser)->post(route('quran-homework.grade', $homework->id), [
            'quality_rating' => 'moderate',
        ]);

        $response->assertRedirect();

        $homework->refresh();
        $this->assertSame('graded', $homework->status);
        $this->assertSame('moderate', $homework->quality_rating);
        $this->assertNull($homework->assessment()->first());
    }

    public function test_marking_absent_clears_any_existing_assessment_and_quality_rating(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'graded',
            'quality_rating' => 'excellent',
        ]);
        $homework->assessment()->create(['school_id' => $school->id, 'fluency_rating' => 5]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.mark-ungraded', $homework->id), [
            'status' => 'absent',
            'notes' => 'Student was absent.',
        ]);

        $response->assertRedirect();

        $homework->refresh();
        $this->assertSame('absent', $homework->status);
        $this->assertNull($homework->quality_rating);
        $this->assertNull($homework->assessment()->first());
    }

    public function test_marking_not_prepared_is_accepted_as_a_distinct_status(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.mark-ungraded', $homework->id), [
            'status' => 'not_prepared',
        ]);

        $response->assertRedirect();
        $this->assertSame('not_prepared', $homework->fresh()->status);
    }

    public function test_mark_ungraded_rejects_an_invalid_status_value(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $student = Student::factory()->create(['school_id' => $school->id]);

        $homework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($teacherUser)->post(route('quran-homework.mark-ungraded', $homework->id), [
            'status' => 'graded', // not a valid value for this endpoint — grading has its own action
        ]);

        $response->assertSessionHasErrors('status');
    }
}
