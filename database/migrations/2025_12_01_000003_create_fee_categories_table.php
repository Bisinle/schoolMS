<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->string('category_name'); // Tuition, Transport, Sports, Food, etc.
            $table->decimal('default_amount', 10, 2);
            $table->boolean('is_per_child')->default(true); // true = multiply by number of children
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Ensure unique category per grade
            $table->unique(['school_id', 'grade_id', 'category_name'], 'fee_categories_unique');
            $table->index(['school_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_categories');
    }
};

