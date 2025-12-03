<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * NOTE: This migration created the OLD fee structure.
     * It has been superseded by 2025_12_02_130000_create_new_fee_structure_tables.php
     * This file is kept for migration history tracking only.
     */
    public function up(): void
    {
        // Old structure - kept for reference only
        // This was the original fee_categories table with grade_id
        // Schema::create('fee_categories', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
        //     $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
        //     $table->string('name');
        //     $table->decimal('amount', 10, 2);
        //     $table->boolean('is_active')->default(true);
        //     $table->timestamps();
        //     $table->unique(['school_id', 'grade_id', 'name']);
        // });
        
        // This migration is now a no-op since the tables are recreated
        // in 2025_12_02_130000_create_new_fee_structure_tables.php
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op - tables are managed by the new migration
    }
};

