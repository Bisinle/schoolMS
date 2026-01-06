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
        $tables = [
            'users', 'students', 'teachers', 'guardians', 'grades', 'subjects',
            'exams', 'exam_results', 'attendances', 'documents', 'document_categories',
            'report_comments', 'school_settings', 'activity_logs'
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && !Schema::hasColumn($tableName, 'school_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();
                    $table->index('school_id');
                });
            }
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

