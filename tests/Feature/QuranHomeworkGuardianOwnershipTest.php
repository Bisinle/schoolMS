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

/**
 * QuranHomeworkPolicy::view() only checks school_id — any guardian in the
 * school passes it. show() must additionally confirm the requesting
 * guardian is actually linked to the homework's student (the same check
 * studentReport()/studentHomework() already apply), otherwise one family
 * can enumerate sequential homework IDs and read another family's child's
 * surah ranges, quality ratings, and teacher notes.
 */
class QuranHomeworkGuardianOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_guardian_cannot_view_another_familys_child_homework_in_the_same_school(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);

        $ownGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $ownGuardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $ownGuardianUser->id]);
        $ownChild = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $ownGuardian->id]);

        $otherGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $otherGuardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $otherGuardianUser->id]);
        $otherChild = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $otherGuardian->id]);

        $otherChildsHomework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $otherChild->id,
            'teacher_id' => $teacherUser->id,
        ]);

        // Sanity check: own-guardian access still works.
        $ownHomework = QuranHomework::factory()->create([
            'school_id' => $school->id,
            'student_id' => $ownChild->id,
            'teacher_id' => $teacherUser->id,
        ]);
        $this->actingAs($ownGuardianUser)
            ->get(route('quran-homework.show', $ownHomework->id))
            ->assertOk();

        $response = $this->actingAs($ownGuardianUser)
            ->get(route('quran-homework.show', $otherChildsHomework->id));

        $response->assertForbidden();
    }
}
