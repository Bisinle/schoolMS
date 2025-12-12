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
        Schema::create('quran_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quran_tracking_id')->constrained('quran_tracking')->onDelete('cascade');
            $table->integer('fluency_rating')->nullable()->comment('1-5 stars for fluency');
            $table->integer('tajweed_rating')->nullable()->comment('1-5 stars for tajweed');
            $table->integer('mistakes_count')->default(0)->comment('Number of mistakes made');
            $table->text('assessment_notes')->nullable()->comment('Teacher notes on assessment');
            $table->timestamps();
            
            // Indexes
            $table->index('quran_tracking_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quran_assessments');
    }
};

