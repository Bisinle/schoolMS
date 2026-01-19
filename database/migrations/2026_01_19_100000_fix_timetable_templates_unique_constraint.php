<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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
        Schema::table('timetable_templates', function (Blueprint $table) {
            // Drop the problematic unique constraint
            // This constraint was preventing multiple draft templates
            $table->dropUnique('unique_active_timetable');
        });

        // Add a regular index for performance (not unique)
        // This helps with queries filtering by these columns
        Schema::table('timetable_templates', function (Blueprint $table) {
            $table->index(['grade_id', 'stream_id', 'academic_term_id', 'is_active'], 'idx_template_lookup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timetable_templates', function (Blueprint $table) {
            // Drop the index we added
            $table->dropIndex('idx_template_lookup');
        });

        // Restore the old unique constraint
        Schema::table('timetable_templates', function (Blueprint $table) {
            $table->unique(['grade_id', 'academic_term_id', 'is_active'], 'unique_active_timetable');
        });
    }
};

