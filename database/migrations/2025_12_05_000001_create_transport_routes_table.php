<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Transport routes with one-way and two-way pricing options.
     */
    public function up(): void
    {
        Schema::create('transport_routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('route_name', 100); // e.g., "Eastleigh", "South C", "Ngara"
            $table->decimal('amount_two_way', 10, 2); // Full transport (to and from school)
            $table->decimal('amount_one_way', 10, 2); // One-way transport only
            $table->text('description')->nullable(); // Route details, pickup points, etc.
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Indexes
            $table->index(['school_id', 'is_active']);
            
            // Ensure unique route names per school
            $table->unique(['school_id', 'route_name'], 'transport_routes_school_route_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transport_routes');
    }
};

