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
        Schema::create('quran_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            
            // Schedule type and targets
            $table->enum('schedule_type', ['daily', 'weekly', 'monthly'])->default('weekly');
            $table->integer('target_pages_per_period')->nullable()->comment('Target pages per day/week/month');
            $table->integer('target_verses_per_period')->nullable()->comment('Target verses per day/week/month');
            
            // Date range
            $table->date('start_date');
            $table->date('expected_completion_date')->nullable();
            
            // Overall target
            $table->integer('target_total_pages')->nullable()->comment('Total pages to memorize');
            
            // Status
            $table->boolean('is_active')->default(true);
            
            // Notes
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['student_id', 'is_active']);
            $table->index('start_date');
            $table->index('school_id');
            $table->index('teacher_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quran_schedules');
    }
};

