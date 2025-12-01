<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guardian_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('guardian_invoice_id')->constrained('guardian_invoices')->cascadeOnDelete();
            $table->date('payment_date');
            $table->decimal('amount', 10, 2);
            $table->enum('payment_method', ['cash', 'mpesa', 'bank_transfer', 'cheque', 'other'])->default('cash');
            $table->string('reference_number')->nullable(); // Transaction ref, cheque number, etc.
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            
            // Indexes
            $table->index(['school_id', 'guardian_invoice_id']);
            $table->index(['school_id', 'payment_date']);
            $table->index('reference_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guardian_payments');
    }
};

