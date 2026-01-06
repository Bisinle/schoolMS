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
     * Update slot_type enum to include all the types used by the generation service:
     * - short_break (instead of just 'break')
     * - prayer
     * - sports
     */
    public function up(): void
    {
        // MySQL doesn't support ALTER ENUM directly, so we need to:
        // 1. Add a temporary column
        // 2. Copy data
        // 3. Drop old column
        // 4. Rename new column
        
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        // First, convert any new values to 'other'
        DB::statement("UPDATE timetable_slots SET slot_type = 'break' WHERE slot_type = 'short_break'");
        DB::statement("UPDATE timetable_slots SET slot_type = 'other' WHERE slot_type IN ('prayer', 'sports')");
        
        DB::statement("ALTER TABLE timetable_slots MODIFY COLUMN slot_type ENUM(
            'lesson',
            'break',
            'lunch',
            'assembly',
            'activity',
            'study',
            'other'
        ) DEFAULT 'lesson'");
    }
};

