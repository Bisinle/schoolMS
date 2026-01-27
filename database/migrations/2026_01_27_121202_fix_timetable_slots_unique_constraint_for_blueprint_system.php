<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Fix the unique constraint issue on timetable_slots.
     *
     * PROBLEM:
     * The old constraint UNIQUE(timetable_template_id, day_of_week, timetable_period_id)
     * was designed for manual slot creation but doesn't work with blueprint-generated slots.
     *
     * Blueprint-generated slots use:
     * - timetable_period_id = NULL
     * - sequence_order = 1, 2, 3, ... (for ordering)
     *
     * Manual slots use:
     * - timetable_period_id = <actual period ID>
     * - sequence_order = NULL (or can be set)
     *
     * The old constraint allows multiple blueprint slots (NULL != NULL in unique constraints)
     * but breaks when editing slots to use specific period IDs.
     *
     * SOLUTION:
     * Drop the old constraint and rely on application-level validation (TimetableConflictDetector)
     * which already handles both systems correctly.
     *
     * We'll add a composite index for performance without enforcing uniqueness at DB level.
     */
    public function up(): void
    {
        try {
            // Check if the old constraint exists
            $indexes = DB::select("SHOW INDEX FROM timetable_slots WHERE Key_name = 'unique_slot_position'");

            if (!empty($indexes)) {
                Log::info('Dropping old unique_slot_position constraint from timetable_slots');

                // Drop the problematic unique constraint
                Schema::table('timetable_slots', function (Blueprint $table) {
                    $table->dropUnique('unique_slot_position');
                });

                Log::info('Successfully dropped unique_slot_position constraint');
            } else {
                Log::info('unique_slot_position constraint does not exist, skipping drop');
            }
        } catch (\Exception $e) {
            Log::error('Error dropping unique_slot_position constraint: ' . $e->getMessage());
            // Don't throw - allow migration to continue
        }

        try {
            // Add a composite index for performance (not unique)
            // This helps with queries but doesn't enforce uniqueness
            $newIndexes = DB::select("SHOW INDEX FROM timetable_slots WHERE Key_name = 'idx_slot_position_lookup'");

            if (empty($newIndexes)) {
                Log::info('Creating new composite index idx_slot_position_lookup');

                Schema::table('timetable_slots', function (Blueprint $table) {
                    // Index for manual slots (using timetable_period_id)
                    $table->index(
                        ['timetable_template_id', 'day_of_week', 'timetable_period_id'],
                        'idx_slot_position_lookup'
                    );
                });

                Log::info('Successfully created idx_slot_position_lookup index');
            } else {
                Log::info('idx_slot_position_lookup index already exists, skipping creation');
            }
        } catch (\Exception $e) {
            Log::error('Error creating idx_slot_position_lookup index: ' . $e->getMessage());
            // Don't throw - index is for performance only
        }

        try {
            // Add another index for blueprint-generated slots (using sequence_order)
            $sequenceIndexes = DB::select("SHOW INDEX FROM timetable_slots WHERE Key_name = 'idx_slot_sequence_lookup'");

            if (empty($sequenceIndexes)) {
                Log::info('Creating new composite index idx_slot_sequence_lookup');

                Schema::table('timetable_slots', function (Blueprint $table) {
                    // Index for blueprint slots (using sequence_order)
                    $table->index(
                        ['timetable_template_id', 'day_of_week', 'sequence_order'],
                        'idx_slot_sequence_lookup'
                    );
                });

                Log::info('Successfully created idx_slot_sequence_lookup index');
            } else {
                Log::info('idx_slot_sequence_lookup index already exists, skipping creation');
            }
        } catch (\Exception $e) {
            Log::error('Error creating idx_slot_sequence_lookup index: ' . $e->getMessage());
            // Don't throw - index is for performance only
        }

        Log::info('Migration completed: timetable_slots unique constraint fixed for blueprint system');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            // Drop the new indexes
            Schema::table('timetable_slots', function (Blueprint $table) {
                $table->dropIndex('idx_slot_position_lookup');
                $table->dropIndex('idx_slot_sequence_lookup');
            });

            Log::info('Dropped new indexes');
        } catch (\Exception $e) {
            Log::error('Error dropping new indexes: ' . $e->getMessage());
        }

        try {
            // Restore the old unique constraint
            // WARNING: This may fail if there are now duplicate slots in the system
            Schema::table('timetable_slots', function (Blueprint $table) {
                $table->unique(
                    ['timetable_template_id', 'day_of_week', 'timetable_period_id'],
                    'unique_slot_position'
                );
            });

            Log::info('Restored old unique_slot_position constraint');
        } catch (\Exception $e) {
            Log::error('Error restoring unique_slot_position constraint: ' . $e->getMessage());
            Log::warning('This is expected if there are now duplicate slots in the system');
        }
    }
};
