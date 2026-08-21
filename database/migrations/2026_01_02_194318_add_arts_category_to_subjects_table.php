<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // SQLite has no native ENUM type (Laravel emulates it via a CHECK
            // constraint), so ->change() rebuilds the column natively instead
            // of the MySQL-only ALTER ... MODIFY COLUMN ... ENUM(...) below.
            Schema::table('subjects', function (Blueprint $table) {
                $table->enum('category', ['academic', 'islamic', 'arts'])->change();
            });

            return;
        }

        // Modify the category enum to include 'arts'
        DB::statement("ALTER TABLE subjects MODIFY COLUMN category ENUM('academic', 'islamic', 'arts') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('subjects', function (Blueprint $table) {
                $table->enum('category', ['academic', 'islamic'])->change();
            });

            return;
        }

        // Revert back to original enum values
        DB::statement("ALTER TABLE subjects MODIFY COLUMN category ENUM('academic', 'islamic') NOT NULL");
    }
};
