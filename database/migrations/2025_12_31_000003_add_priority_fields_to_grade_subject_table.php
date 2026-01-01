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
            // Priority level for scheduling (high = morning slots, low = afternoon slots)
            $table->enum('priority', ['high', 'neutral', 'low'])
                ->default('neutral')
                ->after('sessions_per_week');
            
            // Whether this subject must appear daily (e.g., Math, English)
            $table->boolean('must_be_daily')
                ->default(false)
                ->after('priority');
            
            // Whether this subject can have multiple sessions on the same day
            $table->boolean('can_repeat_same_day')
                ->default(false)
                ->after('must_be_daily');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grade_subject', function (Blueprint $table) {
            $table->dropColumn(['priority', 'must_be_daily', 'can_repeat_same_day']);
        });
    }
};

