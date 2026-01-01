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
        Schema::table('timetable_periods', function (Blueprint $table) {
            // Add grade_level column
            $table->enum('grade_level', ['ECD', 'LOWER PRIMARY', 'UPPER PRIMARY', 'JUNIOR SECONDARY'])
                ->after('school_id')
                ->nullable();

            // Drop the old unique constraint if it exists
            $table->dropUnique('unique_period_order');

            // Add new unique constraint scoped to school_id and grade_level
            $table->unique(['school_id', 'grade_level', 'order'], 'unique_period_order_per_grade_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timetable_periods', function (Blueprint $table) {
            // Drop the new unique constraint
            $table->dropUnique('unique_period_order_per_grade_level');

            // Restore the old unique constraint
            $table->unique(['school_id', 'order'], 'unique_period_order');

            // Drop the grade_level column
            $table->dropColumn('grade_level');
        });
    }
};

