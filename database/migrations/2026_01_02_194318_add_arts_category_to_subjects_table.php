<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the category enum to include 'arts'
        DB::statement("ALTER TABLE subjects MODIFY COLUMN category ENUM('academic', 'islamic', 'arts') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE subjects MODIFY COLUMN category ENUM('academic', 'islamic') NOT NULL");
    }
};
