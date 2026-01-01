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
        Schema::create('level_day_blueprints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            
            // Grade level: ECD, LOWER PRIMARY, UPPER PRIMARY, JUNIOR SECONDARY
            $table->enum('level', ['ECD', 'LOWER PRIMARY', 'UPPER PRIMARY', 'JUNIOR SECONDARY']);
            
            // Blueprint name and description
            $table->string('name'); // e.g., "ECD Standard Day", "Lower Primary Schedule"
            $table->text('description')->nullable();
            
            // School day timing
            $table->time('start_time'); // e.g., 08:00:00
            $table->time('end_time'); // e.g., 15:00:00 for ECD, 16:00:00 for others
            
            // Active status
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Ensure one active blueprint per level per school
            // Note: This unique constraint only applies when is_active = true
            // Multiple inactive blueprints can exist for the same school+level
            $table->unique(['school_id', 'level', 'is_active'], 'unique_active_blueprint_per_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('level_day_blueprints');
    }
};

