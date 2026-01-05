<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Guardian;
use App\Models\User;
use App\Models\School;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates sample documents for students, teachers, and guardians
     */
    public function run(): void
    {
        $this->command->info('📄 Seeding Documents...');

        // Get all schools
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        foreach ($schools as $school) {
            $documentCount = 0;

            // Get admin user for uploaded_by
            $adminUser = User::where('school_id', $school->id)
                ->where('role', 'admin')
                ->first();

            if (!$adminUser) {
                $this->command->warn("  ⚠️  {$school->name}: No admin user found, skipping...");
                continue;
            }

            // Seed Teacher Documents
            $teachers = Teacher::where('school_id', $school->id)->get();
            $teacherCategories = DocumentCategory::where('school_id', $school->id)
                ->where('entity_type', 'Teacher')
                ->get();

            foreach ($teachers as $teacher) {
                foreach ($teacherCategories as $category) {
                    // Create 1 document per required category, 50% chance for optional
                    if ($category->is_required || rand(0, 1)) {
                        $created = $this->createDocument(
                            $school->id,
                            $category,
                            'App\Models\Teacher',
                            $teacher->id,
                            $adminUser
                        );
                        if ($created) $documentCount++;
                    }
                }
            }

            // Seed Student Documents
            $students = Student::where('school_id', $school->id)->get();
            $studentCategories = DocumentCategory::where('school_id', $school->id)
                ->where('entity_type', 'Student')
                ->get();

            foreach ($students as $student) {
                foreach ($studentCategories as $category) {
                    // Create 1 document per required category, 60% chance for optional
                    if ($category->is_required || rand(0, 10) > 4) {
                        $created = $this->createDocument(
                            $school->id,
                            $category,
                            'App\Models\Student',
                            $student->id,
                            $adminUser
                        );
                        if ($created) $documentCount++;
                    }
                }
            }

            // Seed Guardian Documents
            $guardians = Guardian::where('school_id', $school->id)->get();
            $guardianCategories = DocumentCategory::where('school_id', $school->id)
                ->where('entity_type', 'Guardian')
                ->get();

            foreach ($guardians as $guardian) {
                foreach ($guardianCategories as $category) {
                    // Create 1 document per required category, 70% chance for optional
                    if ($category->is_required || rand(0, 10) > 3) {
                        $created = $this->createDocument(
                            $school->id,
                            $category,
                            'App\Models\Guardian',
                            $guardian->id,
                            $adminUser
                        );
                        if ($created) $documentCount++;
                    }
                }
            }

            $this->command->info("  ✅ {$school->name}: {$documentCount} documents created");
        }

        $this->command->info('✅ Documents seeded successfully!');
    }

    /**
     * Create a document record
     */
    private function createDocument(
        int $schoolId,
        DocumentCategory $category,
        string $entityType,
        int $entityId,
        User $uploader
    ): bool {
        // Check if document already exists
        $exists = Document::where('school_id', $schoolId)
            ->where('document_category_id', $category->id)
            ->where('documentable_type', $entityType)
            ->where('documentable_id', $entityId)
            ->exists();

        if ($exists) {
            return false;
        }

        // Generate filename
        $extension = $category->allowed_extensions[0] ?? 'pdf';
        $storedFilename = Str::uuid() . '.' . $extension;
        $entityFolder = strtolower(class_basename($entityType)) . 's';
        $filePath = "documents/{$entityFolder}/{$storedFilename}";

        // Create dummy file content
        $this->createDummyFile($filePath, $category->name, $extension);

        // Random status (80% verified, 15% pending, 5% rejected)
        $rand = rand(1, 100);
        if ($rand <= 80) {
            $status = 'verified';
            $verifiedBy = $uploader->id;
            $verifiedAt = now()->subDays(rand(1, 30));
        } elseif ($rand <= 95) {
            $status = 'pending';
            $verifiedBy = null;
            $verifiedAt = null;
        } else {
            $status = 'rejected';
            $verifiedBy = $uploader->id;
            $verifiedAt = now()->subDays(rand(1, 10));
        }

        // Expiry date for documents that expire
        $expiryDate = null;
        if ($category->expires) {
            $expiryDate = now()->addYears(rand(1, 5))->format('Y-m-d');
        }

        Document::create([
            'school_id' => $schoolId,
            'document_category_id' => $category->id,
            'documentable_type' => $entityType,
            'documentable_id' => $entityId,
            'original_filename' => $this->generateFilename($category->name, $extension),
            'stored_filename' => $storedFilename,
            'file_path' => $filePath,
            'mime_type' => $this->getMimeType($extension),
            'file_size' => rand(50000, 500000), // 50KB to 500KB
            'status' => $status,
            'rejection_reason' => $status === 'rejected' ? 'Document quality is poor. Please upload a clearer scan.' : null,
            'expiry_date' => $expiryDate,
            'uploaded_by' => $uploader->id,
            'verified_by' => $verifiedBy,
            'verified_at' => $verifiedAt,
        ]);

        return true;
    }

    /**
     * Create a dummy file
     */
    private function createDummyFile(string $filePath, string $categoryName, string $extension): void
    {
        $content = "This is a sample {$categoryName} document.\n";
        $content .= "Generated on: " . now()->toDateTimeString() . "\n";
        $content .= "File type: {$extension}\n";

        Storage::put($filePath, $content);
    }

    /**
     * Generate a realistic filename
     */
    private function generateFilename(string $categoryName, string $extension): string
    {
        $slug = Str::slug($categoryName);
        $timestamp = now()->format('Ymd');
        return "{$slug}_{$timestamp}.{$extension}";
    }

    /**
     * Get MIME type for extension
     */
    private function getMimeType(string $extension): string
    {
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'zip' => 'application/zip',
        ];

        return $mimeTypes[$extension] ?? 'application/octet-stream';
    }
}
