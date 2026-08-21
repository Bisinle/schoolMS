<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // For SQLite, recreate the table
            Schema::create('grades_temp', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code', 50)->nullable();
                $table->enum('level', ['ECD', 'LOWER PRIMARY', 'UPPER PRIMARY', 'JUNIOR SECONDARY'])->default('LOWER PRIMARY');
                $table->integer('capacity')->nullable();
                $table->text('description')->nullable();
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->timestamps();
            });

            // Copy existing data
            DB::statement('INSERT INTO grades_temp (id, name, code, level, capacity, description, status, created_at, updated_at)
                          SELECT id, name, NULL, "LOWER PRIMARY", capacity, description, status, created_at, updated_at FROM grades');

            // Drop old table (this also drops its grades_name_unique index, so the
            // name is free again — recreating it on grades_temp before this point
            // would collide, since SQLite index names are unique per-database, not
            // per-table)
            Schema::dropIfExists('grades');

            // Rename temp table
            Schema::rename('grades_temp', 'grades');

            // Recreate the unique constraint under the name later migrations
            // (e.g. update_grades_unique_constraint) expect. SQLite keeps an
            // index's name as of creation time, not the table's current name, so
            // this must be added after the rename, not on grades_temp directly.
            Schema::table('grades', function (Blueprint $table) {
                $table->unique('name', 'grades_name_unique');
            });
        } else {
            // For MySQL/PostgreSQL
            Schema::table('grades', function (Blueprint $table) {
                // Drop the old integer level column
                $table->dropColumn('level');
            });

            Schema::table('grades', function (Blueprint $table) {
                // Add new level as enum
                $table->enum('level', ['ECD', 'LOWER PRIMARY', 'UPPER PRIMARY', 'JUNIOR SECONDARY'])
                    ->default('LOWER PRIMARY')
                    ->after('name');
                // Add code field
                $table->string('code', 50)->nullable()->after('name');
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::create('grades_temp', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->integer('level')->default(1);
                $table->integer('capacity')->nullable();
                $table->text('description')->nullable();
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->timestamps();
            });

            DB::statement('INSERT INTO grades_temp (id, name, level, capacity, description, status, created_at, updated_at)
                          SELECT id, name, 1, capacity, description, status, created_at, updated_at FROM grades');

            Schema::dropIfExists('grades');
            Schema::rename('grades_temp', 'grades');

            Schema::table('grades', function (Blueprint $table) {
                $table->unique('name', 'grades_name_unique');
            });
        } else {
            Schema::table('grades', function (Blueprint $table) {
                $table->dropColumn(['code', 'level']);
            });

            Schema::table('grades', function (Blueprint $table) {
                $table->integer('level')->default(1)->after('name');
            });
        }
    }
};