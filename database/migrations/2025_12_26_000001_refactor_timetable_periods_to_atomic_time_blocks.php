<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Refactor timetable periods to use atomic time blocks with proper ordering.
     * - Add 'order' column for chronological sequencing
     * - Make 'period_number' nullable (used only for lesson labeling)
     * - Remove unique constraint on (school_id, period_number)
     * - Add unique constraint on (school_id, order)
     */
    public function up(): void
    {
        Schema::table('timetable_periods', function (Blueprint $table) {
            // Drop the old unique constraint on period_number
            $table->dropUnique('unique_period_number');
            
            // Drop the index on period_number (we'll recreate it as non-unique)
            $table->dropIndex(['school_id', 'period_number']);
        });

        Schema::table('timetable_periods', function (Blueprint $table) {
            // Add the new 'order' column (will be populated below)
            $table->unsignedInteger('order')->after('period_number')->nullable();
            
            // Make period_number nullable (it's now just a label for lessons)
            $table->unsignedInteger('period_number')->nullable()->change();
            
            // Add lesson_number as an explicit field for lesson periods
            $table->unsignedInteger('lesson_number')->nullable()->after('period_number')
                ->comment('Lesson number (e.g., 1, 2, 3) - only for lesson-type periods');
        });

        // Migrate existing data: copy period_number to order and lesson_number
        DB::statement('UPDATE timetable_periods SET `order` = period_number');
        DB::statement('UPDATE timetable_periods SET lesson_number = period_number WHERE period_type = "lesson"');

        Schema::table('timetable_periods', function (Blueprint $table) {
            // Make order NOT NULL now that data is migrated
            $table->unsignedInteger('order')->nullable(false)->change();
            
            // Add unique constraint on (school_id, order)
            $table->unique(['school_id', 'order'], 'unique_period_order');
            
            // Add indexes for performance
            $table->index(['school_id', 'order'], 'idx_school_order');
            $table->index(['school_id', 'lesson_number'], 'idx_school_lesson_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timetable_periods', function (Blueprint $table) {
            // Drop new constraints and indexes
            $table->dropUnique('unique_period_order');
            $table->dropIndex('idx_school_order');
            $table->dropIndex('idx_school_lesson_number');
            
            // Drop new columns
            $table->dropColumn(['order', 'lesson_number']);
        });

        Schema::table('timetable_periods', function (Blueprint $table) {
            // Restore period_number as NOT NULL
            $table->unsignedInteger('period_number')->nullable(false)->change();
            
            // Restore old unique constraint
            $table->unique(['school_id', 'period_number'], 'unique_period_number');
            
            // Restore old index
            $table->index(['school_id', 'period_number']);
        });
    }
};

