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
        Schema::create('blueprint_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_day_blueprint_id')->constrained()->cascadeOnDelete();
            
            // Sequence order in the day (1, 2, 3, ...)
            $table->integer('sequence_order');
            
            // Period type
            $table->enum('period_type', [
                'lesson',
                'short_break',
                'breakfast',
                'lunch',
                'prayer',
                'sports',
                'activity'
            ]);
            
            // Duration in minutes
            $table->integer('duration_minutes'); // e.g., 35, 40, 15, 30
            
            // Priority band for lesson periods (null for non-lesson periods)
            $table->enum('priority_band', [
                'morning_high',  // For fresh-mind subjects (Math, Science)
                'neutral',       // Mid-day
                'afternoon_low'  // Low-energy subjects (Arts, PE)
            ])->nullable();
            
            // Whether this period can be used for teaching
            $table->boolean('is_teachable')->default(false); // true only for lesson type
            
            // Calculated times (based on blueprint start_time + sum of previous durations)
            $table->time('start_time');
            $table->time('end_time'); // start_time + duration
            
            $table->timestamps();
            
            // Index for efficient querying
            $table->index(['level_day_blueprint_id', 'sequence_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blueprint_periods');
    }
};

