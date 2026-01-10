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
        if (!Schema::hasColumn('timetable_templates', 'stream_id')) {
            Schema::table('timetable_templates', function (Blueprint $table) {
                // Add stream_id column (nullable - templates can exist without streams for backward compatibility)
                $table->foreignId('stream_id')->nullable()->after('grade_id')->constrained('streams')->nullOnDelete();

                // Index for performance
                $table->index(['school_id', 'grade_id', 'stream_id']);
            });
        }

        // Note: We're keeping the old unique constraint for now to maintain backward compatibility
        // The constraint allows one active template per (grade, term) combination
        // With streams, we'll enforce uniqueness at the application level to allow:
        // - One active template per (grade, stream, term) when stream is specified
        // - One active template per (grade, term) when stream is null
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timetable_templates', function (Blueprint $table) {
            // Drop stream_id column and its foreign key
            $table->dropForeign(['stream_id']);
            $table->dropIndex(['school_id', 'grade_id', 'stream_id']);
            $table->dropColumn('stream_id');
        });
    }
};

