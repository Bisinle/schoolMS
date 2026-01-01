<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\TimetablePeriod;
use App\Models\TimetableTemplate;
use App\Models\TimetableSlot;

class ClearTimetableData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'timetable:clear-all {--force : Force deletion without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete all timetable periods, templates, and slots from the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('force')) {
            if (!$this->confirm('This will delete ALL timetable periods, templates, and slots. Are you sure?')) {
                $this->info('Operation cancelled.');
                return 0;
            }
        }

        $this->info('Starting deletion process...');

        DB::beginTransaction();

        try {
            // Delete timetable slots first (due to foreign key constraints)
            $slotsCount = TimetableSlot::count();
            $this->info("Deleting {$slotsCount} timetable slots...");
            TimetableSlot::query()->delete();
            $this->info('✓ Timetable slots deleted');

            // Delete timetable templates
            $templatesCount = TimetableTemplate::count();
            $this->info("Deleting {$templatesCount} timetable templates...");
            TimetableTemplate::query()->delete();
            $this->info('✓ Timetable templates deleted');

            // Delete timetable periods
            $periodsCount = TimetablePeriod::count();
            $this->info("Deleting {$periodsCount} timetable periods...");
            TimetablePeriod::query()->delete();
            $this->info('✓ Timetable periods deleted');

            DB::commit();

            $this->newLine();
            $this->info('✅ All timetable data has been successfully deleted!');
            $this->table(
                ['Type', 'Count Deleted'],
                [
                    ['Timetable Slots', $slotsCount],
                    ['Timetable Templates', $templatesCount],
                    ['Timetable Periods', $periodsCount],
                ]
            );

            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ Error occurred during deletion: ' . $e->getMessage());
            return 1;
        }
    }
}

