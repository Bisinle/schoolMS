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
        Schema::table('grade_subject', function (Blueprint $table) {
            // Add sessions_per_week column to track how many times per week
            // this subject should be taught for this grade
            $table->integer('sessions_per_week')->default(4)->after('subject_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grade_subject', function (Blueprint $table) {
            $table->dropColumn('sessions_per_week');
        });
    }
};
