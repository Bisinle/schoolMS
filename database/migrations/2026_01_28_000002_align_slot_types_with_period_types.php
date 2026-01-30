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
     * Align timetable_slots slot_type enum with blueprint_periods period_type enum.
     * Add: short_break, breakfast, prayer, sports, homework
     * Keep existing: lesson, break, lunch, assembly, activity, study, other
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE timetable_slots MODIFY COLUMN slot_type ENUM(
            'lesson',
            'break',
            'short_break',
            'breakfast',
            'lunch',
            'assembly',
            'activity',
            'study',
            'prayer',
            'sports',
            'homework',
            'other'
        ) DEFAULT 'lesson'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First, convert new values to existing equivalents
        DB::statement("UPDATE timetable_slots SET slot_type = 'break' WHERE slot_type IN ('short_break', 'breakfast')");
        DB::statement("UPDATE timetable_slots SET slot_type = 'activity' WHERE slot_type IN ('prayer', 'sports')");
        DB::statement("UPDATE timetable_slots SET slot_type = 'study' WHERE slot_type = 'homework'");
        
        // Then revert the enum
        DB::statement("ALTER TABLE timetable_slots MODIFY COLUMN slot_type ENUM(
            'lesson',
            'break',
            'short_break',
            'lunch',
            'assembly',
            'activity',
            'study',
            'prayer',
            'sports',
            'other'
        ) DEFAULT 'lesson'");
    }
};

