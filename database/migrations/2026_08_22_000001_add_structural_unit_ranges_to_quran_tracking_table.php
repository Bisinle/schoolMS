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
            $table->integer('juz_from')->nullable()->after('juz_memorized')->comment('Starting Juz number (1-30)');
            $table->integer('juz_to')->nullable()->after('juz_from')->comment('Ending Juz number (1-30)');
            $table->integer('hizb_from')->nullable()->after('juz_to')->comment('Starting Hizb number (1-60)');
            $table->integer('hizb_to')->nullable()->after('hizb_from')->comment('Ending Hizb number (1-60)');
            $table->integer('rub_from')->nullable()->after('hizb_to')->comment('Starting Rub el Hizb number (1-240)');
            $table->integer('rub_to')->nullable()->after('rub_from')->comment('Ending Rub el Hizb number (1-240)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quran_tracking', function (Blueprint $table) {
            $table->dropColumn(['juz_from', 'juz_to', 'hizb_from', 'hizb_to', 'rub_from', 'rub_to']);
        });
    }
};
