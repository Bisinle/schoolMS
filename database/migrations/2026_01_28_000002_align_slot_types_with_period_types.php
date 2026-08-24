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
        if (DB::getDriverName() === 'sqlite') {
            // SQLite has no native ENUM type (Laravel emulates it via a CHECK
            // constraint), so ->change() rebuilds the column natively instead
            // of the MySQL-only ALTER ... MODIFY COLUMN ... ENUM(...) below.
            Schema::table('timetable_slots', function (Blueprint $table) {
                $table->enum('slot_type', [
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
                    'other',
                ])->default('lesson')->change();
            });

            return;
        }

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

        if (DB::getDriverName() === 'sqlite') {
            Schema::table('timetable_slots', function (Blueprint $table) {
                $table->enum('slot_type', [
                    'lesson',
                    'break',
                    'short_break',
                    'lunch',
                    'assembly',
                    'activity',
                    'study',
                    'prayer',
                    'sports',
                    'other',
                ])->default('lesson')->change();
            });

            return;
        }

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

