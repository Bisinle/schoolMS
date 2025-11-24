<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guardians', function (Blueprint $table) {
            $table->string('guardian_number')->nullable()->after('id');
            $table->unique(['guardian_number', 'school_id'], 'guardians_guardian_number_school_unique');
        });
    }

    public function down(): void
    {
        Schema::table('guardians', function (Blueprint $table) {
            $table->dropUnique('guardians_guardian_number_school_unique');
            $table->dropColumn('guardian_number');
        });
    }
};

