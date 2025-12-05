<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Universal fees that apply to all grades (Food, Sports, etc.)
     */
    public function up(): void
    {
        Schema::create('universal_fees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->enum('fee_type', ['food', 'sports', 'library', 'technology', 'other']); // Extensible fee types
            $table->string('fee_name')->nullable(); // For 'other' type, custom name
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Indexes
            $table->index(['school_id', 'academic_year_id']);
            $table->index(['school_id', 'is_active']);
            
            // Ensure unique fee type per academic year per school
            $table->unique(['school_id', 'fee_type', 'academic_year_id'], 'universal_fees_school_type_year_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('universal_fees');
    }
};

