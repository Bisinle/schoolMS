<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('year'); // e.g., "2025" (calendar year)
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
            
            // Ensure only one active academic year per school
            $table->index(['school_id', 'is_active']);
            $table->unique(['school_id', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_years');
    }
};

