<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Create pivot table for guardian-student many-to-many relationship.
     * This allows students to have multiple guardians (mother, father, etc.)
     */
    public function up(): void
    {
        Schema::create('guardian_student', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guardian_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->string('relationship')->nullable(); // mother, father, grandparent, etc.
            $table->boolean('is_primary')->default(false); // Primary contact
            $table->boolean('can_receive_invoices')->default(true); // Can receive fee invoices
            $table->boolean('can_pickup')->default(true); // Authorized to pick up student
            $table->boolean('emergency_contact')->default(false); // Is emergency contact
            $table->timestamps();

            // Ensure a guardian can't be linked to the same student twice
            $table->unique(['guardian_id', 'student_id']);
            
            // Indexes for performance
            $table->index(['student_id', 'is_primary']);
            $table->index(['guardian_id', 'can_receive_invoices']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guardian_student');
    }
};

