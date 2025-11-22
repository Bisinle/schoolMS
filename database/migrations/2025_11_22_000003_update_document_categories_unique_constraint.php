<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_categories', function (Blueprint $table) {
            // Drop the old unique constraint on slug only
            $table->dropUnique('document_categories_slug_unique');
            
            // Add composite unique constraint on slug + school_id
            $table->unique(['slug', 'school_id'], 'document_categories_slug_school_unique');
        });
    }

    public function down(): void
    {
        Schema::table('document_categories', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('document_categories_slug_school_unique');
            
            // Restore the old unique constraint on slug only
            $table->unique('slug', 'document_categories_slug_unique');
        });
    }
};

