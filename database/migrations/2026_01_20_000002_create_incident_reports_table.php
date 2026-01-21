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
        // Accident Reports
        Schema::create('accident_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            
            // Report Info
            $table->string('report_number')->unique(); // ACC-2026-001
            $table->date('incident_date');
            $table->time('incident_time');
            $table->string('location');
            
            // Incident Details
            $table->enum('incident_type', [
                'injury',
                'property_damage',
                'near_miss',
                'illness',
                'other'
            ]);
            $table->enum('severity', ['minor', 'moderate', 'severe', 'critical']);
            
            // People Involved (JSON array of {type: 'student/staff/visitor', id: X, name: 'Y'})
            $table->json('people_involved');
            $table->text('description');
            $table->text('immediate_action_taken')->nullable();
            
            // Witnesses
            $table->json('witnesses')->nullable(); // Array of witness details
            
            // Medical & Follow-up
            $table->boolean('medical_attention_required')->default(false);
            $table->string('medical_facility')->nullable();
            $table->text('medical_notes')->nullable();
            $table->boolean('parent_notified')->default(false);
            $table->timestamp('parent_notified_at')->nullable();
            $table->text('parent_notification_method')->nullable(); // phone, email, in-person
            
            // Follow-up
            $table->boolean('follow_up_required')->default(false);
            $table->text('follow_up_notes')->nullable();
            $table->date('follow_up_date')->nullable();
            
            // Attachments (photos, documents)
            $table->json('attachments')->nullable(); // Array of file paths
            
            // Workflow
            $table->enum('status', ['draft', 'submitted', 'under_review', 'closed'])->default('draft');
            $table->foreignId('reported_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['school_id', 'incident_date']);
            $table->index(['school_id', 'status']);
            $table->index('report_number');
        });

        // Behavioral/Security Incident Reports
        Schema::create('incident_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            
            // Report Info
            $table->string('report_number')->unique(); // INC-2026-001
            $table->date('incident_date');
            $table->time('incident_time');
            $table->string('location');
            
            // Incident Details
            $table->enum('incident_type', [
                'bullying',
                'fighting',
                'theft',
                'vandalism',
                'disrespect',
                'cheating',
                'truancy',
                'substance_abuse',
                'weapons',
                'harassment',
                'other'
            ]);
            $table->enum('severity', ['minor', 'moderate', 'severe', 'critical']);
            
            // People Involved
            $table->json('students_involved'); // Array of student IDs
            $table->json('staff_involved')->nullable(); // Array of staff IDs
            $table->text('description');
            
            // Actions & Resolution
            $table->text('action_taken')->nullable();
            $table->text('disciplinary_action')->nullable();
            $table->boolean('parent_contacted')->default(false);
            $table->timestamp('parent_contacted_at')->nullable();
            $table->boolean('police_involved')->default(false);
            $table->text('police_report_number')->nullable();
            
            // Resolution
            $table->enum('status', ['open', 'investigating', 'resolved', 'closed'])->default('open');
            $table->text('resolution')->nullable();
            $table->date('resolved_date')->nullable();
            
            // Reporting
            $table->foreignId('reported_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            
            // Attachments
            $table->json('attachments')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['school_id', 'incident_date']);
            $table->index(['school_id', 'status']);
            $table->index('report_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incident_reports');
        Schema::dropIfExists('accident_reports');
    }
};

