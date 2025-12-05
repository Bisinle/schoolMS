<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Guardian fee preferences per student per term.
     * This stores the guardian's choices for tuition type, transport, and universal fees.
     */
    public function up(): void
    {
        Schema::create('guardian_fee_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('guardian_id')->constrained('guardians')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('academic_term_id')->constrained('academic_terms')->cascadeOnDelete();
            
            // Tuition preference
            $table->enum('tuition_type', ['full_day', 'half_day'])->default('full_day');
            
            // Transport preference
            $table->foreignId('transport_route_id')->nullable()->constrained('transport_routes')->nullOnDelete();
            $table->enum('transport_type', ['one_way', 'two_way'])->nullable();
            
            // Universal fees preferences (opt-in/opt-out)
            $table->boolean('include_food')->default(true);
            $table->boolean('include_sports')->default(true);
            
            // Additional notes
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['school_id', 'guardian_id']);
            $table->index(['school_id', 'student_id']);
            $table->index(['school_id', 'academic_term_id']);
            
            // Ensure unique preference per student per term
            $table->unique(['student_id', 'academic_term_id'], 'guardian_fee_prefs_student_term_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guardian_fee_preferences');
    }
};

