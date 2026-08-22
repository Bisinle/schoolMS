<?php

namespace Tests\Feature;

use App\Models\QuranAssessment;
use App\Models\QuranHomework;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuranAssessmentTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_assessment_is_scoped_to_its_school(): void
    {
        $schoolA = School::factory()->create();
        $schoolB = School::factory()->create();

        $teacherUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $schoolA->id, 'user_id' => $teacherUserA->id]);
        $studentA = Student::factory()->create(['school_id' => $schoolA->id]);

        $homeworkA = QuranHomework::factory()->create([
            'school_id' => $schoolA->id,
            'student_id' => $studentA->id,
            'teacher_id' => $teacherUserA->id,
        ]);

        $this->actingAs($teacherUserA);
        $assessment = QuranAssessment::create([
            'quran_homework_id' => $homeworkA->id,
            'fluency_rating' => 5,
        ]);

        $this->assertSame($schoolA->id, $assessment->school_id);

        $teacherUserB = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'teacher']);
        $this->actingAs($teacherUserB);

        $this->assertNull(QuranAssessment::find($assessment->id));
    }
}
