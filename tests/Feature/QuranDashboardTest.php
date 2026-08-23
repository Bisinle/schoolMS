<?php

namespace Tests\Feature;

use App\Models\QuranHomework;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
