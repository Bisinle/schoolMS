<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add 'homework' to the period_type enum in blueprint_periods table
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE blueprint_periods MODIFY COLUMN period_type ENUM(
            'lesson',
            'short_break',
            'breakfast',
            'lunch',
            'prayer',
            'sports',
            'activity',
            'homework'
        )");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First, convert any 'homework' values to 'activity'
        DB::statement("UPDATE blueprint_periods SET period_type = 'activity' WHERE period_type = 'homework'");
        
        // Then revert the enum
        DB::statement("ALTER TABLE blueprint_periods MODIFY COLUMN period_type ENUM(
            'lesson',
            'short_break',
            'breakfast',
            'lunch',
            'prayer',
            'sports',
            'activity'
        )");
    }
};

