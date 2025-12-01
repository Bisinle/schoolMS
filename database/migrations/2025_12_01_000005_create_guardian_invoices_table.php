<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guardian_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('guardian_id')->constrained('guardians')->cascadeOnDelete();
            $table->foreignId('academic_term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->string('invoice_number')->unique(); // INV-2025-T1-0001
            $table->date('invoice_date');
            $table->date('due_date');
            $table->decimal('subtotal_amount', 10, 2)->default(0); // Sum of all line items
            $table->decimal('discount_percentage', 5, 2)->default(0); // 0, 5, etc.
            $table->decimal('discount_amount', 10, 2)->default(0); // Calculated
            $table->decimal('total_amount', 10, 2)->default(0); // subtotal - discount
            $table->decimal('amount_paid', 10, 2)->default(0); // Running total of payments
            $table->decimal('balance_due', 10, 2)->default(0); // total_amount - amount_paid
            $table->enum('payment_plan', ['full', 'half_half', 'monthly'])->default('full');
            $table->enum('status', ['pending', 'partial', 'paid', 'overdue'])->default('pending');
            $table->text('notes')->nullable();
            $table->foreignId('generated_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['school_id', 'guardian_id']);
            $table->index(['school_id', 'academic_term_id']);
            $table->index(['school_id', 'status']);
            $table->index('due_date');
            
            // Ensure one invoice per guardian per term
            $table->unique(['guardian_id', 'academic_term_id'], 'guardian_term_invoice_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guardian_invoices');
    }
};

