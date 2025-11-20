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
        // Check if we're using SQLite or MySQL and use appropriate syntax
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite syntax - update using subquery
            DB::statement('
                UPDATE users
                SET school_id = (
                    SELECT school_id
                    FROM teachers
                    WHERE teachers.user_id = users.id
                    AND teachers.school_id IS NOT NULL
                )
                WHERE users.school_id IS NULL
                AND EXISTS (
                    SELECT 1
                    FROM teachers
                    WHERE teachers.user_id = users.id
                    AND teachers.school_id IS NOT NULL
                )
            ');

            DB::statement('
                UPDATE users
                SET school_id = (
                    SELECT school_id
                    FROM guardians
                    WHERE guardians.user_id = users.id
                    AND guardians.school_id IS NOT NULL
                )
                WHERE users.school_id IS NULL
                AND EXISTS (
                    SELECT 1
                    FROM guardians
                    WHERE guardians.user_id = users.id
                    AND guardians.school_id IS NOT NULL
                )
            ');
        } else {
            // MySQL syntax - update with INNER JOIN
            DB::statement('
                UPDATE users u
                INNER JOIN teachers t ON u.id = t.user_id
                SET u.school_id = t.school_id
                WHERE u.school_id IS NULL AND t.school_id IS NOT NULL
            ');

            DB::statement('
                UPDATE users u
                INNER JOIN guardians g ON u.id = g.user_id
                SET u.school_id = g.school_id
                WHERE u.school_id IS NULL AND g.school_id IS NOT NULL
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this data fix
    }
};
