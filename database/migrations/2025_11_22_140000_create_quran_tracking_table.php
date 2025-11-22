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
        Schema::create('quran_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->date('date');
            $table->enum('reading_type', ['new_learning', 'revision', 'subac'])->default('new_learning');
            $table->integer('surah'); // Surah number (1-114)
            $table->integer('verse_from'); // Starting verse number
            $table->integer('verse_to'); // Ending verse number
            $table->integer('page_from')->nullable(); // Starting page number (optional)
            $table->integer('page_to')->nullable(); // Ending page number (optional)
            $table->enum('difficulty', ['very_well', 'middle', 'difficult'])->default('middle');
            $table->integer('pages_memorized')->nullable(); // Computed or manual
            $table->integer('surahs_memorized')->nullable(); // Computed or manual
            $table->integer('juz_memorized')->nullable(); // Computed or manual
            $table->boolean('subac_participation')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes for better query performance
            $table->index(['student_id', 'date']);
            $table->index(['teacher_id', 'date']);
            $table->index('reading_type');
            $table->index('surah');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quran_tracking');
    }
};

