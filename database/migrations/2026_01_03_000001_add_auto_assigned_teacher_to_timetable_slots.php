<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add auto_assigned_teacher flag to track which slots had teachers
     * automatically assigned during generation (vs manually assigned).
     * This helps UI indicate which slots may need review for specialist teachers.
     */
    public function up(): void
    {
        Schema::table('timetable_slots', function (Blueprint $table) {
            if (!Schema::hasColumn('timetable_slots', 'auto_assigned_teacher')) {
                $table->boolean('auto_assigned_teacher')
                    ->default(false)
                    ->after('teacher_id')
                    ->comment('True if teacher was auto-assigned during generation');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timetable_slots', function (Blueprint $table) {
            if (Schema::hasColumn('timetable_slots', 'auto_assigned_teacher')) {
                $table->dropColumn('auto_assigned_teacher');
            }
        });
    }
};

