<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            // Drop the old unique constraint on name + category
            $table->dropUnique(['name', 'category']);
            
            // Add composite unique constraint on name + category + school_id
            $table->unique(['name', 'category', 'school_id'], 'subjects_name_category_school_unique');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('subjects_name_category_school_unique');
            
            // Restore the old unique constraint on name + category
            $table->unique(['name', 'category']);
        });
    }
};

