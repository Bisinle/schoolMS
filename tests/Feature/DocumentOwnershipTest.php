<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\Guardian;
use App\Models\School;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * DocumentPolicy::view() and ::delete() both scope teacher access to their
 * own uploaded-for-self documents (documentable_type/id match) and guardian
 * access to their own or their children's documents; ::delete() additionally
 * restricts to the uploader's own pending/rejected documents (matches the
 * Batch 8 frontend fix's formula exactly). Both reached via
 * DocumentController::show()/destroy()'s authorize() calls. Had no
 * negative-case test until now — added 2026-08-29 per the Phase 7
 * negative-case coverage backfill.
 */
class DocumentOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function makeCategory(School $school): DocumentCategory
    {
        return DocumentCategory::create([
            'name' => 'National ID',
            'slug' => 'national-id-' . uniqid(),
        ]);
    }

    private function makeDocumentForTeacher(School $school, DocumentCategory $category, Teacher $teacher, User $uploadedBy, string $status = 'pending'): Document
    {
        return Document::create([
            'school_id' => $school->id,
            'document_category_id' => $category->id,
            'documentable_type' => Teacher::class,
            'documentable_id' => $teacher->id,
            'original_filename' => 'id.pdf',
            'stored_filename' => uniqid() . '.pdf',
            'file_path' => 'documents/' . uniqid() . '.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'status' => $status,
            'uploaded_by' => $uploadedBy->id,
        ]);
    }

    public function test_teacher_cannot_view_another_teachers_document(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $category = $this->makeCategory($school);

        $ownerTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $ownerTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $ownerTeacherUser->id]);
        $document = $this->makeDocumentForTeacher($school, $category, $ownerTeacher, $ownerTeacherUser);

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)->get("/documents/{$document->id}");

        $response->assertForbidden();
    }

    public function test_teacher_can_view_own_document(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $category = $this->makeCategory($school);

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $document = $this->makeDocumentForTeacher($school, $category, $teacher, $teacherUser);

        $response = $this->actingAs($teacherUser)->get("/documents/{$document->id}");

        $response->assertOk();
    }

    public function test_guardian_cannot_view_another_guardians_child_document(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $category = $this->makeCategory($school);

        $ownerGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        $ownerGuardian = Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $ownerGuardianUser->id]);
        $child = \App\Models\Student::factory()->create(['school_id' => $school->id, 'guardian_id' => $ownerGuardian->id]);
        $document = Document::create([
            'school_id' => $school->id,
            'document_category_id' => $category->id,
            'documentable_type' => \App\Models\Student::class,
            'documentable_id' => $child->id,
            'original_filename' => 'birth-cert.pdf',
            'stored_filename' => uniqid() . '.pdf',
            'file_path' => 'documents/' . uniqid() . '.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'status' => 'pending',
            'uploaded_by' => $ownerGuardianUser->id,
        ]);

        $otherGuardianUser = User::factory()->create(['school_id' => $school->id, 'role' => 'guardian']);
        Guardian::factory()->create(['school_id' => $school->id, 'user_id' => $otherGuardianUser->id]);

        $response = $this->actingAs($otherGuardianUser)->get("/documents/{$document->id}");

        $response->assertForbidden();
    }

    public function test_admin_can_view_any_document(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $category = $this->makeCategory($school);
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $document = $this->makeDocumentForTeacher($school, $category, $teacher, $teacherUser);

        $response = $this->actingAs($adminUser)->get("/documents/{$document->id}");

        $response->assertOk();
    }

    public function test_teacher_cannot_delete_another_teachers_document(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $category = $this->makeCategory($school);

        $ownerTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $ownerTeacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $ownerTeacherUser->id]);
        $document = $this->makeDocumentForTeacher($school, $category, $ownerTeacher, $ownerTeacherUser, 'pending');

        $otherTeacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $otherTeacherUser->id]);

        $response = $this->actingAs($otherTeacherUser)->delete("/documents/{$document->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('documents', ['id' => $document->id, 'deleted_at' => null]);
    }

    public function test_owner_cannot_delete_own_verified_document(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $category = $this->makeCategory($school);

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $document = $this->makeDocumentForTeacher($school, $category, $teacher, $teacherUser, 'verified');

        $response = $this->actingAs($teacherUser)->delete("/documents/{$document->id}");

        $response->assertForbidden();
    }

    public function test_owner_can_delete_own_pending_document(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $category = $this->makeCategory($school);

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $document = $this->makeDocumentForTeacher($school, $category, $teacher, $teacherUser, 'pending');

        $response = $this->actingAs($teacherUser)->delete("/documents/{$document->id}");

        $response->assertRedirect();
        $this->assertSoftDeleted('documents', ['id' => $document->id]);
    }

    public function test_admin_can_delete_any_document(): void
    {
        $this->withoutVite();

        $school = School::factory()->create();
        $category = $this->makeCategory($school);
        $adminUser = User::factory()->create(['school_id' => $school->id, 'role' => 'admin']);

        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $teacher = Teacher::factory()->create(['school_id' => $school->id, 'user_id' => $teacherUser->id]);
        $document = $this->makeDocumentForTeacher($school, $category, $teacher, $teacherUser, 'verified');

        $response = $this->actingAs($adminUser)->delete("/documents/{$document->id}");

        $response->assertRedirect();
        $this->assertSoftDeleted('documents', ['id' => $document->id]);
    }
}
