<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            // Drop the old unique constraint on employee_number only
            $table->dropUnique('teachers_employee_number_unique');
            
            // Make employee_number nullable temporarily for migration
            $table->string('employee_number')->nullable()->change();
            
            // Add composite unique constraint on employee_number + school_id
            $table->unique(['employee_number', 'school_id'], 'teachers_employee_number_school_unique');
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('teachers_employee_number_school_unique');
            
            // Restore the old unique constraint on employee_number only
            $table->unique('employee_number', 'teachers_employee_number_unique');
        });
    }
};

