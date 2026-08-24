<?php

namespace Tests\Feature;

use App\Models\Grade;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Closes the write-path gap found during the teacher-subject-grade audit:
 * QuranScheduleController::store() had no grade check at all, so a teacher
 * could create a schedule for any student in the school regardless of the
 * grade_teacher relationship. These tests lock in the fix.
 */
class QuranScheduleGradeAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_cannot_create_schedule_for_student_outside_assigned_grade(): void
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
            ->post(route('quran-schedule.store'), [
                'student_id' => $student->id,
                'surah_from' => 1,
                'verse_from' => 1,
                'surah_to' => 2,
                'verse_to' => 5,
                'start_date' => now()->toDateString(),
            ]);

        $response->assertStatus(403);
        $this->assertDatabaseCount('quran_schedules', 0);
    }

    public function test_teacher_can_create_schedule_for_student_in_assigned_grade(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade 2', 'level' => 'primary']);
        $teacher->grades()->attach($grade->id);

        $student = Student::factory()->create(['school_id' => $school->id, 'grade_id' => $grade->id]);

        $response = $this->actingAs($teacherUser)
            ->post(route('quran-schedule.store'), [
                'student_id' => $student->id,
                'surah_from' => 1,
                'verse_from' => 1,
                'surah_to' => 2,
                'verse_to' => 5,
                'start_date' => now()->toDateString(),
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('quran_schedules', ['student_id' => $student->id]);
    }

    public function test_admin_can_create_schedule_for_student_in_any_grade(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();

        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $grade = Grade::factory()->create(['school_id' => $school->id, 'name' => 'Grade 5', 'level' => 'primary']);
        $student = Student::factory()->create(['school_id' => $school->id, 'grade_id' => $grade->id]);

        $response = $this->actingAs($adminUser)
            ->post(route('quran-schedule.store'), [
                'student_id' => $student->id,
                'surah_from' => 1,
                'verse_from' => 1,
                'surah_to' => 2,
                'verse_to' => 5,
                'start_date' => now()->toDateString(),
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('quran_schedules', ['student_id' => $student->id]);
    }
}
