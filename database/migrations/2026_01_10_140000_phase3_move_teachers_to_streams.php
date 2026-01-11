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
     * PHASE 3: Move Teachers from Grades to Streams
     * - Create new stream_teacher pivot table
     * - Migrate teacher assignments from grade_teacher to stream_teacher
     * - Preserve is_class_teacher flag
     * - Drop old grade_teacher table
     */
    public function up(): void
    {
        // Step 1: Create stream_teacher pivot table
        if (!Schema::hasTable('stream_teacher')) {
            Schema::create('stream_teacher', function (Blueprint $table) {
                $table->id();
                $table->foreignId('stream_id')->constrained('streams')->cascadeOnDelete();
                $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
                $table->boolean('is_class_teacher')->default(false);
                $table->timestamps();
                
                // Unique constraint: one teacher can't be assigned to same stream twice
                $table->unique(['stream_id', 'teacher_id']);
                
                // Indexes for performance
                $table->index(['stream_id', 'is_class_teacher']);
                $table->index('teacher_id');
            });
        }

        // Step 2: Migrate data from grade_teacher to stream_teacher
        if (Schema::hasTable('grade_teacher')) {
            $assignments = DB::table('grade_teacher')->get();
            
            echo "Migrating {$assignments->count()} teacher assignments from grades to streams...\n";
            
            foreach ($assignments as $assignment) {
                // Find the Main stream for this grade
                $stream = DB::table('streams')
                    ->where('grade_id', $assignment->grade_id)
                    ->where('name', 'Main')
                    ->first();
                
                if ($stream) {
                    // Check if this assignment already exists
                    $exists = DB::table('stream_teacher')
                        ->where('stream_id', $stream->id)
                        ->where('teacher_id', $assignment->teacher_id)
                        ->exists();
                    
                    if (!$exists) {
                        DB::table('stream_teacher')->insert([
                            'stream_id' => $stream->id,
                            'teacher_id' => $assignment->teacher_id,
                            'is_class_teacher' => $assignment->is_class_teacher,
                            'created_at' => $assignment->created_at ?? now(),
                            'updated_at' => $assignment->updated_at ?? now(),
                        ]);
                    }
                } else {
                    echo "WARNING: No Main stream found for grade_id: {$assignment->grade_id}\n";
                }
            }
        }

        // Step 3: Drop old grade_teacher table
        if (Schema::hasTable('grade_teacher')) {
            Schema::dropIfExists('grade_teacher');
            echo "Dropped old grade_teacher table\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse Step 3: Recreate grade_teacher table
        if (!Schema::hasTable('grade_teacher')) {
            Schema::create('grade_teacher', function (Blueprint $table) {
                $table->id();
                $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
                $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
                $table->boolean('is_class_teacher')->default(false);
                $table->timestamps();
                
                $table->unique(['grade_id', 'teacher_id']);
            });
        }

        // Reverse Step 2: Migrate data back from stream_teacher to grade_teacher
        if (Schema::hasTable('stream_teacher')) {
            $assignments = DB::table('stream_teacher')->get();
            
            foreach ($assignments as $assignment) {
                $stream = DB::table('streams')->where('id', $assignment->stream_id)->first();
                
                if ($stream) {
                    $exists = DB::table('grade_teacher')
                        ->where('grade_id', $stream->grade_id)
                        ->where('teacher_id', $assignment->teacher_id)
                        ->exists();
                    
                    if (!$exists) {
                        DB::table('grade_teacher')->insert([
                            'grade_id' => $stream->grade_id,
                            'teacher_id' => $assignment->teacher_id,
                            'is_class_teacher' => $assignment->is_class_teacher,
                            'created_at' => $assignment->created_at ?? now(),
                            'updated_at' => $assignment->updated_at ?? now(),
                        ]);
                    }
                }
            }
        }

        // Reverse Step 1: Drop stream_teacher table
        Schema::dropIfExists('stream_teacher');
    }
};

