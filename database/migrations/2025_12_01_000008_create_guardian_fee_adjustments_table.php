<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guardian_fee_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('guardian_id')->constrained('guardians')->cascadeOnDelete();
            $table->foreignId('academic_term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->string('category_name'); // Which fee to adjust
            $table->enum('adjustment_type', ['exclude', 'custom_amount', 'discount'])->default('exclude');
            $table->decimal('custom_amount', 10, 2)->nullable(); // If custom amount
            $table->text('reason')->nullable(); // Why this adjustment
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            
            // Indexes
            $table->index(['school_id', 'guardian_id']);
            $table->index(['school_id', 'academic_term_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guardian_fee_adjustments');
    }
};

