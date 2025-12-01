<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_line_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('guardian_invoice_id')->constrained('guardian_invoices')->cascadeOnDelete();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('student_name'); // Denormalized for history
            $table->string('grade_name'); // Denormalized for history
            $table->string('category_name'); // Tuition, Transport, Sports, Food, etc.
            $table->text('description'); // e.g., "PP1 Tuition for Ahmed Ali"
            $table->integer('quantity')->default(1); // Number of children if applicable
            $table->decimal('unit_price', 10, 2); // Fee per child
            $table->decimal('total_amount', 10, 2); // quantity × unit_price
            $table->boolean('is_waived')->default(false); // For one-time fees
            $table->text('waiver_reason')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index(['school_id', 'guardian_invoice_id']);
            $table->index(['school_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_line_items');
    }
};

