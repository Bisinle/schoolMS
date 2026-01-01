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
        if (!Schema::hasTable('teacher_availability')) {
            Schema::create('teacher_availability', function (Blueprint $table) {
                $table->id();
                
                // Multi-tenancy
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                
                // Teacher reference - NO CASCADE DELETE on existing table
                $table->foreignId('teacher_id')->constrained('teachers')->restrictOnDelete();
                
                // Academic term context (optional - can be term-specific or permanent)
                $table->foreignId('academic_term_id')->nullable()->constrained('academic_terms')->cascadeOnDelete();
                
                // Availability schedule
                $table->enum('day_of_week', [
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                    'sunday'
                ]);
                
                $table->time('start_time'); // e.g., '08:00:00'
                $table->time('end_time'); // e.g., '15:00:00'
                
                // Availability type
                $table->enum('availability_type', [
                    'available',      // Teacher is available
                    'unavailable',    // Teacher is not available
                    'preferred',      // Teacher prefers this time
                    'limited'         // Limited availability
                ])->default('available');
                
                // Reason for unavailability
                $table->enum('reason', [
                    'personal',
                    'meeting',
                    'training',
                    'other_duty',
                    'health',
                    'other'
                ])->nullable();
                
                $table->text('notes')->nullable();
                $table->boolean('is_recurring')->default(true); // Repeats weekly
                $table->date('effective_from')->nullable(); // Start date
                $table->date('effective_until')->nullable(); // End date
                
                $table->timestamps();
                
                // Indexes
                $table->index(['teacher_id', 'day_of_week']);
                $table->index(['school_id', 'academic_term_id']);
                $table->index(['teacher_id', 'availability_type']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_availability');
    }
};

