<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if stream_id column already exists
        if (!Schema::hasColumn('grades', 'stream_id')) {
            Schema::table('grades', function (Blueprint $table) {
                // Add stream_id column (nullable - grades can exist without streams)
                $table->foreignId('stream_id')->nullable()->after('school_id')->constrained('streams')->nullOnDelete();

                // Index for performance
                $table->index(['school_id', 'stream_id']);
            });
        }

        // Drop old unique constraint and add new one that includes stream_id
        // Use try-catch to handle cases where constraints may already be modified
        try {
            Schema::table('grades', function (Blueprint $table) {
                // Drop existing unique constraint (actual name: grades_name_school_unique)
                $table->dropUnique('grades_name_school_unique');
            });
        } catch (\Exception $e) {
            // Constraint might already be dropped, continue
        }

        try {
            Schema::table('grades', function (Blueprint $table) {
                // Add new unique constraint: (school_id, name, stream_id)
                // This allows "Grade 1 North" and "Grade 1 South" but prevents duplicate "Grade 1 North"
                $table->unique(['school_id', 'name', 'stream_id'], 'unique_grade_stream');
            });
        } catch (\Exception $e) {
            // Constraint might already exist, continue
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            // Drop the new unique constraint
            $table->dropUnique('unique_grade_stream');

            // Restore old unique constraint with original name
            $table->unique(['name', 'school_id'], 'grades_name_school_unique');

            // Drop stream_id column
            $table->dropForeign(['stream_id']);
            $table->dropColumn('stream_id');
        });
    }
};
