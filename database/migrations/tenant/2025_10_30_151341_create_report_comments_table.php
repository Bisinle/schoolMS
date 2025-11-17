<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->enum('term', ['1', '2', '3', 'yearly']);
            $table->integer('academic_year');
            $table->text('teacher_comment')->nullable();
            $table->timestamp('teacher_comment_locked_at')->nullable();
            $table->foreignId('teacher_locked_by')->nullable()->constrained('users');
            $table->text('headteacher_comment')->nullable();
            $table->timestamp('headteacher_comment_locked_at')->nullable();
            $table->foreignId('headteacher_locked_by')->nullable()->constrained('users');
            $table->timestamps();
            
            $table->unique(['student_id', 'term', 'academic_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_comments');
    }
};