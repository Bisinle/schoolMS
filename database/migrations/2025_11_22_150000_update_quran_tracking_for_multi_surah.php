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
        Schema::table('quran_tracking', function (Blueprint $table) {
            // Rename 'surah' to 'surah_from' for multi-surah support
            $table->renameColumn('surah', 'surah_from');
        });

        Schema::table('quran_tracking', function (Blueprint $table) {
            // Add 'surah_to' column after 'surah_from'
            $table->integer('surah_to')->after('surah_from')->nullable();
            
            // Add index for surah_to
            $table->index('surah_to');
        });

        // Update existing records to set surah_to = surah_from
        DB::table('quran_tracking')->update(['surah_to' => DB::raw('surah_from')]);

        // Make surah_to not nullable
        Schema::table('quran_tracking', function (Blueprint $table) {
            $table->integer('surah_to')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quran_tracking', function (Blueprint $table) {
            $table->dropColumn('surah_to');
        });

        Schema::table('quran_tracking', function (Blueprint $table) {
            $table->renameColumn('surah_from', 'surah');
        });
    }
};

