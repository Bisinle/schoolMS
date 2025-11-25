<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add employee_number column for admin users
            $table->string('employee_number')->nullable()->after('role');
            
            // Add composite unique constraint on employee_number + school_id
            // This ensures employee numbers are unique within each school
            $table->unique(['employee_number', 'school_id'], 'users_employee_number_school_unique');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('users_employee_number_school_unique');
            
            // Drop the employee_number column
            $table->dropColumn('employee_number');
        });
    }
};

