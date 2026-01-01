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
        // Only create if table doesn't exist (idempotent)
        if (!Schema::hasTable('timetable_periods')) {
            Schema::create('timetable_periods', function (Blueprint $table) {
                $table->id();
                
                // Multi-tenancy
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                
                // Period definition (reusable across timetables)
                $table->string('name'); // e.g., "Period 1", "Morning Break", "Lunch"
                $table->integer('period_number')->unsigned(); // 1, 2, 3, etc.
                $table->time('start_time'); // e.g., '08:00:00'
                $table->time('end_time'); // e.g., '08:40:00'
                $table->integer('duration_minutes')->unsigned(); // Auto-calculated or manual
                
                // Period type
                $table->enum('period_type', [
                    'lesson',      // Regular teaching period
                    'break',       // Short break/recess
                    'lunch',       // Lunch break
                    'assembly',    // Morning/afternoon assembly
                    'activity',    // Extra-curricular
                    'study',       // Study hall
                    'other'        // Custom
                ])->default('lesson');
                
                // Configuration
                $table->boolean('is_break')->default(false); // Quick check for non-teaching periods
                $table->boolean('is_active')->default(true);
                $table->text('description')->nullable();
                $table->string('color_code', 7)->nullable(); // Hex color for UI: #FF5733
                
                $table->timestamps();
                
                // Indexes
                $table->index(['school_id', 'is_active']);
                $table->index(['school_id', 'period_type']);
                $table->index(['school_id', 'period_number']);
                
                // Unique constraint: period number per school
                $table->unique(['school_id', 'period_number'], 'unique_period_number');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timetable_periods');
    }
};

