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
     * Migrate existing student-guardian relationships from students.guardian_id
     * to the new guardian_student pivot table.
     */
    public function up(): void
    {
        // Copy existing relationships to pivot table
        DB::statement("
            INSERT INTO guardian_student (guardian_id, student_id, relationship, is_primary, can_receive_invoices, can_pickup, emergency_contact, created_at, updated_at)
            SELECT 
                s.guardian_id,
                s.id,
                g.relationship,
                1 as is_primary,
                1 as can_receive_invoices,
                1 as can_pickup,
                1 as emergency_contact,
                NOW(),
                NOW()
            FROM students s
            INNER JOIN guardians g ON s.guardian_id = g.id
            WHERE s.guardian_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM guardian_student gs 
                WHERE gs.guardian_id = s.guardian_id 
                AND gs.student_id = s.id
            )
        ");

        // Make guardian_id nullable (we'll keep it for backward compatibility but it's deprecated)
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('guardian_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore guardian_id as required
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('guardian_id')->nullable(false)->change();
        });

        // Delete pivot table data (will be handled by dropping the table in previous migration)
    }
};

