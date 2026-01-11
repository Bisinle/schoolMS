<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * PHASE 5: Update Dependent Tables
     * - Update exams table: grade_id -> stream_id
     * - Update attendances table: grade_id -> stream_id
     * - Create stream_transfers table for audit trail
     */
    public function up(): void
    {
        // ============================================
        // PART 1: UPDATE EXAMS TABLE
        // ============================================
        
        // Step 1: Add stream_id to exams table
        if (!Schema::hasColumn('exams', 'stream_id')) {
            Schema::table('exams', function (Blueprint $table) {
                $table->foreignId('stream_id')
                    ->nullable() // Temporarily nullable for migration
                    ->after('exam_date')
                    ->constrained('streams')
                    ->cascadeOnDelete();
                
                $table->index('stream_id');
            });
        }

        // Step 2: Migrate exam data from grade_id to stream_id
        if (Schema::hasColumn('exams', 'grade_id')) {
            $exams = DB::table('exams')->whereNotNull('grade_id')->get();
            
            echo "Migrating {$exams->count()} exams from grades to streams...\n";
            
            foreach ($exams as $exam) {
                // Find the Main stream for this grade
                $stream = DB::table('streams')
                    ->where('grade_id', $exam->grade_id)
                    ->where('name', 'Main')
                    ->first();
                
                if ($stream) {
                    DB::table('exams')
                        ->where('id', $exam->id)
                        ->update(['stream_id' => $stream->id]);
                } else {
                    echo "WARNING: No Main stream found for grade_id: {$exam->grade_id}, exam_id: {$exam->id}\n";
                }
            }
        }

        // Step 3: Make stream_id NOT NULL and drop grade_id
        Schema::table('exams', function (Blueprint $table) {
            $table->foreignId('stream_id')->nullable(false)->change();
        });

        if (Schema::hasColumn('exams', 'grade_id')) {
            // First, drop the foreign key constraint on grade_id
            Schema::table('exams', function (Blueprint $table) {
                $table->dropForeign(['grade_id']);
            });

            // Then drop the unique constraint
            Schema::table('exams', function (Blueprint $table) {
                $table->dropUnique('unique_exam');
            });

            // Drop grade_id column
            Schema::table('exams', function (Blueprint $table) {
                $table->dropColumn('grade_id');
            });

            // Add new unique constraint with stream_id
            Schema::table('exams', function (Blueprint $table) {
                $table->unique(['stream_id', 'subject_id', 'term', 'exam_type', 'academic_year'], 'unique_exam');
            });
        }

        // ============================================
        // PART 2: UPDATE ATTENDANCES TABLE
        // ============================================
        
        // Step 4: Add stream_id to attendances table
        if (!Schema::hasColumn('attendances', 'stream_id')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->foreignId('stream_id')
                    ->nullable() // Temporarily nullable for migration
                    ->after('student_id')
                    ->constrained('streams')
                    ->cascadeOnDelete();
                
                $table->index(['stream_id', 'attendance_date']);
            });
        }

        // Step 5: Migrate attendance data from grade_id to stream_id
        if (Schema::hasColumn('attendances', 'grade_id')) {
            $attendances = DB::table('attendances')->whereNotNull('grade_id')->get();
            
            echo "Migrating {$attendances->count()} attendance records from grades to streams...\n";
            
            foreach ($attendances as $attendance) {
                // Find the Main stream for this grade
                $stream = DB::table('streams')
                    ->where('grade_id', $attendance->grade_id)
                    ->where('name', 'Main')
                    ->first();
                
                if ($stream) {
                    DB::table('attendances')
                        ->where('id', $attendance->id)
                        ->update(['stream_id' => $stream->id]);
                } else {
                    echo "WARNING: No Main stream found for grade_id: {$attendance->grade_id}\n";
                }
            }
        }

        // Step 6: Make stream_id NOT NULL and drop grade_id
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('stream_id')->nullable(false)->change();
        });

        if (Schema::hasColumn('attendances', 'grade_id')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->dropForeign(['grade_id']);
                $table->dropIndex(['grade_id', 'attendance_date']);
                $table->dropColumn('grade_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This is intentionally left incomplete as rolling back would be complex
        // and should be done carefully with data backup
        throw new Exception('Rolling back Phase 5 is not supported. Please restore from backup.');
    }
};

