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
     * PHASE 2: Move Students from Grades to Streams
     * - Create default "Main" stream for each grade
     * - Add stream_id to students table
     * - Migrate all students to their grade's Main stream
     * - Remove grade_id from students table
     */
    public function up(): void
    {
        // Step 1: Create default "Main" stream for each grade that doesn't have streams
        $grades = DB::table('grades')->get(['id', 'school_id', 'name', 'capacity', 'default_room_id']);
        
        foreach ($grades as $grade) {
            // Check if this grade already has a "Main" stream
            $existingStream = DB::table('streams')
                ->where('grade_id', $grade->id)
                ->where('name', 'Main')
                ->first();
            
            if (!$existingStream) {
                echo "Creating 'Main' stream for grade: {$grade->name} (ID: {$grade->id})\n";
                
                DB::table('streams')->insert([
                    'school_id' => $grade->school_id,
                    'grade_id' => $grade->id,
                    'name' => 'Main',
                    'code' => 'M',
                    'capacity' => $grade->capacity ?? 40,
                    'room_id' => $grade->default_room_id,
                    'description' => 'Default stream for ' . $grade->name,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Step 2: Add stream_id column to students table
        if (!Schema::hasColumn('students', 'stream_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->foreignId('stream_id')
                    ->nullable() // Temporarily nullable for migration
                    ->after('grade_id')
                    ->constrained('streams')
                    ->cascadeOnDelete();
                
                $table->index(['school_id', 'stream_id']);
            });
        }

        // Step 3: Migrate students to their grade's Main stream
        $students = DB::table('students')->whereNotNull('grade_id')->get(['id', 'grade_id', 'school_id']);
        
        foreach ($students as $student) {
            // Find the Main stream for this student's grade
            $stream = DB::table('streams')
                ->where('grade_id', $student->grade_id)
                ->where('name', 'Main')
                ->first();
            
            if ($stream) {
                DB::table('students')
                    ->where('id', $student->id)
                    ->update(['stream_id' => $stream->id]);
            } else {
                echo "WARNING: No Main stream found for grade_id: {$student->grade_id}, student_id: {$student->id}\n";
            }
        }

        // Step 4: Make stream_id NOT NULL
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('stream_id')->nullable(false)->change();
        });

        // Step 5: Remove grade_id from students table
        if (Schema::hasColumn('students', 'grade_id')) {
            Schema::table('students', function (Blueprint $table) {
                // Drop foreign key and column
                $table->dropForeign(['grade_id']);
                $table->dropColumn('grade_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse Step 5: Add grade_id back to students
        if (!Schema::hasColumn('students', 'grade_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->foreignId('grade_id')
                    ->nullable()
                    ->after('guardian_id')
                    ->constrained('grades')
                    ->nullOnDelete();
            });
        }

        // Reverse Step 4: Make stream_id nullable
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('stream_id')->nullable()->change();
        });

        // Reverse Step 3: Migrate students back to grades
        $students = DB::table('students')->whereNotNull('stream_id')->get(['id', 'stream_id']);
        
        foreach ($students as $student) {
            $stream = DB::table('streams')->where('id', $student->stream_id)->first();
            if ($stream) {
                DB::table('students')
                    ->where('id', $student->id)
                    ->update(['grade_id' => $stream->grade_id]);
            }
        }

        // Reverse Step 2: Remove stream_id from students
        if (Schema::hasColumn('students', 'stream_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropForeign(['stream_id']);
                $table->dropIndex(['school_id', 'stream_id']);
                $table->dropColumn('stream_id');
            });
        }

        // Reverse Step 1: Delete Main streams (optional - commented out to preserve data)
        // DB::table('streams')->where('name', 'Main')->where('code', 'M')->delete();
    }
};

