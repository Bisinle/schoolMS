<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Subject;
use App\Models\School;

class ReplaceSubjectsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Deletes all existing subjects and creates new academic subjects
     */
    public function run(): void
    {
        $this->command->info('🔄 Starting Subject Replacement...');

        // Ask for confirmation
        if (!$this->command->confirm('This will DELETE ALL existing subjects and replace them. Continue?', false)) {
            $this->command->warn('❌ Operation cancelled by user');
            return;
        }

        $this->command->info('🗑️  Deleting all existing subjects...');

        // Delete all subjects (this will also remove pivot table entries due to cascade)
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('grade_subject')->truncate();
        DB::table('subjects')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('✓ All existing subjects deleted');

        // New subject list
        $newSubjects = [
            'Agriculture',
            'Arabic',
            'Creative Arts',
            'Creative Activities',
            'English',
            'English Activities',
            'Environmental Activities',
            'French',
            'German',
            'Indigenous Language',
            'Integrated Science',
            'IRE',
            'Kiswahili',
            'Mandarin',
            'Mathematics',
            'Pre-Technical Studies',
            'Science & Technology',
            'Social Studies',
        ];

        $subjectCount = count($newSubjects);
        $this->command->info("\n📚 Creating {$subjectCount} new subjects...");

        // Get all schools
        $schools = School::all();
        $totalCreated = 0;

        foreach ($schools as $school) {
            $this->command->info("\n--- School: {$school->name} ---");

            foreach ($newSubjects as $subjectName) {
                // Generate subject code (first 3 letters uppercase)
                $code = strtoupper(substr(str_replace(' ', '', $subjectName), 0, 3));
                
                // Determine category
                $category = in_array($subjectName, ['IRE', 'Arabic']) ? 'islamic' : 'academic';

                Subject::create([
                    'school_id' => $school->id,
                    'name' => $subjectName,
                    'code' => $code,
                    'category' => $category,
                    'status' => 'active',
                ]);

                $totalCreated++;
            }

            $this->command->info("  ✓ Created {$subjectCount} subjects for {$school->name}");
        }

        $this->command->info("\n✅ Subject Replacement Complete!");
        $this->command->info("📊 Summary:");
        $this->command->info("   - Schools processed: {$schools->count()}");
        $this->command->info("   - Total subjects created: {$totalCreated}");
        $this->command->info("   - Subjects per school: {$subjectCount}");
        
        $this->command->warn("\n⚠️  NOTE: You will need to re-assign subjects to grades!");
    }
}

