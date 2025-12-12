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
        Schema::create('quran_home_practice', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('guardian_id')->constrained()->onDelete('cascade');
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            
            $table->date('practice_date');
            $table->integer('duration_minutes')->comment('Practice duration in minutes');
            
            // What was practiced
            $table->enum('practice_type', ['memorize', 'revise', 'read'])->default('memorize');
            $table->integer('surah_from')->nullable();
            $table->integer('surah_to')->nullable();
            $table->integer('verse_from')->nullable();
            $table->integer('verse_to')->nullable();
            $table->integer('page_from')->nullable();
            $table->integer('page_to')->nullable();
            
            // Notes
            $table->text('notes')->nullable()->comment('Guardian notes about the practice session');
            
            $table->timestamps();
            
            // Indexes
            $table->index(['student_id', 'practice_date']);
            $table->index('practice_date');
            $table->index('guardian_id');
            $table->index('school_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quran_home_practice');
    }
};

