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
        Schema::create('quran_homework', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            
            $table->date('assigned_date')->comment('Date homework was assigned');
            $table->date('due_date')->comment('Date homework is due');
            
            $table->enum('homework_type', ['memorize', 'revise', 'read'])->comment('Type of homework');
            
            // Surah and verse range
            $table->integer('surah_from')->comment('Starting surah number (1-114)');
            $table->integer('verse_from')->comment('Starting verse number');
            $table->integer('surah_to')->comment('Ending surah number (1-114)');
            $table->integer('verse_to')->comment('Ending verse number');
            
            // Optional page range
            $table->integer('page_from')->nullable()->comment('Starting page number (1-604)');
            $table->integer('page_to')->nullable()->comment('Ending page number (1-604)');
            
            // Completion tracking
            $table->boolean('completed')->default(false)->comment('Whether homework is completed');
            $table->date('completion_date')->nullable()->comment('Date homework was completed');
            
            // Notes
            $table->text('teacher_instructions')->nullable()->comment('Instructions from teacher');
            $table->text('completion_notes')->nullable()->comment('Notes added when completed');
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['student_id', 'completed']);
            $table->index('due_date');
            $table->index('school_id');
            $table->index('teacher_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quran_homework');
    }
};

