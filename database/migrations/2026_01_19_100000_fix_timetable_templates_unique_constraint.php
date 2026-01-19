<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Fix the unique constraint issue on timetable_templates.
     * The old constraint prevented multiple draft templates for the same grade/term.
     *
     * Solution: Drop the problematic unique constraint and enforce uniqueness
     * at the application level for active templates only.
     */
    public function up(): void
    {
        try {
            // First, check if the constraint exists
            $indexes = DB::select("SHOW INDEX FROM timetable_templates WHERE Key_name = 'unique_active_timetable'");

            if (!empty($indexes)) {
                // Temporarily disable foreign key checks to allow dropping the index
                DB::statement('SET FOREIGN_KEY_CHECKS=0');

                // Drop the unique constraint using raw SQL
                DB::statement('ALTER TABLE timetable_templates DROP INDEX unique_active_timetable');

                // Re-enable foreign key checks
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            }
        } catch (\Exception $e) {
            // Re-enable foreign key checks in case of error
            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            // If it fails, the constraint might not exist or already dropped
            // Log but continue
            Log::info('Could not drop unique_active_timetable index: ' . $e->getMessage());
        }

        try {
            // Check if the new index already exists
            $newIndexes = DB::select("SHOW INDEX FROM timetable_templates WHERE Key_name = 'idx_template_lookup'");

            if (empty($newIndexes)) {
                // Add a regular index for performance (not unique)
                DB::statement('CREATE INDEX idx_template_lookup ON timetable_templates (grade_id, stream_id, academic_term_id, is_active)');
            }
        } catch (\Exception $e) {
            // If it fails, the index might already exist
            Log::info('Could not create idx_template_lookup index: ' . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            // Drop the index we added
            DB::statement('ALTER TABLE timetable_templates DROP INDEX idx_template_lookup');
        } catch (\Exception $e) {
            Log::info('Could not drop idx_template_lookup index: ' . $e->getMessage());
        }

        try {
            // Temporarily disable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            // Restore the old unique constraint
            DB::statement('CREATE UNIQUE INDEX unique_active_timetable ON timetable_templates (grade_id, academic_term_id, is_active)');

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        } catch (\Exception $e) {
            // Re-enable foreign key checks in case of error
            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            Log::info('Could not create unique_active_timetable index: ' . $e->getMessage());
        }
    }
};

