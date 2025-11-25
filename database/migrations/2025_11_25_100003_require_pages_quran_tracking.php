<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Make page_from and page_to NOT NULL after backfill is complete.
     * 
     * IMPORTANT: Run this ONLY after running the backfill command:
     * php artisan quran:backfill-pages
     */
    public function up(): void
    {
        Schema::table('quran_tracking', function (Blueprint $table) {
            // Make page fields required (not nullable)
            $table->integer('page_from')->nullable(false)->change();
            $table->integer('page_to')->nullable(false)->change();
            
            // Make computed fields required (not nullable)
            $table->integer('pages_memorized')->nullable(false)->change();
            $table->integer('surahs_memorized')->nullable(false)->change();
            $table->integer('juz_memorized')->nullable(false)->change();
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

