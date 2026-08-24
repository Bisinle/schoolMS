<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add injury-related incident types to the incident_type enum.
     * These were added to the frontend but missing from the database enum.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // SQLite has no native ENUM type (Laravel emulates it via a CHECK
            // constraint), so ->change() rebuilds the column natively instead
            // of the MySQL-only ALTER ... MODIFY COLUMN ... ENUM(...) below.
            Schema::table('incident_reports', function (Blueprint $table) {
                $table->enum('incident_type', [
                    'bullying',
                    'fighting',
                    'theft',
                    'vandalism',
                    'disrespect',
                    'cheating',
                    'truancy',
                    'substance_abuse',
                    'weapons',
                    'harassment',
                    'cut_laceration',
                    'broken_bones',
                    'head_injury',
                    'other',
                ])->change();
            });

            return;
        }

        // MySQL doesn't support ALTER ENUM directly, so we use ALTER TABLE MODIFY
        DB::statement("ALTER TABLE incident_reports MODIFY COLUMN incident_type ENUM(
            'bullying',
            'fighting',
            'theft',
            'vandalism',
            'disrespect',
            'cheating',
            'truancy',
            'substance_abuse',
            'weapons',
            'harassment',
            'cut_laceration',
            'broken_bones',
            'head_injury',
            'other'
        )");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First, convert any new values to 'other' before removing them from enum
        DB::statement("UPDATE incident_reports SET incident_type = 'other' WHERE incident_type IN ('cut_laceration', 'broken_bones', 'head_injury')");

        if (DB::getDriverName() === 'sqlite') {
            Schema::table('incident_reports', function (Blueprint $table) {
                $table->enum('incident_type', [
                    'bullying',
                    'fighting',
                    'theft',
                    'vandalism',
                    'disrespect',
                    'cheating',
                    'truancy',
                    'substance_abuse',
                    'weapons',
                    'harassment',
                    'other',
                ])->change();
            });

            return;
        }

        // Revert to original enum values
        DB::statement("ALTER TABLE incident_reports MODIFY COLUMN incident_type ENUM(
            'bullying',
            'fighting',
            'theft',
            'vandalism',
            'disrespect',
            'cheating',
            'truancy',
            'substance_abuse',
            'weapons',
            'harassment',
            'other'
        )");
    }
};
