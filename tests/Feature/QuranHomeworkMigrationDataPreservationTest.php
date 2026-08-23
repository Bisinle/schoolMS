<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The quran_tracking -> quran_homework migration is not a pure rename: it also
 * has to carry every pre-existing row across two semantic changes at once —
 * rows gain the new lifecycle `status` (all historical rows are completed work,
 * so 'graded'), and the old 3-value `difficulty` scale is remapped onto the new
 * 4-value `quality_rating` scale.
 *
 * Real schools have live tracking data, so silently losing or mis-mapping it is
 * the worst failure mode in the whole restructure. RefreshDatabase has already
 * run the migration by the time a test body executes, so this rewinds that one
 * migration, seeds a genuinely pre-migration row, and replays it forward.
 */
class QuranHomeworkMigrationDataPreservationTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION = 'database/migrations/2026_08_23_000003_rename_quran_tracking_to_quran_homework.php';

    public function test_pre_migration_tracking_rows_survive_with_remapped_status_and_rating(): void
    {
        $migration = require base_path(self::MIGRATION);

        $school = School::factory()->create();
        $teacherUser = User::factory()->create(['school_id' => $school->id, 'role' => 'teacher']);
        $student = Student::factory()->create(['school_id' => $school->id]);

        // Rewind to the pre-migration shape: quran_tracking with `difficulty`.
        $migration->down();
        $this->assertTrue(DB::getSchemaBuilder()->hasTable('quran_tracking'));

        // Seed a row exactly as a real school's historical data would look —
        // raw insert, so no model/observer/cast is involved.
        DB::table('quran_tracking')->insert([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'teacher_id' => $teacherUser->id,
            'date' => '2026-01-15',
            'reading_type' => 'new_learning',
            'surah_from' => 1,
            'verse_from' => 1,
            'surah_to' => 1,
            'verse_to' => 7,
            'page_from' => 1,
            'page_to' => 1,
            'pages_memorized' => 1,
            'surahs_memorized' => 1,
            'juz_memorized' => 1,
            'difficulty' => 'very_well',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Replay the migration forward.
        $migration->up();

        $this->assertFalse(DB::getSchemaBuilder()->hasTable('quran_tracking'));

        $row = DB::table('quran_homework')->first();

        $this->assertNotNull($row, 'The historical tracking row must survive the rename.');
        $this->assertSame('graded', $row->status);
        $this->assertSame('excellent', $row->quality_rating);

        // The rest of the record must come across untouched, under the
        // renamed date column.
        $this->assertSame($student->id, $row->student_id);
        $this->assertSame($school->id, $row->school_id);
        $this->assertSame(1, (int) $row->pages_memorized);
        $this->assertStringStartsWith('2026-01-15', $row->assigned_date);
    }
}
