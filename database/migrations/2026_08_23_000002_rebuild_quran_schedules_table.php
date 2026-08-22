<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quran_schedules', function (Blueprint $table) {
            $table->dropColumn(['schedule_type', 'target_pages_per_period', 'target_verses_per_period', 'target_total_pages']);
            $table->renameColumn('expected_completion_date', 'end_date');
        });

        Schema::table('quran_schedules', function (Blueprint $table) {
            $table->integer('surah_from')->after('school_id')->comment('Starting surah number (1-114)');
            $table->integer('verse_from')->after('surah_from')->comment('Starting verse number');
            $table->integer('surah_to')->after('verse_from')->comment('Ending surah number (1-114)');
            $table->integer('verse_to')->after('surah_to')->comment('Ending verse number');
        });
    }

    public function down(): void
    {
        Schema::table('quran_schedules', function (Blueprint $table) {
            $table->dropColumn(['surah_from', 'verse_from', 'surah_to', 'verse_to']);
            $table->renameColumn('end_date', 'expected_completion_date');
            $table->enum('schedule_type', ['daily', 'weekly', 'monthly'])->default('weekly');
            $table->integer('target_pages_per_period')->nullable();
            $table->integer('target_verses_per_period')->nullable();
            $table->integer('target_total_pages')->nullable();
        });
    }
};
