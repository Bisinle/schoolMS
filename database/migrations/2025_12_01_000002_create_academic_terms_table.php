<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->integer('term_number'); // 1, 2, or 3
            $table->string('name'); // e.g., "Term 1", "Term 2", "Term 3"
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
            
            // Ensure only one active term per school
            $table->index(['school_id', 'is_active']);
            // Ensure unique term number per academic year
            $table->unique(['academic_year_id', 'term_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_terms');
    }
};

