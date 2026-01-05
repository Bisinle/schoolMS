<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DocumentCategory;
use App\Models\School;

class DocumentCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates document categories for Teachers, Students, and Guardians
     */
    public function run(): void
    {
        $this->command->info('📁 Seeding Document Categories...');

        // Get all schools
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
                'description' => 'TSC certificate or teaching qualification',
                'max_file_size' => 3072, // 3MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => false,
                'sort_order' => 3,
                'status' => 'active',
            ],
            [
                'name' => 'Academic Certificates',
                'slug' => 'academic-certificates-teacher',
                'entity_type' => 'Teacher',
                'is_required' => true,
                'description' => 'Degree, diploma, or other academic qualifications',
                'max_file_size' => 5120, // 5MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => false,
                'sort_order' => 4,
                'status' => 'active',
            ],

            // Student Documents
            [
                'name' => 'Birth Certificate',
                'slug' => 'birth-certificate',
                'entity_type' => 'Student',
                'is_required' => true,
                'description' => 'Official birth certificate',
                'max_file_size' => 2048, // 2MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => false,
                'sort_order' => 1,
                'status' => 'active',
            ],
            [
                'name' => 'Immunization Card',
                'slug' => 'immunization-card',
                'entity_type' => 'Student',
                'is_required' => true,
                'description' => 'Vaccination records and immunization card',
                'max_file_size' => 2048, // 2MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => false,
                'sort_order' => 2,
                'status' => 'active',
            ],
            [
                'name' => 'Previous School Report',
                'slug' => 'previous-school-report',
                'entity_type' => 'Student',
                'is_required' => false,
                'description' => 'Report card from previous school (if applicable)',
                'max_file_size' => 3072, // 3MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => false,
                'sort_order' => 3,
                'status' => 'active',
            ],
            [
                'name' => 'Transfer Certificate',
                'slug' => 'transfer-certificate',
                'entity_type' => 'Student',
                'is_required' => false,
                'description' => 'Transfer certificate from previous school',
                'max_file_size' => 2048, // 2MB
                'allowed_extensions' => ['pdf', 'jpg', 'png'],
                'expires' => false,
                'sort_order' => 4,
                'status' => 'active',
            ],
            [
                'name' => 'Passport Photo',
                'slug' => 'passport-photo-student',
                'entity_type' => 'Student',
                'is_required' => true,
                'description' => 'Recent passport-size photograph',
                'max_file_size' => 1024, // 1MB
                'allowed_extensions' => ['jpg', 'png'],
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
        ];

        // Create document categories for each school
        $totalCreated = 0;
        foreach ($schools as $school) {
            $categoryCount = 0;

            foreach ($categoriesData as $category) {
                // Check if category already exists
                $exists = DocumentCategory::where('school_id', $school->id)
                    ->where('slug', $category['slug'])
                    ->exists();

                if (!$exists) {
                    DocumentCategory::create(array_merge($category, ['school_id' => $school->id]));
                    $categoryCount++;
                    $totalCreated++;
                }
            }

            if ($categoryCount > 0) {
                $this->command->info("  ✅ {$school->name}: {$categoryCount} document categories created");
            } else {
                $this->command->warn("  ⚠️  {$school->name}: Document categories already exist");
            }
        }

        $this->command->info("✅ {$totalCreated} document categories seeded successfully!");
    }
}
