<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add fields needed for blueprint-based timetable generation:
     * - sequence_order: Order of periods within a day
     * - priority_band: Cognitive priority for subject allocation
     * - is_teachable: Whether this is a lesson period (vs break/lunch)
     * - duration_minutes: Duration of the period
     * - manually_created: Flag to preserve manual edits during regeneration
     * - start_time/end_time: Period time boundaries
     */
    public function up(): void
    {
        Schema::table('timetable_slots', function (Blueprint $table) {
            // Only add columns that don't exist
            if (!Schema::hasColumn('timetable_slots', 'sequence_order')) {
                $table->integer('sequence_order')->nullable()->after('day_of_week');
            }

            if (!Schema::hasColumn('timetable_slots', 'start_time')) {
                $table->time('start_time')->nullable()->after('sequence_order');
            }

            if (!Schema::hasColumn('timetable_slots', 'end_time')) {
                $table->time('end_time')->nullable()->after('start_time');
            }

            if (!Schema::hasColumn('timetable_slots', 'duration_minutes')) {
                $table->integer('duration_minutes')->nullable()->after('end_time');
            }

            if (!Schema::hasColumn('timetable_slots', 'priority_band')) {
                $table->enum('priority_band', ['morning_high', 'neutral', 'afternoon_low'])
                    ->nullable()
                    ->after('slot_type');
            }

            if (!Schema::hasColumn('timetable_slots', 'is_teachable')) {
                $table->boolean('is_teachable')->default(false)->after('priority_band');
            }

            if (!Schema::hasColumn('timetable_slots', 'manually_created')) {
                $table->boolean('manually_created')->default(false)->after('is_teachable');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timetable_slots', function (Blueprint $table) {
            $table->dropColumn([
                'sequence_order',
                'start_time',
                'end_time',
                'duration_minutes',
                'priority_band',
                'is_teachable',
                'manually_created',
            ]);
        });
    }
};
