<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Removes the guardian self-logged Quran home-practice feature. It tracked
 * practice sessions with a fully free-form surah/verse/page range,
 * disconnected from anything a teacher actually assigned via QuranHomework —
 * decided (see docs/superpowers/specs, brainstorming session 2026-08-24)
 * that a parent seeing the real assigned homework already covers this need,
 * and a disconnected practice log was more confusing than useful.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('quran_home_practice');
    }

    public function down(): void
    {
        Schema::create('quran_home_practice', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('guardian_id')->constrained()->onDelete('cascade');
            $table->foreignId('school_id')->constrained()->onDelete('cascade');

            $table->date('practice_date');
            $table->integer('duration_minutes')->comment('Practice duration in minutes');

            $table->enum('practice_type', ['memorize', 'revise', 'read'])->default('memorize');
            $table->integer('surah_from')->nullable();
            $table->integer('surah_to')->nullable();
            $table->integer('verse_from')->nullable();
            $table->integer('verse_to')->nullable();
            $table->integer('page_from')->nullable();
            $table->integer('page_to')->nullable();

            $table->text('notes')->nullable()->comment('Guardian notes about the practice session');

            $table->timestamps();

            $table->index(['student_id', 'practice_date']);
            $table->index('practice_date');
            $table->index('guardian_id');
            $table->index('school_id');
        });
    }
};
