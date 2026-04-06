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
        Schema::table('students', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->change();
            $table->date('enrollment_date')->nullable()->change();
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->date('date_of_joining')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable(false)->change();
            $table->date('enrollment_date')->nullable(false)->change();
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->date('date_of_joining')->nullable(false)->change();
        });
    }
};
