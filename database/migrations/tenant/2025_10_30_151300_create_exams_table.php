<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('exam_type', ['opening', 'midterm', 'end_term']);
            $table->enum('term', ['1', '2', '3']);
            $table->integer('academic_year');
            $table->date('exam_date');
            $table->foreignId('grade_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->softDeletes();
            $table->timestamps();
            
            $table->unique(['grade_id', 'subject_id', 'term', 'exam_type', 'academic_year'], 'unique_exam');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};