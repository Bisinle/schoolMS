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
        // Add school_id to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to students table
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to teachers table
        Schema::table('teachers', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to guardians table
        Schema::table('guardians', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to grades table
        Schema::table('grades', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to subjects table
        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to exams table
        Schema::table('exams', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to exam_results table
        Schema::table('exam_results', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to attendances table
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to documents table
        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to document_categories table
        Schema::table('document_categories', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to report_comments table
        Schema::table('report_comments', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to school_settings table
        Schema::table('school_settings', function (Blueprint $table) {
            $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
            $table->index('school_id');
        });

        // Add school_id to activity_logs table (if exists)
        if (Schema::hasTable('activity_logs')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
                $table->index('school_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'users', 'students', 'teachers', 'guardians', 'grades', 'subjects',
            'exams', 'exam_results', 'attendances', 'documents', 'document_categories',
            'report_comments', 'school_settings', 'activity_logs'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropForeign(['school_id']);
                    $table->dropColumn('school_id');
                });
            }
        }
    }
};

