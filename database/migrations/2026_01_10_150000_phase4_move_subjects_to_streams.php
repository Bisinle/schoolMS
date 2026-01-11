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
     * PHASE 4: Move Subjects from Grades to Streams
     * - Create new stream_subject pivot table
     * - Migrate subject assignments from grade_subject to stream_subject
     * - Preserve all pivot attributes (sessions_per_week, priority, must_be_daily, can_repeat_same_day)
     * - Drop old grade_subject table
     */
    public function up(): void
    {
        // Step 1: Create stream_subject pivot table
        if (!Schema::hasTable('stream_subject')) {
            Schema::create('stream_subject', function (Blueprint $table) {
                $table->id();
                $table->foreignId('stream_id')->constrained('streams')->cascadeOnDelete();
                $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
                $table->integer('sessions_per_week')->default(4);
                $table->enum('priority', ['high', 'neutral', 'low'])->default('neutral');
                $table->boolean('must_be_daily')->default(false);
                $table->boolean('can_repeat_same_day')->default(false);
                $table->timestamps();
                
                // Unique constraint: one subject can't be assigned to same stream twice
                $table->unique(['stream_id', 'subject_id']);
                
                // Index for performance
                $table->index('subject_id');
            });
        }

        // Step 2: Migrate data from grade_subject to stream_subject
        if (Schema::hasTable('grade_subject')) {
            $assignments = DB::table('grade_subject')->get();
            
            echo "Migrating {$assignments->count()} subject assignments from grades to streams...\n";
            
            foreach ($assignments as $assignment) {
                // Get all streams for this grade
                $streams = DB::table('streams')
                    ->where('grade_id', $assignment->grade_id)
                    ->get();
                
                if ($streams->count() > 0) {
                    foreach ($streams as $stream) {
                        // Check if this assignment already exists
                        $exists = DB::table('stream_subject')
                            ->where('stream_id', $stream->id)
                            ->where('subject_id', $assignment->subject_id)
                            ->exists();
                        
                        if (!$exists) {
                            DB::table('stream_subject')->insert([
                                'stream_id' => $stream->id,
                                'subject_id' => $assignment->subject_id,
                                'sessions_per_week' => $assignment->sessions_per_week,
                                'priority' => $assignment->priority,
                                'must_be_daily' => $assignment->must_be_daily,
                                'can_repeat_same_day' => $assignment->can_repeat_same_day,
                                'created_at' => $assignment->created_at ?? now(),
                                'updated_at' => $assignment->updated_at ?? now(),
                            ]);
                        }
                    }
                } else {
                    echo "WARNING: No streams found for grade_id: {$assignment->grade_id}\n";
                }
            }
        }

        // Step 3: Drop old grade_subject table
        if (Schema::hasTable('grade_subject')) {
            Schema::dropIfExists('grade_subject');
            echo "Dropped old grade_subject table\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse Step 3: Recreate grade_subject table
        if (!Schema::hasTable('grade_subject')) {
            Schema::create('grade_subject', function (Blueprint $table) {
                $table->id();
                $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
                $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
                $table->integer('sessions_per_week')->default(4);
                $table->enum('priority', ['high', 'neutral', 'low'])->default('neutral');
                $table->boolean('must_be_daily')->default(false);
                $table->boolean('can_repeat_same_day')->default(false);
                $table->timestamps();
                
                $table->unique(['grade_id', 'subject_id']);
            });
        }

        // Reverse Step 2: Migrate data back from stream_subject to grade_subject
        if (Schema::hasTable('stream_subject')) {
            $assignments = DB::table('stream_subject')->get();
            
            foreach ($assignments as $assignment) {
                $stream = DB::table('streams')->where('id', $assignment->stream_id)->first();
                
                if ($stream) {
                    $exists = DB::table('grade_subject')
                        ->where('grade_id', $stream->grade_id)
                        ->where('subject_id', $assignment->subject_id)
                        ->exists();
                    
                    if (!$exists) {
                        DB::table('grade_subject')->insert([
                            'grade_id' => $stream->grade_id,
                            'subject_id' => $assignment->subject_id,
                            'sessions_per_week' => $assignment->sessions_per_week,
                            'priority' => $assignment->priority,
                            'must_be_daily' => $assignment->must_be_daily,
                            'can_repeat_same_day' => $assignment->can_repeat_same_day,
                            'created_at' => $assignment->created_at ?? now(),
                            'updated_at' => $assignment->updated_at ?? now(),
                        ]);
                    }
                }
            }
        }

        // Reverse Step 1: Drop stream_subject table
        Schema::dropIfExists('stream_subject');
    }
};

