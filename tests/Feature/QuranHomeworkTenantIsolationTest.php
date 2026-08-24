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

class QuranHomeworkTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * An admin from School B must not be able to view homework belonging to School A.
     */
    public function test_admin_cannot_view_another_schools_homework(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $schoolB = School::factory()->create();

        $teacherUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'teacher']);
        $teacherA = Teacher::factory()->create(['school_id' => $schoolA->id, 'user_id' => $teacherUserA->id]);
        $guardianUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'guardian']);
        $guardianA = Guardian::factory()->create(['school_id' => $schoolA->id, 'user_id' => $guardianUserA->id]);
        $studentA = Student::factory()->create(['school_id' => $schoolA->id, 'guardian_id' => $guardianA->id]);

        $homeworkA = QuranHomework::factory()->create([
            'school_id' => $schoolA->id,
            'student_id' => $studentA->id,
            'teacher_id' => $teacherUserA->id,
        ]);

        $adminUserB = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'admin']);

        $response = $this->actingAs($adminUserB)
            ->get(route('quran-homework.show', $homeworkA->id));

        $response->assertStatus(404);
    }

    /**
     * A teacher from School B must not be able to delete homework belonging to School A.
     */
    public function test_teacher_cannot_delete_another_schools_homework(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $schoolB = School::factory()->create();

        $teacherUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'teacher']);
        $teacherA = Teacher::factory()->create(['school_id' => $schoolA->id, 'user_id' => $teacherUserA->id]);
        $guardianUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'guardian']);
        $guardianA = Guardian::factory()->create(['school_id' => $schoolA->id, 'user_id' => $guardianUserA->id]);
        $studentA = Student::factory()->create(['school_id' => $schoolA->id, 'guardian_id' => $guardianA->id]);

        $homeworkA = QuranHomework::factory()->create([
            'school_id' => $schoolA->id,
            'student_id' => $studentA->id,
            'teacher_id' => $teacherUserA->id,
        ]);

        $teacherUserB = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $schoolB->id, 'user_id' => $teacherUserB->id]);

        $response = $this->actingAs($teacherUserB)
            ->delete(route('quran-homework.destroy', $homeworkA->id));

        $response->assertStatus(404);

        $this->assertDatabaseHas('quran_homework', ['id' => $homeworkA->id]);
    }

    /**
     * A teacher from School B must not be able to create homework for a
     * student who belongs to School A, even by supplying that student's ID
     * directly. Before the fix, `student_id => exists:students,id` accepted
     * any student system-wide.
     */
    public function test_teacher_cannot_create_homework_for_another_schools_student(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $schoolB = School::factory()->create();

        $guardianUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'guardian']);
        $guardianA = Guardian::factory()->create(['school_id' => $schoolA->id, 'user_id' => $guardianUserA->id]);
        $studentA = Student::factory()->create(['school_id' => $schoolA->id, 'guardian_id' => $guardianA->id]);

        $teacherUserB = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $schoolB->id, 'user_id' => $teacherUserB->id]);

        $response = $this->actingAs($teacherUserB)
            ->post(route('quran-homework.store'), [
                'student_id' => $studentA->id,
                'reading_type' => 'new_learning',
                'surah_to' => 2,
                'verse_to' => 5,
            ]);

        $response->assertSessionHasErrors('student_id');

        $this->assertDatabaseMissing('quran_homework', ['student_id' => $studentA->id]);
    }
}
