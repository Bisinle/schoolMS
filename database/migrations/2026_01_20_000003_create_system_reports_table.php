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
        Schema::create('system_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            
            // Report Info
            $table->string('title');
            $table->string('report_number')->unique(); // REP-2026-001
            $table->enum('report_type', [
                'financial',
                'attendance',
                'enrollment',
                'fee_collection',
                'academic_performance',
                'teacher_workload',
                'student_demographics',
                'exam_analysis',
                'custom'
            ]);
            
            // Period
            $table->date('period_start');
            $table->date('period_end');
            $table->string('period_label')->nullable(); // "January 2026", "Q1 2026", etc.
            
            // Filters/Parameters used to generate report
            $table->json('filters')->nullable(); // {grade_id: 5, term_id: 2, etc.}
            
            // Report Data (JSON structure varies by report type)
            $table->json('report_data');
            
            // Summary Statistics (for quick display)
            $table->json('summary_stats')->nullable(); // {total_revenue: 50000, total_students: 200, etc.}
            
            // Generated File (PDF/Excel)
            $table->string('file_path')->nullable();
            $table->string('file_type')->nullable(); // pdf, xlsx, csv
            $table->integer('file_size')->nullable();
            
            // Generation Info
            $table->foreignId('generated_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('generated_at');
            $table->integer('generation_time_ms')->nullable(); // How long it took to generate
            
            // Access Control
            $table->enum('visibility', ['private', 'school_admin', 'public'])->default('school_admin');
            $table->integer('download_count')->default(0);
            $table->timestamp('last_downloaded_at')->nullable();
            
            // Status
            $table->enum('status', ['generating', 'completed', 'failed', 'archived'])->default('generating');
            $table->text('error_message')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['school_id', 'report_type']);
            $table->index(['school_id', 'period_start', 'period_end']);
            $table->index(['school_id', 'status']);
            $table->index('report_number');
        });

        // Report Schedules (for recurring reports)
        Schema::create('report_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            
            $table->string('name');
            $table->enum('report_type', [
                'financial',
                'attendance',
                'enrollment',
                'fee_collection',
                'academic_performance',
                'teacher_workload',
                'student_demographics',
                'exam_analysis',
                'custom'
            ]);
            
            // Schedule
            $table->enum('frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'annually']);
            $table->integer('day_of_week')->nullable(); // 1-7 for weekly
            $table->integer('day_of_month')->nullable(); // 1-31 for monthly
            $table->time('time_of_day')->default('08:00:00');
            
            // Filters
            $table->json('filters')->nullable();
            
            // Recipients (email addresses to send report to)
            $table->json('recipients')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('next_run_at')->nullable();
            
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['school_id', 'is_active', 'next_run_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_schedules');
        Schema::dropIfExists('system_reports');
    }
};

