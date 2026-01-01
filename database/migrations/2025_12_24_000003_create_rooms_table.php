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
        // Only create if table doesn't exist (idempotent)
        if (!Schema::hasTable('rooms')) {
            Schema::create('rooms', function (Blueprint $table) {
                $table->id();
                
                // Multi-tenancy
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                
                // Room details
                $table->string('name'); // e.g., "Room 101", "Science Lab", "Library"
                $table->string('code', 50)->nullable(); // Short code: "R101", "SCI-LAB"
                $table->enum('room_type', [
                    'classroom',
                    'laboratory',
                    'library',
                    'computer_lab',
                    'art_room',
                    'music_room',
                    'sports_hall',
                    'auditorium',
                    'cafeteria',
                    'prayer_room',
                    'other'
                ])->default('classroom');
                
                // Capacity & features
                $table->integer('capacity')->unsigned()->nullable(); // Max students
                $table->string('building')->nullable(); // Building name/number
                $table->string('floor')->nullable(); // Floor level
                $table->text('facilities')->nullable(); // JSON or text: projector, whiteboard, etc.
                
                // Status
                $table->enum('status', ['available', 'maintenance', 'reserved', 'inactive'])->default('available');
                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();
                
                $table->timestamps();
                $table->softDeletes(); // Allow archiving
                
                // Indexes
                $table->index(['school_id', 'is_active']);
                $table->index(['school_id', 'room_type']);
                $table->index(['school_id', 'status']);
                
                // Unique constraint: room code per school
                $table->unique(['school_id', 'code'], 'unique_room_code');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};

