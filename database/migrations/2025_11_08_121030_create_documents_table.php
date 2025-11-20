<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_category_id')->constrained()->onDelete('cascade');
            
            // Polymorphic relationship - can be attached to Teacher, Student, Guardian, or User
            $table->morphs('documentable'); // Creates documentable_id and documentable_type
            
            $table->string('original_filename'); // User-uploaded filename
            $table->string('stored_filename'); // UUID filename stored on disk
            $table->string('file_path'); // Relative path from storage/app
            $table->string('mime_type');
            $table->integer('file_size'); // in bytes
            
            $table->enum('status', ['pending', 'verified', 'rejected', 'expired'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->date('expiry_date')->nullable(); // For documents that expire
            
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for performance
            $table->index('status');
            $table->index('expiry_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};