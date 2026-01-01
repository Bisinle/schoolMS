<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('timetable_slots')) {
            Schema::create('timetable_slots', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->foreignId('timetable_template_id')->constrained('timetable_templates')->cascadeOnDelete();
                $table->foreignId('timetable_period_id')->nullable()->constrained('timetable_periods')->nullOnDelete();
                $table->enum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
                $table->foreignId('subject_id')->nullable()->constrained('subjects')->restrictOnDelete();
                $table->foreignId('teacher_id')->nullable()->constrained('teachers')->restrictOnDelete();
                $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
                $table->enum('slot_type', ['lesson', 'break', 'lunch', 'assembly', 'activity', 'study', 'other'])->default('lesson');
                $table->text('notes')->nullable();
                $table->string('topic')->nullable();
                $table->boolean('is_substitution')->default(false);
                $table->foreignId('original_teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
                $table->timestamps();
                $table->index(['timetable_template_id', 'day_of_week']);
                $table->index(['teacher_id', 'day_of_week']);
                $table->index(['subject_id']);
                $table->index(['room_id', 'day_of_week']);
                $table->index(['school_id', 'slot_type']);
                $table->unique(['timetable_template_id', 'day_of_week', 'timetable_period_id'], 'unique_slot_position');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('timetable_slots');
    }
};
