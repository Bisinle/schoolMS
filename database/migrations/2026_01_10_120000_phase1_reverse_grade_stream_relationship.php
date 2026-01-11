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
     * PHASE 1: Reverse Grade-Stream Relationship
     * - Add grade_id to streams table
     * - Add capacity and room_id to streams table
     * - Migrate existing data from grades.stream_id to streams.grade_id
     * - Remove stream_id from grades table
     * - Update unique constraints
     */
    public function up(): void
    {
        // Step 1: Add grade_id, capacity, and room_id to streams table
        Schema::table('streams', function (Blueprint $table) {
            // Add grade_id (foreign key to grades) - only if it doesn't exist
            if (!Schema::hasColumn('streams', 'grade_id')) {
                $table->foreignId('grade_id')
                    ->nullable() // Temporarily nullable for migration
                    ->after('school_id')
                    ->constrained('grades')
                    ->cascadeOnDelete();
            }

            // Add capacity (moved from grades to streams) - only if it doesn't exist
            if (!Schema::hasColumn('streams', 'capacity')) {
                $table->integer('capacity')
                    ->default(40)
                    ->after('code');
            }

            // Add room_id (streams have specific rooms) - only if it doesn't exist
            if (!Schema::hasColumn('streams', 'room_id')) {
                $table->foreignId('room_id')
                    ->nullable()
                    ->after('capacity')
                    ->constrained('rooms')
                    ->nullOnDelete();
            }

            // Add description - only if it doesn't exist
            if (!Schema::hasColumn('streams', 'description')) {
                $table->text('description')->nullable()->after('room_id');
            }
        });

        // Step 2: Migrate existing data
        // Only run this if grades.stream_id column exists
        if (Schema::hasColumn('grades', 'stream_id')) {
            // If any grades have stream_id set, update those streams with the grade_id
            DB::statement('
                UPDATE streams
                SET grade_id = (
                    SELECT id FROM grades
                    WHERE grades.stream_id = streams.id
                    LIMIT 1
                )
                WHERE EXISTS (
                    SELECT 1 FROM grades
                    WHERE grades.stream_id = streams.id
                )
            ');
        }

        // Step 2b: Delete orphaned streams (streams without grade_id)
        // These are streams created by seeders before the proper architecture
        // In Phase 2, we'll auto-create "Main" streams for each grade
        $orphanedCount = DB::table('streams')->whereNull('grade_id')->count();
        if ($orphanedCount > 0) {
            echo "Deleting {$orphanedCount} orphaned streams without grade_id...\n";
            DB::table('streams')->whereNull('grade_id')->delete();
        }

        // Step 3: Drop old unique constraint on streams and add new one
        // Check if old constraint exists before trying to drop it
        $hasOldConstraint = DB::select("
            SELECT COUNT(*) as count
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
            AND table_name = 'streams'
            AND index_name = 'streams_school_id_name_unique'
        ");

        if ($hasOldConstraint[0]->count > 0) {
            Schema::table('streams', function (Blueprint $table) {
                $table->dropUnique('streams_school_id_name_unique');
            });
        }

        // Check if new constraint exists before trying to add it
        $hasNewConstraint = DB::select("
            SELECT COUNT(*) as count
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
            AND table_name = 'streams'
            AND index_name = 'unique_stream_per_grade'
        ");

        if ($hasNewConstraint[0]->count == 0) {
            Schema::table('streams', function (Blueprint $table) {
                // Add new unique constraint: (school_id, grade_id, name)
                // This allows "Grade 1 East" and "Grade 2 East" but prevents duplicate "Grade 1 East"
                $table->unique(['school_id', 'grade_id', 'name'], 'unique_stream_per_grade');
            });
        }

        // Check if index exists before trying to add it
        $hasIndex = DB::select("
            SELECT COUNT(*) as count
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
            AND table_name = 'streams'
            AND index_name = 'streams_school_id_grade_id_status_index'
        ");

        if ($hasIndex[0]->count == 0) {
            Schema::table('streams', function (Blueprint $table) {
                $table->index(['school_id', 'grade_id', 'status']);
            });
        }

        // Step 4: Remove stream_id from grades table (if it exists)
        if (Schema::hasColumn('grades', 'stream_id')) {
            Schema::table('grades', function (Blueprint $table) {
                // Drop the unique constraint that includes stream_id
                try {
                    $table->dropUnique('unique_grade_stream');
                } catch (\Exception $e) {
                    // Constraint might not exist, continue
                }

                // Drop the index
                try {
                    $table->dropIndex(['school_id', 'stream_id']);
                } catch (\Exception $e) {
                    // Index might not exist, continue
                }

                // Drop the foreign key and column
                $table->dropForeign(['stream_id']);
                $table->dropColumn('stream_id');
            });
        }

        // Step 5: Restore original unique constraint on grades (if it doesn't exist)
        $hasGradeConstraint = DB::select("
            SELECT COUNT(*) as count
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
            AND table_name = 'grades'
            AND index_name = 'grades_name_school_unique'
        ");

        if ($hasGradeConstraint[0]->count == 0) {
            Schema::table('grades', function (Blueprint $table) {
                // Add back the original unique constraint: (school_id, name)
                $table->unique(['school_id', 'name'], 'grades_name_school_unique');
            });
        }

        // Step 6: Make grade_id NOT NULL in streams (after migration)
        Schema::table('streams', function (Blueprint $table) {
            $table->foreignId('grade_id')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse Step 6: Make grade_id nullable again
        Schema::table('streams', function (Blueprint $table) {
            $table->foreignId('grade_id')->nullable()->change();
        });

        // Reverse Step 5: Drop the restored unique constraint on grades
        Schema::table('grades', function (Blueprint $table) {
            try {
                $table->dropUnique('grades_name_school_unique');
            } catch (\Exception $e) {
                // Continue
            }
        });

        // Reverse Step 4: Add stream_id back to grades
        Schema::table('grades', function (Blueprint $table) {
            $table->foreignId('stream_id')
                ->nullable()
                ->after('school_id')
                ->constrained('streams')
                ->nullOnDelete();
            
            $table->index(['school_id', 'stream_id']);
            $table->unique(['school_id', 'name', 'stream_id'], 'unique_grade_stream');
        });

        // Reverse Step 3: Restore old unique constraint on streams
        Schema::table('streams', function (Blueprint $table) {
            $table->dropUnique('unique_stream_per_grade');
            $table->dropIndex(['school_id', 'grade_id', 'status']);
            $table->unique(['school_id', 'name']);
        });

        // Reverse Step 2: Migrate data back (if needed)
        // This is complex and may result in data loss, so we skip it

        // Reverse Step 1: Remove columns from streams
        Schema::table('streams', function (Blueprint $table) {
            $table->dropForeign(['grade_id']);
            $table->dropForeign(['room_id']);
            $table->dropColumn(['grade_id', 'capacity', 'room_id', 'description']);
        });
    }
};

