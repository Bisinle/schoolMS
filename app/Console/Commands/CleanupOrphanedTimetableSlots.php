<?php

namespace App\Console\Commands;

use App\Models\TimetableSlot;
use App\Models\TimetableTemplate;
use Illuminate\Console\Command;

class CleanupOrphanedTimetableSlots extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'timetable:cleanup-orphaned-slots 
                            {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up orphaned timetable slots (slots without valid templates)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Searching for orphaned timetable slots...');
        $this->newLine();

        // Find slots that reference non-existent templates
        $orphanedSlots = TimetableSlot::whereNotIn('timetable_template_id',
            TimetableTemplate::pluck('id')
        )->get();

        if ($orphanedSlots->isEmpty()) {
            $this->info('✅ No orphaned slots found. Database is clean!');
            return 0;
        }

        $this->warn("Found {$orphanedSlots->count()} orphaned slot(s) without valid templates");
        $this->newLine();

        // Group by template for better reporting
        $slotsByTemplate = $orphanedSlots->groupBy('timetable_template_id');

        $this->table(
            ['Template ID', 'Slots Count', 'Status'],
            $slotsByTemplate->map(function ($slots, $templateId) {
                return [
                    $templateId,
                    $slots->count(),
                    'Template not found (deleted)'
                ];
            })->values()
        );

        $this->newLine();

        if ($this->option('dry-run')) {
            $this->warn('🔍 DRY RUN MODE - No changes will be made');
            $this->info("Would delete {$orphanedSlots->count()} orphaned slot(s)");
            return 0;
        }

        // Confirm deletion
        if (!$this->confirm("Do you want to delete these {$orphanedSlots->count()} orphaned slot(s)?", true)) {
            $this->info('❌ Cleanup cancelled');
            return 1;
        }

        // Delete orphaned slots
        $this->info('🗑️  Deleting orphaned slots...');
        $deletedCount = $orphanedSlots->count();

        TimetableSlot::whereNotIn('timetable_template_id',
            TimetableTemplate::pluck('id')
        )->delete();

        $this->newLine();
        $this->info("✅ Successfully deleted {$deletedCount} orphaned slot(s)!");
        $this->newLine();

        // Show summary
        $this->info('📊 Summary:');
        $this->line("  • Orphaned slots deleted: {$deletedCount}");
        $this->newLine();

        $this->info('💡 Note: Template deletions automatically cascade delete slots via database constraints.');

        return 0;
    }
}

