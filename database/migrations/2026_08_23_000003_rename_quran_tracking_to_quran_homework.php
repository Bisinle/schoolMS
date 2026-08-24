<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('quran_tracking', 'quran_homework');

        Schema::table('quran_homework', function (Blueprint $table) {
            $table->foreignId('quran_schedule_id')->nullable()->after('school_id')
                ->constrained('quran_schedules')->onDelete('cascade');
            $table->enum('status', ['pending', 'graded', 'absent', 'not_prepared'])
                ->default('pending')->after('quran_schedule_id');
            // Added alongside the old `difficulty` column (not replacing it in
            // place) so the CASE-based remap below can read the old values
            // before they're dropped.
            $table->enum('quality_rating', ['excellent', 'very_good', 'moderate', 'poor'])
                ->nullable()->after('difficulty');
        });

        // Every pre-existing row predates the assign-then-grade lifecycle —
        // it already represents a recorded, complete session.
        DB::table('quran_homework')->update(['status' => 'graded']);

        // Remap the old 3-value difficulty scale onto the new 4-value
        // quality-rating scale (best/mid/worst preserved; there's no
        // historical data for the new "very_good" tier).
        DB::statement("UPDATE quran_homework SET quality_rating = CASE difficulty
            WHEN 'very_well' THEN 'excellent'
            WHEN 'middle' THEN 'moderate'
            WHEN 'difficult' THEN 'poor'
            ELSE NULL END");

        Schema::table('quran_homework', function (Blueprint $table) {
            $table->dropColumn('difficulty');
            $table->renameColumn('date', 'assigned_date');
        });
    }

    public function down(): void
    {
        Schema::table('quran_homework', function (Blueprint $table) {
            $table->renameColumn('assigned_date', 'date');
            $table->enum('difficulty', ['very_well', 'middle', 'difficult'])->default('middle')->after('quran_schedule_id');
        });

        DB::statement("UPDATE quran_homework SET difficulty = CASE quality_rating
            WHEN 'excellent' THEN 'very_well'
            WHEN 'very_good' THEN 'very_well'
            WHEN 'moderate' THEN 'middle'
            WHEN 'poor' THEN 'difficult'
            ELSE 'middle' END");

        Schema::table('quran_homework', function (Blueprint $table) {
            $table->dropColumn('quality_rating');
            $table->dropForeign(['quran_schedule_id']);
            $table->dropColumn(['quran_schedule_id', 'status']);
        });

        Schema::rename('quran_homework', 'quran_tracking');
    }
};
