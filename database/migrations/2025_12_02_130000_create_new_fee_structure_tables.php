<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration replaces the old fee structure with a new one.
     * It drops the old tables (if they exist) and creates new ones with updated schema.
     */
    public function up(): void
    {
        // Drop old tables if they exist (from previous migration)
        Schema::dropIfExists('fee_amounts');
        Schema::dropIfExists('fee_categories');

        // Create fee_categories table with new structure
        Schema::create('fee_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('name'); // e.g., "Sports", "Food", "Transport", "Library", "Tuition"
            $table->text('description')->nullable();
            $table->boolean('is_universal')->default(true); // true = applies to all grades, false = grade-specific
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Ensure unique category names per school
            $table->unique(['school_id', 'name']);
            $table->index(['school_id', 'is_active']);
        });

        // Create fee_amounts table
        Schema::create('fee_amounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('fee_category_id')->constrained('fee_categories')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->string('grade_range')->nullable(); // NULL for universal, "PP1-PP2", "1-3", "4-5", "6-8" for grade-specific
            $table->decimal('amount', 10, 2); // The actual fee amount
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['school_id', 'fee_category_id']);
            $table->index(['school_id', 'academic_year_id']);
            $table->index(['school_id', 'is_active']);
            
            // Ensure no duplicate grade ranges for same category in same year
            $table->unique(['fee_category_id', 'academic_year_id', 'grade_range'], 'fee_category_year_range_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_amounts');
        Schema::dropIfExists('fee_categories');
    }
};

