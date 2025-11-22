<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Drop the old unique constraint on admission_number only
            $table->dropUnique('students_admission_number_unique');
            
            // Add composite unique constraint on admission_number + school_id
            $table->unique(['admission_number', 'school_id'], 'students_admission_number_school_unique');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('students_admission_number_school_unique');
            
            // Restore the old unique constraint on admission_number only
            $table->unique('admission_number', 'students_admission_number_unique');
        });
    }
};

