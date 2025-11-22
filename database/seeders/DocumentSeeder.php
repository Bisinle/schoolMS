<?php

namespace Database\Seeders;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Guardian;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('📄 Seeding Documents...');

        // Ensure storage directories exist
        Storage::makeDirectory('documents/teachers');
        Storage::makeDirectory('documents/students');
        Storage::makeDirectory('documents/guardians');
        Storage::makeDirectory('documents/users');

        $admin = User::where('role', 'admin')->first();

        if (!$admin) {
            $this->command->error('No admin user found. Run UserSeeder first.');
            return;
        }

        $documentCount = 0;

        // Seed Teacher Documents
        $teachers = Teacher::with('user')->get();
        foreach ($teachers as $teacher) {
            $documentCount += $this->seedTeacherDocuments($teacher, $admin);
        }

        // Seed Student Documents
        $students = Student::limit(20)->get(); // Seed for first 20 students
        foreach ($students as $student) {
            $documentCount += $this->seedStudentDocuments($student, $admin);
        }

        // Seed Guardian Documents
        $guardians = Guardian::with('user')->limit(10)->get();
        foreach ($guardians as $guardian) {
            $documentCount += $this->seedGuardianDocuments($guardian, $admin);
        }

        $this->command->info("✅ {$documentCount} documents seeded successfully!");
    }

    private function seedTeacherDocuments(Teacher $teacher, User $admin): int
    {
        $count = 0;
        $categories = DocumentCategory::where('entity_type', 'Teacher')
            ->where('school_id', $teacher->school_id)
            ->get();

        foreach ($categories as $category) {
            // 80% chance to upload required docs, 50% chance for optional
            if ($category->is_required || rand(1, 100) <= 50) {
                $count++;
                $this->createDocument(
                    $category,
                    'App\Models\Teacher',
                    $teacher->id,
                    $teacher->school_id,
                    $teacher->user,
                    $admin
                );
            }
        }

        return $count;
    }

    private function seedStudentDocuments(Student $student, User $admin): int
    {
        $count = 0;
        $categories = DocumentCategory::where('entity_type', 'Student')
            ->where('school_id', $student->school_id)
            ->get();

        foreach ($categories as $category) {
            // 90% chance for required docs, 40% chance for optional
            if ($category->is_required || rand(1, 100) <= 40) {
                $count++;
                $this->createDocument(
                    $category,
                    'App\Models\Student',
                    $student->id,
                    $student->school_id,
                    $student->guardian->user,
                    $admin
                );
            }
        }

        return $count;
    }

    private function seedGuardianDocuments(Guardian $guardian, User $admin): int
    {
        $count = 0;
        $categories = DocumentCategory::where('entity_type', 'Guardian')
            ->where('school_id', $guardian->school_id)
            ->get();

        foreach ($categories as $category) {
            if ($category->is_required || rand(1, 100) <= 60) {
                $count++;
                $this->createDocument(
                    $category,
                    'App\Models\Guardian',
                    $guardian->id,
                    $guardian->school_id,
                    $guardian->user,
                    $admin
                );
            }
        }

        return $count;
    }

    private function createDocument(
        DocumentCategory $category,
        string $entityType,
        int $entityId,
        int $schoolId,
        User $uploader,
        User $admin
    ): void {
        // Generate fake PDF content
        $pdfContent = $this->generateFakePDF($category->name);
        
        // Generate UUID filename
        $extension = $category->allowed_extensions[0] ?? 'pdf';
        $storedFilename = Str::uuid() . '.' . $extension;
        
        // Determine folder
        $entityFolder = strtolower(class_basename($entityType)) . 's';
        $filePath = "documents/{$entityFolder}/{$storedFilename}";
        
        // Store fake file
        Storage::put($filePath, $pdfContent);
        
        // Random status (80% verified, 10% pending, 10% rejected)
        $rand = rand(1, 100);
        if ($rand <= 80) {
            $status = 'verified';
            $verifiedBy = $admin->id;
            $verifiedAt = now()->subDays(rand(1, 30));
        } elseif ($rand <= 90) {
            $status = 'pending';
            $verifiedBy = null;
            $verifiedAt = null;
        } else {
            $status = 'rejected';
            $verifiedBy = $admin->id;
            $verifiedAt = now()->subDays(rand(1, 10));
        }

        // Create expiry date if applicable
        $expiryDate = null;
        if ($category->expires) {
            // Random expiry: 50% future (valid), 30% expiring soon, 20% expired
            $daysOffset = rand(1, 100);
            if ($daysOffset <= 50) {
                $expiryDate = now()->addDays(rand(90, 730)); // 3 months to 2 years
            } elseif ($daysOffset <= 80) {
                $expiryDate = now()->addDays(rand(1, 29)); // Expiring within 30 days
            } else {
                $expiryDate = now()->subDays(rand(1, 180)); // Already expired
                $status = 'expired';
            }
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
            'file_size' => strlen($pdfContent),
            'status' => $status,
            'rejection_reason' => $status === 'rejected' ? 'Document quality is poor. Please upload a clearer scan.' : null,
            'expiry_date' => $expiryDate,
            'uploaded_by' => $uploader->id,
            'verified_by' => $verifiedBy,
            'verified_at' => $verifiedAt,
        ]);
    }

    private function generateFakePDF(string $categoryName): string
    {
        // Generate fake PDF-like content (simplified)
        return "%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
50 700 Td
({$categoryName} - Sample Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000315 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
420
%%EOF";
    }

    private function generateFilename(string $categoryName, string $extension): string
    {
        $slug = Str::slug($categoryName);
        $timestamp = now()->format('Y-m-d');
        return "{$slug}_{$timestamp}.{$extension}";
    }

    private function getMimeType(string $extension): string
    {
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
        ];

        return $mimeTypes[$extension] ?? 'application/octet-stream';
    }
}