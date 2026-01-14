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
        // Check if grade_id column doesn't exist before adding
        if (!Schema::hasColumn('students', 'grade_id')) {
            Schema::table('students', function (Blueprint $table) {
                // Add grade_id column after guardian_id
                $table->foreignId('grade_id')->nullable()->after('guardian_id')->constrained()->onDelete('set null');
            });
        }

        // Remove stream_id if it exists (it's from a different branch)
        if (Schema::hasColumn('students', 'stream_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropForeign(['stream_id']);
                $table->dropColumn('stream_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('students', 'grade_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropForeign(['grade_id']);
                $table->dropColumn('grade_id');
            });
        }
    }
};
