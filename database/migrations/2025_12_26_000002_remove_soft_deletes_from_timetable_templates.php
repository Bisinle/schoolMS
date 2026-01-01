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
        // Only drop if the column exists
        if (Schema::hasColumn('timetable_templates', 'deleted_at')) {
            Schema::table('timetable_templates', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timetable_templates', function (Blueprint $table) {
            $table->softDeletes();
        });
    }
};

