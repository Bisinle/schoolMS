<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Sync school_id from teachers/guardians tables to users table
     */
    public function up(): void
    {
        // Update users.school_id from teachers table
        DB::statement('
            UPDATE users u
            INNER JOIN teachers t ON u.id = t.user_id
            SET u.school_id = t.school_id
            WHERE u.school_id IS NULL AND t.school_id IS NOT NULL
        ');

        // Update users.school_id from guardians table
        DB::statement('
            UPDATE users u
            INNER JOIN guardians g ON u.id = g.user_id
            SET u.school_id = g.school_id
            WHERE u.school_id IS NULL AND g.school_id IS NOT NULL
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this data fix
    }
};
