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
        if (!Schema::hasTable('timetable_conflicts')) {
            Schema::create('timetable_conflicts', function (Blueprint $table) {
                $table->id();
                
                // Multi-tenancy
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                
                // Conflict context - CASCADE DELETE (conflicts belong to timetable)
                $table->foreignId('timetable_template_id')->constrained('timetable_templates')->cascadeOnDelete();
                
                // Conflicting slots - CASCADE DELETE (if slot deleted, conflict is resolved)
                $table->foreignId('slot_id_1')->constrained('timetable_slots')->cascadeOnDelete();
                $table->foreignId('slot_id_2')->nullable()->constrained('timetable_slots')->cascadeOnDelete();
                
                // Conflict type
                $table->enum('conflict_type', [
                    'teacher_double_booking',  // Teacher assigned to 2+ slots at same time
                    'room_double_booking',     // Room assigned to 2+ slots at same time
                    'teacher_unavailable',     // Teacher marked unavailable for this time
                    'exceeds_max_periods',     // Teacher exceeds daily/weekly period limit
                    'no_break',                // No break between consecutive periods
                    'invalid_time',            // Time slot issues
                    'other'
                ])->default('teacher_double_booking');
                
                // Conflict details
                $table->text('description'); // Human-readable conflict description
                $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
                
                // Resolution
                $table->enum('status', [
                    'detected',    // Conflict found
                    'acknowledged', // Admin aware
                    'resolved',    // Fixed
                    'ignored'      // Intentionally ignored
                ])->default('detected');
                
                $table->text('resolution_notes')->nullable();
                $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('resolved_at')->nullable();
                
                $table->timestamps();
                
                // Indexes
                $table->index(['timetable_template_id', 'status']);
                $table->index(['conflict_type', 'severity']);
                $table->index(['school_id', 'status']);
                $table->index(['slot_id_1']);
                $table->index(['slot_id_2']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timetable_conflicts');
    }
};

