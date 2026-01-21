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
        Schema::create('policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            
            // Basic Info
            $table->string('title');
            $table->string('slug')->unique();
            $table->enum('type', [
                'school_policy',
                'student_handbook', 
                'staff_handbook',
                'code_of_conduct',
                'rules_regulations',
                'safety_policy',
                'academic_policy',
                'admission_policy',
                'fee_policy',
                'other'
            ]);
            $table->string('policy_number')->nullable(); // e.g., POL-2026-001
            
            // Content (Rich Text)
            $table->longText('content'); // HTML content from rich text editor
            $table->text('summary')->nullable(); // Short summary/description
            
            // Versioning
            $table->string('version')->default('1.0'); // 1.0, 1.1, 2.0, etc.
            $table->foreignId('supersedes_policy_id')->nullable()->constrained('policies')->nullOnDelete();
            $table->date('effective_date')->nullable();
            $table->date('review_date')->nullable(); // When to review this policy
            $table->boolean('requires_acknowledgment')->default(false); // Staff must acknowledge
            
            // Workflow
            $table->enum('status', ['draft', 'pending_approval', 'approved', 'published', 'archived'])->default('draft');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('published_at')->nullable();
            
            // Metadata
            $table->json('tags')->nullable(); // For categorization/search
            $table->integer('view_count')->default(0);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['school_id', 'type', 'status']);
            $table->index(['school_id', 'effective_date']);
            $table->index('policy_number');
        });

        // Policy Acknowledgments (track who has read/acknowledged)
        Schema::create('policy_acknowledgments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('acknowledged_at');
            $table->string('ip_address')->nullable();
            $table->text('notes')->nullable();
            
            $table->unique(['policy_id', 'user_id']);
            $table->index('acknowledged_at');
        });

        // Policy Revisions (track changes)
        Schema::create('policy_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('revised_by')->constrained('users')->cascadeOnDelete();
            $table->string('version');
            $table->longText('content'); // Snapshot of content at this revision
            $table->text('revision_notes')->nullable();
            $table->timestamp('created_at');
            
            $table->index(['policy_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('policy_revisions');
        Schema::dropIfExists('policy_acknowledgments');
        Schema::dropIfExists('policies');
    }
};

