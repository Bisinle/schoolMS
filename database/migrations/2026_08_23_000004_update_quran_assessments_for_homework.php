<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quran_assessments', function (Blueprint $table) {
            $table->foreignId('quran_homework_id')->nullable()->after('id')
                ->constrained('quran_homework')->onDelete('cascade');
            $table->foreignId('school_id')->nullable()->after('quran_homework_id')
                ->constrained('schools')->onDelete('cascade');
        });

        // Same underlying rows as before — quran_tracking_id just becomes
        // quran_homework_id, since quran_tracking was renamed in the
        // previous migration.
        DB::table('quran_assessments')->orderBy('id')->chunkById(200, function ($rows) {
            foreach ($rows as $row) {
                DB::table('quran_assessments')->where('id', $row->id)->update([
                    'quran_homework_id' => $row->quran_tracking_id,
                ]);
            }
        });

        DB::table('quran_assessments')->orderBy('id')->chunkById(200, function ($rows) {
            foreach ($rows as $row) {
                $schoolId = DB::table('quran_homework')->where('id', $row->quran_homework_id)->value('school_id');
                if ($schoolId) {
                    DB::table('quran_assessments')->where('id', $row->id)->update(['school_id' => $schoolId]);
                }
            }
        });

        Schema::table('quran_assessments', function (Blueprint $table) {
            $table->dropForeign(['quran_tracking_id']);
            // The original create-table migration also added a standalone
            // index on this column (in addition to the FK's own index) —
            // drop it explicitly, otherwise SQLite's column-drop rebuild
            // chokes on the now-dangling index definition.
            $table->dropIndex(['quran_tracking_id']);
            $table->dropColumn('quran_tracking_id');
        });

        Schema::table('quran_assessments', function (Blueprint $table) {
            $table->foreignId('quran_homework_id')->nullable(false)->change();
            $table->foreignId('school_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('quran_assessments', function (Blueprint $table) {
            $table->foreignId('quran_tracking_id')->nullable()->after('id')
                ->constrained('quran_homework')->onDelete('cascade');
            // Restore the standalone index the original create-table
            // migration added (separate from the FK's own index), so a
            // subsequent up() has it to drop again.
            $table->index('quran_tracking_id');
        });

        DB::table('quran_assessments')->orderBy('id')->chunkById(200, function ($rows) {
            foreach ($rows as $row) {
                DB::table('quran_assessments')->where('id', $row->id)->update([
                    'quran_tracking_id' => $row->quran_homework_id,
                ]);
            }
        });

        Schema::table('quran_assessments', function (Blueprint $table) {
            $table->dropForeign(['quran_homework_id']);
            $table->dropForeign(['school_id']);
            $table->dropColumn(['quran_homework_id', 'school_id']);
            $table->foreignId('quran_tracking_id')->nullable(false)->change();
        });
    }
};
