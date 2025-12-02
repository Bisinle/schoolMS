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
        Schema::table('school_settings', function (Blueprint $table) {
            // Check if school_id column doesn't exist before adding
            if (!Schema::hasColumn('school_settings', 'school_id')) {
                $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->cascadeOnDelete();

                // Drop the unique constraint on setting_key since we now have school_id
                $table->dropUnique(['setting_key']);

                // Add composite unique constraint for school_id + setting_key
                $table->unique(['school_id', 'setting_key'], 'school_settings_unique');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            if (Schema::hasColumn('school_settings', 'school_id')) {
                $table->dropUnique('school_settings_unique');
                $table->dropForeign(['school_id']);
                $table->dropColumn('school_id');
                $table->unique('setting_key');
            }
        });
    }
};
