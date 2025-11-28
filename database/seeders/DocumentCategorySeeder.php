<?php

namespace Database\Seeders;

use App\Models\DocumentCategory;
use App\Models\School;
use Illuminate\Database\Seeder;

class DocumentCategorySeeder extends Seeder
{
    public function run(): void
    {
  


            // ✅ Skip this seeder if not in local environment
            if (!app()->environment('local')) {
                $this->command->info('DocumentCategorySeeder skipped in non-local environment.');
                return;
            }
            
        $this->command->info('🗂️  Seeding Document Categories...');

        // Get all schools to create document categories for each
        $schools = School::all();

        if ($schools->isEmpty()) {
            $this->command->error('No schools found. Run SchoolSeeder first.');
            return;
        }

        $categoriesData = [
            // Teacher Documents
            [
                'name' => 'Curriculum Vitae (CV)',
                'slug' => 'cv',
                'entity_type' => 'Teacher',
                'is_required' => true,
                'description' => 'Detailed resume showing education, work experience, and qualifications',
                'max_file_size' => 5120, // 5MB
                'allowed_extensions' => ['pdf', 'doc', 'docx'],
                'expires' => false,
                'sort_order' => 1,
                'status' => 'active',
            ],
            [
                'name' => 'National ID / Passport',
                'slug' => 'national-id-teacher',
                'entity_type' => 'Teacher',
                'is_required' => true,
                'description' => 'Valid government-issued identification document',
                'max_file_size' => 2048, // 2MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => true,
                'expiry_alert_days' => 30,
                'sort_order' => 2,
                'status' => 'active',
            ],
            [
                'name' => 'Teaching Certificate',
                'slug' => 'teaching-certificate',
                'entity_type' => 'Teacher',
                'is_required' => true,
                'description' => 'TSC or equivalent teaching certification',
                'max_file_size' => 3072, // 3MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => true,
                'expiry_alert_days' => 60,
                'sort_order' => 3,
                'status' => 'active',
            ],
            [
                'name' => 'Academic Certificates',
                'slug' => 'academic-certificates',
                'entity_type' => 'Teacher',
                'is_required' => false,
                'description' => 'University degrees, diplomas, and other academic qualifications',
                'max_file_size' => 5120, // 5MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => false,
                'sort_order' => 4,
                'status' => 'active',
            ],
            [
                'name' => 'Police Clearance Certificate',
                'slug' => 'police-clearance',
                'entity_type' => 'Teacher',
                'is_required' => true,
                'description' => 'Certificate of good conduct from Kenya Police',
                'max_file_size' => 2048, // 2MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => true,
                'expiry_alert_days' => 30,
                'sort_order' => 5,
                'status' => 'active',
            ],

            // Student Documents
            [
                'name' => 'Birth Certificate',
                'slug' => 'birth-certificate',
                'entity_type' => 'Student',
                'is_required' => true,
                'description' => 'Official birth certificate from government registry',
                'max_file_size' => 2048, // 2MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => false,
                'sort_order' => 1,
                'status' => 'active',
            ],
            [
                'name' => 'Passport Photo',
                'slug' => 'passport-photo',
                'entity_type' => 'Student',
                'is_required' => true,
                'description' => 'Recent passport-size photograph (white background)',
                'max_file_size' => 1024, // 1MB
                'allowed_extensions' => ['jpg', 'png'],
                'expires' => false,
                'sort_order' => 2,
                'status' => 'active',
            ],
            [
                'name' => 'Previous School Report',
                'slug' => 'previous-school-report',
                'entity_type' => 'Student',
                'is_required' => false,
                'description' => 'Last term report card from previous school',
                'max_file_size' => 3072, // 3MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => false,
                'sort_order' => 3,
                'status' => 'active',
            ],
            [
                'name' => 'Transfer Letter',
                'slug' => 'transfer-letter',
                'entity_type' => 'Student',
                'is_required' => false,
                'description' => 'Official transfer letter from previous school',
                'max_file_size' => 2048, // 2MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => false,
                'sort_order' => 4,
                'status' => 'active',
            ],
            [
                'name' => 'Medical Records',
                'slug' => 'medical-records',
                'entity_type' => 'Student',
                'is_required' => false,
                'description' => 'Immunization card and medical history',
                'max_file_size' => 3072, // 3MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => false,
                'sort_order' => 5,
                'status' => 'active',
            ],

            // Guardian Documents
            [
                'name' => 'National ID / Passport',
                'slug' => 'national-id-guardian',
                'entity_type' => 'Guardian',
                'is_required' => true,
                'description' => 'Valid government-issued identification document',
                'max_file_size' => 2048, // 2MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => true,
                'expiry_alert_days' => 30,
                'sort_order' => 1,
                'status' => 'active',
            ],
            [
                'name' => 'Proof of Residence',
                'slug' => 'proof-of-residence',
                'entity_type' => 'Guardian',
                'is_required' => false,
                'description' => 'Utility bill, lease agreement, or ownership documents',
                'max_file_size' => 2048, // 2MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => false,
                'sort_order' => 2,
                'status' => 'active',
            ],

            // Global Documents (for all entity types)
            [
                'name' => 'Signed Agreement',
                'slug' => 'signed-agreement',
                'entity_type' => null, // Global
                'is_required' => false,
                'description' => 'Signed agreements, contracts, or consent forms',
                'max_file_size' => 3072, // 3MB
                'allowed_extensions' => ['pdf'],
                'expires' => false,
                'sort_order' => 1,
                'status' => 'active',
            ],
        ];

        // Create document categories for each school
        $totalCreated = 0;
        foreach ($schools as $school) {
            foreach ($categoriesData as $category) {
                DocumentCategory::create(array_merge($category, ['school_id' => $school->id]));
                $totalCreated++;
            }
        }

        $this->command->info("✅ {$totalCreated} document categories seeded successfully across all schools!");
    }
}