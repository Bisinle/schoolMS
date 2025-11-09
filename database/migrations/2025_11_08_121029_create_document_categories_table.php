<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "National ID", "Birth Certificate"
            $table->string('slug')->unique(); // e.g., "national_id", "birth_certificate"
            $table->string('entity_type')->nullable(); // Teacher, Student, Guardian, User, or NULL for all
            $table->boolean('is_required')->default(false);
            $table->text('description')->nullable();
            $table->integer('max_file_size')->default(10240); // KB (default 10MB)
            $table->json('allowed_extensions')->nullable(); // ["pdf", "jpg", "png"]
            $table->boolean('expires')->default(false); // Does this document type expire?
            $table->integer('expiry_alert_days')->nullable(); // Alert X days before expiry
            $table->integer('sort_order')->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_categories');
    }
};