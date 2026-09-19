<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\Guardian;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Data-contract test for the document display-name feature
 * (docs/superpowers/specs/2026-09-19-document-display-names-design.md).
 * getEntityName()/getDisplayName() in Documents/Index.jsx and Show.jsx are
 * plain client-side JS with no test runner in this repo — this test proves
 * the backend half (the eager-loaded shape those functions depend on) is
 * correct and regression-proof. It does not execute the JS itself; that is
 * covered by the manual Playwright pass in Task 4 of the implementation plan.
 */
class DocumentDisplayNameDataTest extends TestCase
{
    use RefreshDatabase;

    private function makeCategory(): DocumentCategory
    {
        return DocumentCategory::create([
            'name' => 'National ID',
            'slug' => 'national-id-'.uniqid(),
        ]);
    }

    private function makeDocument(School $school, DocumentCategory $category, string $documentableType, int $documentableId, User $uploadedBy): Document
    {
        return Document::create([
            'school_id' => $school->id,
            'document_category_id' => $category->id,
            'documentable_type' => $documentableType,
            'documentable_id' => $documentableId,
            'original_filename' => 'file.pdf',
            'stored_filename' => uniqid().'.pdf',
            'file_path' => 'documents/'.uniqid().'.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'status' => 'pending',
            'uploaded_by' => $uploadedBy->id,
        ]);
    }

    public function test_index_loads_teacher_owner_user_name(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher', 'name' => 'Hassan Ibrahim']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $document = $this->makeDocument($school, $category, Teacher::class, $teacher->id, $teacherUser);

        $response = $this->actingAs($admin)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('documents.data.0.id', $document->id)
            ->where('documents.data.0.documentable.user.name', 'Hassan Ibrahim')
        );
    }

    public function test_index_loads_guardian_owner_user_name(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian', 'name' => 'Amina Hassan']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);
        $document = $this->makeDocument($school, $category, Guardian::class, $guardian->id, $guardianUser);

        $response = $this->actingAs($admin)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('documents.data.0.id', $document->id)
            ->where('documents.data.0.documentable.user.name', 'Amina Hassan')
        );
    }

    public function test_index_loads_students_primary_guardian_and_user_name(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        // Guardians (with no explicit orderBy on Student::guardians()) come back
        // ordered by guardian id, which follows creation order here - not pivot
        // attach order. The father is created (and thus attached) first so he
        // lands at guardians.0 with is_primary=false, letting the assertions
        // below actually exercise the is_primary boolean cast for both values
        // instead of only ever observing "true" at index 0.
        $fatherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian', 'name' => 'Ali Mohamed']);
        $father = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $fatherUser->id]);

        $motherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian', 'name' => 'Amina Hassan']);
        $mother = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $motherUser->id]);

        $child = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $mother->id, 'first_name' => 'Yusuf', 'last_name' => 'Hassan']);
        $child->guardians()->attach($father->id, ['is_primary' => false, 'relationship' => 'father']);
        $child->guardians()->attach($mother->id, ['is_primary' => true, 'relationship' => 'mother']);

        $document = $this->makeDocument($school, $category, Student::class, $child->id, $motherUser);

        $response = $this->actingAs($admin)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('documents.data.0.id', $document->id)
            ->has('documents.data.0.documentable.guardians', 2)
            ->where('documents.data.0.documentable.guardians.0.pivot.is_primary', false)
            ->where('documents.data.0.documentable.guardians.1.pivot.is_primary', true)
            ->where('documents.data.0.documentable.guardians.1.user.name', 'Amina Hassan')
        );
    }

    public function test_index_falls_back_to_first_guardian_when_none_marked_primary(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian', 'name' => 'Omar Abdi']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);

        $child = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id, 'first_name' => 'Safia', 'last_name' => 'Abdi']);
        $child->guardians()->attach($guardian->id, ['is_primary' => false, 'relationship' => 'father']);

        $document = $this->makeDocument($school, $category, Student::class, $child->id, $admin);

        $response = $this->actingAs($admin)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('documents.data.0.documentable.guardians', 1)
            ->where('documents.data.0.documentable.guardians.0.user.name', 'Omar Abdi')
        );
    }

    public function test_index_returns_empty_guardians_array_when_student_has_no_pivot_guardians(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        // StudentFactory sets the legacy guardian_id column but attaches
        // nothing to the guardian_student pivot table - this is the
        // "somehow no guardian linked" edge case the spec calls out
        // (not expected in real data, but must not crash).
        $child = Student::factory()->create(['school_id' => $school->id, 'first_name' => 'Zainab', 'last_name' => 'Issa']);
        $document = $this->makeDocument($school, $category, Student::class, $child->id, $admin);

        $response = $this->actingAs($admin)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('documents.data.0.id', $document->id)
            ->has('documents.data.0.documentable.guardians', 0)
        );
    }

    public function test_index_shows_owner_name_for_soft_deleted_teacher(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher', 'name' => 'Khadija Ahmed']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $document = $this->makeDocument($school, $category, Teacher::class, $teacher->id, $teacherUser);

        // Mirrors TeacherController::destroy(), which soft-deletes both the
        // Teacher row and its linked User in the same transaction - this is
        // the exact shape of the 16 real documents found broken in dev data.
        $teacher->delete();
        $teacherUser->delete();

        $response = $this->actingAs($admin)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('documents.data.0.id', $document->id)
            ->where('documents.data.0.documentable.user.name', 'Khadija Ahmed')
        );
    }

    public function test_index_shows_owner_name_for_soft_deleted_guardian(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian', 'name' => 'Maryam Osman']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);
        $document = $this->makeDocument($school, $category, Guardian::class, $guardian->id, $guardianUser);

        // Mirrors GuardianController::destroy(), which soft-deletes both the
        // Guardian row and its linked User in the same transaction.
        $guardian->delete();
        $guardianUser->delete();

        $response = $this->actingAs($admin)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('documents.data.0.id', $document->id)
            ->where('documents.data.0.documentable.user.name', 'Maryam Osman')
        );
    }

    public function test_show_owner_name_survives_soft_deleted_teacher(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher', 'name' => 'Abdi Rahman']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $document = $this->makeDocument($school, $category, Teacher::class, $teacher->id, $teacherUser);

        $teacher->delete();
        $teacherUser->delete();

        $response = $this->actingAs($admin)->get("/documents/{$document->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('document.documentable.user.name', 'Abdi Rahman')
        );
    }

    public function test_index_never_leaks_soft_deleted_teacher_document_across_schools(): void
    {
        $this->withoutVite();

        $schoolA = School::factory()->create();
        $schoolB = School::factory()->create();
        $adminB = User::factory()->create(['school_id' => $schoolB->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $teacherUserA = User::factory()->create(['school_id' => $schoolA->id, 'role' => 'teacher', 'name' => 'Halima Yusuf']);
        $teacherA = Teacher::factory()->create(['school_id' => $schoolA->id, 'user_id' => $teacherUserA->id]);
        $this->makeDocument($schoolA, $category, Teacher::class, $teacherA->id, $teacherUserA);

        // Soft-delete the School A teacher (and their user) - constrain()'s
        // withTrashed() lifts SoftDeletingScope on the Teacher query, and this
        // test proves it does NOT also lift the independent SchoolScope that
        // BelongsToSchool registers, i.e. an admin in School B must never see
        // School A's (even soft-deleted-owner) documents.
        $teacherA->delete();
        $teacherUserA->delete();

        $response = $this->actingAs($adminB)->get('/documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('documents.data', 0)
        );
    }

    public function test_show_loads_students_primary_guardian_and_user_name(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $admin = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);
        $category = $this->makeCategory();

        $guardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian', 'name' => 'Fatima Ahmed']);
        $guardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $guardianUser->id]);

        $child = Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $guardian->id, 'first_name' => 'Ibrahim', 'last_name' => 'Aden']);
        $child->guardians()->attach($guardian->id, ['is_primary' => true, 'relationship' => 'mother']);

        $document = $this->makeDocument($school, $category, Student::class, $child->id, $guardianUser);

        $response = $this->actingAs($admin)->get("/documents/{$document->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('document.documentable.guardians.0.pivot.is_primary', true)
            ->where('document.documentable.guardians.0.user.name', 'Fatima Ahmed')
        );
    }
}
