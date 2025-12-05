<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Tuition fees with full-day and half-day pricing per grade.
     */
    public function up(): void
    {
        Schema::create('tuition_fees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->decimal('amount_full_day', 10, 2); // Full-day tuition
            $table->decimal('amount_half_day', 10, 2); // Half-day tuition
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['school_id', 'grade_id']);
            $table->index(['school_id', 'academic_year_id']);
            $table->index(['school_id', 'is_active']);
            
            // Ensure unique tuition fee per grade per academic year
            $table->unique(['grade_id', 'academic_year_id'], 'tuition_fees_grade_year_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tuition_fees');
    }
};

