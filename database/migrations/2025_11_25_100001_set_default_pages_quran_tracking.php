<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Set temporary defaults to avoid migration failure if nulls exist.
     */
    public function up(): void
    {
        // First, update all NULL values to 0
        DB::table('quran_tracking')->whereNull('page_from')->update(['page_from' => 0]);
        DB::table('quran_tracking')->whereNull('page_to')->update(['page_to' => 0]);
        DB::table('quran_tracking')->whereNull('pages_memorized')->update(['pages_memorized' => 0]);
        DB::table('quran_tracking')->whereNull('surahs_memorized')->update(['surahs_memorized' => 0]);
        DB::table('quran_tracking')->whereNull('juz_memorized')->update(['juz_memorized' => 0]);

        // Then modify columns to have default values
        Schema::table('quran_tracking', function (Blueprint $table) {
            $table->integer('page_from')->default(0)->change();
            $table->integer('page_to')->default(0)->change();
            $table->integer('pages_memorized')->default(0)->change();
            $table->integer('surahs_memorized')->default(0)->change();
            $table->integer('juz_memorized')->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quran_tracking', function (Blueprint $table) {
            $table->integer('page_from')->nullable()->change();
            $table->integer('page_to')->nullable()->change();
            $table->integer('pages_memorized')->nullable()->change();
            $table->integer('surahs_memorized')->nullable()->change();
            $table->integer('juz_memorized')->nullable()->change();
        });
    }
};

