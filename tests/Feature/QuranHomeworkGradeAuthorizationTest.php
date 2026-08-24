<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\QuranSchedule;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Closes the write-path gap found during the teacher-subject-grade audit:
 * QuranHomeworkController::store() had no grade check at all, so a teacher
 * could create homework for any student in the school regardless of the
 * grade_teacher relationship. These tests lock in the fix.
 */
class QuranHomeworkGradeAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_cannot_create_homework_for_student_outside_assigned_grade(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        $assignedGrade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade 2', 'level' => 'primary']);
        $teacher->grades()->attach($assignedGrade->id);

        $otherGrade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade 5', 'level' => 'primary']);
        $student = Student::factory()->create(['school_id' => $school->id, 'grade_id' => $otherGrade->id]);

        $response = $this->actingAs($teacherUser)
            ->post(route('quran-homework.store'), [
                'student_id' => $student->id,
                'reading_type' => 'new_learning',
                'surah_to' => 2,
                'verse_to' => 5,
            ]);

        $response->assertStatus(403);
        $this->assertDatabaseCount('quran_homework', 0);
    }

    public function test_teacher_can_create_homework_for_student_in_assigned_grade(): void
    {
        $this->withoutVite();
        $this->fakeQuranApi();

        $school = School::factory()->create();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade 2', 'level' => 'primary']);
        $teacher->grades()->attach($grade->id);

        $student = Student::factory()->create(['school_id' => $school->id, 'grade_id' => $grade->id]);

        QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'surah_from' => 2,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 286,
        ]);

        $response = $this->actingAs($teacherUser)
            ->post(route('quran-homework.store'), [
                'student_id' => $student->id,
                'reading_type' => 'new_learning',
                'surah_to' => 2,
                'verse_to' => 5,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('quran_homework', ['student_id' => $student->id]);
    }

    public function test_admin_can_create_homework_for_student_in_any_grade(): void
    {
        $this->withoutVite();
        $this->fakeQuranApi();

        $school = School::factory()->create();

        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade 5', 'level' => 'primary']);
        $student = Student::factory()->create(['school_id' => $school->id, 'grade_id' => $grade->id]);

        QuranSchedule::factory()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $adminUser->id,
            'surah_from' => 2,
            'verse_from' => 1,
            'surah_to' => 2,
            'verse_to' => 286,
        ]);

        $response = $this->actingAs($adminUser)
            ->post(route('quran-homework.store'), [
                'student_id' => $student->id,
                'reading_type' => 'new_learning',
                'surah_to' => 2,
                'verse_to' => 5,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('quran_homework', ['student_id' => $student->id]);
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
