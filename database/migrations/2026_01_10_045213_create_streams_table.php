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
        Schema::create('streams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('name', 100); // e.g., "North", "South", "Alpha", "Lion"
            $table->string('code', 10)->nullable(); // e.g., "N", "S", "A", "L"
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            // Unique constraint: Stream name must be unique per school
            $table->unique(['school_id', 'name']);

            // Index for performance
            $table->index(['school_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('streams');
    }
};
