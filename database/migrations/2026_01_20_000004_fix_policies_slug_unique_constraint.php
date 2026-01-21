<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            // Drop the global unique constraint on slug
            $table->dropUnique(['slug']);
            
            // Add composite unique constraint for school_id + slug
            $table->unique(['school_id', 'slug'], 'policies_school_slug_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('policies_school_slug_unique');
            
            // Restore the global unique constraint on slug
            $table->unique('slug');
        });
    }
};

