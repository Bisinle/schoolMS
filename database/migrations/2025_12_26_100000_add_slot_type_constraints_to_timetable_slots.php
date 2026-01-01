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
     * Add database constraints to enforce slot_type business rules:
     * - Break slots must have subject_id = NULL and teacher_id = NULL
     * - Lesson slots must have subject_id NOT NULL
     * - This prevents semantic confusion between breaks and subjects
     */
    public function up(): void
    {
        // First, clean up any existing data that violates the rules
        // Set subject_id and teacher_id to NULL for all break/lunch slots
        DB::table('timetable_slots')
            ->whereIn('slot_type', ['break', 'lunch'])
            ->update([
                'subject_id' => null,
                'teacher_id' => null,
                'topic' => null,
            ]);

        // Add check constraints (MySQL 8.0.16+)
        // Note: Laravel doesn't have native support for CHECK constraints,
        // so we use raw SQL
        if (DB::getDriverName() === 'mysql') {
            // Drop constraints if they exist (in case of re-running migration)
            // MySQL doesn't support DROP CONSTRAINT IF EXISTS, so we need to catch the exception
            try {
                DB::statement("ALTER TABLE timetable_slots DROP CHECK chk_break_no_subject");
            } catch (\Exception $e) {
                // Constraint doesn't exist, continue
            }

            try {
                DB::statement("ALTER TABLE timetable_slots DROP CHECK chk_lesson_has_subject");
            } catch (\Exception $e) {
                // Constraint doesn't exist, continue
            }

            DB::statement("
                ALTER TABLE timetable_slots
                ADD CONSTRAINT chk_break_no_subject
                CHECK (
                    (slot_type IN ('break', 'lunch') AND subject_id IS NULL AND teacher_id IS NULL)
                    OR
                    (slot_type NOT IN ('break', 'lunch'))
                )
            ");

            DB::statement("
                ALTER TABLE timetable_slots
                ADD CONSTRAINT chk_lesson_has_subject
                CHECK (
                    (slot_type = 'lesson' AND subject_id IS NOT NULL)
                    OR
                    (slot_type != 'lesson')
                )
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE timetable_slots DROP CONSTRAINT IF EXISTS chk_break_no_subject");
            DB::statement("ALTER TABLE timetable_slots DROP CONSTRAINT IF EXISTS chk_lesson_has_subject");
        }
    }
};

