<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_fee_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('guardian_id')->constrained('guardians')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->decimal('applied_to_arrears', 10, 2)->default(0);
            $table->decimal('applied_to_current_month', 10, 2)->default(0);
            $table->decimal('applied_to_credit', 10, 2)->default(0);
            $table->date('received_at');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('corrects_entry_id')->nullable()->constrained('monthly_fee_entries')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'guardian_id']);
            $table->index(['school_id', 'received_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_fee_payments');
    }
};
