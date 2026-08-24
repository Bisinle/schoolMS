<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

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
        // Index checks use Schema::hasIndex() rather than the raw "SHOW INDEX"
        // SQL this replaced, since that's MySQL-only and breaks SQLite (used by
        // the test suite). Dropping/creating a non-FK index doesn't require
        // touching foreign key checks, so those statements are removed too.
        try {
            if (Schema::hasIndex('timetable_templates', 'unique_active_timetable')) {
                Schema::table('timetable_templates', function (Blueprint $table) {
                    $table->dropUnique('unique_active_timetable');
                });
            }
        } catch (\Exception $e) {
            // If it fails, the constraint might not exist or already dropped
            // Log but continue
            Log::info('Could not drop unique_active_timetable index: ' . $e->getMessage());
        }

        try {
            if (!Schema::hasIndex('timetable_templates', 'idx_template_lookup')) {
                Schema::table('timetable_templates', function (Blueprint $table) {
                    $table->index(['grade_id', 'stream_id', 'academic_term_id', 'is_active'], 'idx_template_lookup');
                });
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
            Schema::table('timetable_templates', function (Blueprint $table) {
                $table->dropIndex('idx_template_lookup');
            });
        } catch (\Exception $e) {
            Log::info('Could not drop idx_template_lookup index: ' . $e->getMessage());
        }

        try {
            // Restore the old unique constraint
            Schema::table('timetable_templates', function (Blueprint $table) {
                $table->unique(['grade_id', 'academic_term_id', 'is_active'], 'unique_active_timetable');
            });
        } catch (\Exception $e) {
            Log::info('Could not create unique_active_timetable index: ' . $e->getMessage());
        }
    }
};

