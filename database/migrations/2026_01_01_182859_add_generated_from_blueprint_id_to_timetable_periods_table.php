<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add tracking field to know which periods were auto-generated from blueprints.
     * This allows us to:
     * - Prevent duplicate generation
     * - Update existing periods on regeneration (preserving timetable_slot references)
     * - Distinguish auto-generated vs manually created periods
     */
    public function up(): void
    {
        Schema::table('timetable_periods', function (Blueprint $table) {
            // Track which blueprint generated this period (nullable for manual periods)
            $table->foreignId('generated_from_blueprint_id')
                ->nullable()
                ->after('school_id')
                ->constrained('level_day_blueprints')
                ->nullOnDelete();

            // Index for efficient querying
            $table->index(['school_id', 'generated_from_blueprint_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timetable_periods', function (Blueprint $table) {
            $table->dropForeign(['generated_from_blueprint_id']);
            $table->dropIndex(['school_id', 'generated_from_blueprint_id']);
            $table->dropColumn('generated_from_blueprint_id');
        });
    }
};
