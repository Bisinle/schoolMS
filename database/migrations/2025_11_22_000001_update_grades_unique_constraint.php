<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            // Drop the old unique constraint on name only
            $table->dropUnique('grades_name_unique');
            
            // Add composite unique constraint on name + school_id
            $table->unique(['name', 'school_id'], 'grades_name_school_unique');
        });
    }

    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('grades_name_school_unique');
            
            // Restore the old unique constraint on name only
            $table->unique('name', 'grades_name_unique');
        });
    }
};

