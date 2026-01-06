<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Check if the unique constraint exists
        $indexes = \DB::select("SHOW INDEX FROM document_categories WHERE Key_name = 'document_categories_slug_unique'");

        if (!empty($indexes)) {
            Schema::table('document_categories', function (Blueprint $table) {
                $table->dropUnique('document_categories_slug_unique');
            });
        }

        // Check if the composite unique constraint already exists
        $compositeIndexes = \DB::select("SHOW INDEX FROM document_categories WHERE Key_name = 'document_categories_slug_school_unique'");

        if (empty($compositeIndexes)) {
            Schema::table('document_categories', function (Blueprint $table) {
                $table->unique(['slug', 'school_id'], 'document_categories_slug_school_unique');
            });
        }
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

