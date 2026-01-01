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
        if (!Schema::hasTable('timetable_templates')) {
            Schema::create('timetable_templates', function (Blueprint $table) {
                $table->id();
                
                // Multi-tenancy
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                
                // Core relationships - NO CASCADE DELETE on existing tables
                $table->foreignId('grade_id')->constrained('grades')->restrictOnDelete();
                $table->foreignId('academic_term_id')->constrained('academic_terms')->restrictOnDelete();
                
                // Template metadata
                $table->string('name'); // e.g., "Grade 1 - Term 1 2025"
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(false); // Only one active per grade per term
                $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
                
                // Week configuration
                $table->json('active_days')->nullable(); // ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                $table->time('school_start_time')->nullable(); // e.g., '08:00:00'
                $table->time('school_end_time')->nullable(); // e.g., '15:00:00'
                
                // Audit fields
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
                
                // Indexes for performance
                $table->index(['school_id', 'grade_id', 'academic_term_id']);
                $table->index(['school_id', 'is_active']);
                $table->index(['school_id', 'status']);
                
                // Unique constraint: one active timetable per grade per term
                $table->unique(['grade_id', 'academic_term_id', 'is_active'], 'unique_active_timetable');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timetable_templates');
    }
};

