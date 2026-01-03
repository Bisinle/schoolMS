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
        // Drop the old subject_specialization column if it exists
        if (Schema::hasColumn('teachers', 'subject_specialization')) {
            Schema::table('teachers', function (Blueprint $table) {
                $table->dropColumn('subject_specialization');
            });
        }

        // Add new subject_id column if it doesn't exist (nullable for now to allow migration)
        if (!Schema::hasColumn('teachers', 'subject_id')) {
            Schema::table('teachers', function (Blueprint $table) {
                $table->unsignedBigInteger('subject_id')->nullable()->after('qualification');
            });
        }

        // Add the foreign key constraint
        // We'll use a try-catch to handle if it already exists
        try {
            Schema::table('teachers', function (Blueprint $table) {
                $table->foreign('subject_id')->references('id')->on('subjects')->restrictOnDelete();
            });
        } catch (\Exception $e) {
            // Foreign key already exists, ignore
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            // Drop the foreign key and column
            $table->dropForeign(['subject_id']);
            $table->dropColumn('subject_id');

            // Restore the old subject_specialization column
            $table->string('subject_specialization')->nullable()->after('qualification');
        });
    }
};
