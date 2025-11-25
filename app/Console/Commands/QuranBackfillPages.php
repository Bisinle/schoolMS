<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\QuranTracking;
use App\Services\QuranTrackingCalculator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Backfill page_from/page_to and computed fields for existing quran_tracking rows.
 * 
 * Usage: php artisan quran:backfill-pages
 */
class QuranBackfillPages extends Command
{
    protected $signature = 'quran:backfill-pages {--batch=500 : Number of records to process per batch}';
    
    protected $description = 'Backfill page_from/page_to and computed fields for existing quran_tracking rows';

    public function handle(QuranTrackingCalculator $calculator): int
    {
        $this->info('🕌 Starting Quran Tracking backfill...');
        $this->newLine();

        // Find records that need backfilling
        $query = QuranTracking::query()
            ->where(function($q) {
                $q->whereNull('page_from')
                  ->orWhereNull('page_to')
                  ->orWhere('page_from', 0)
                  ->orWhere('page_to', 0)
                  ->orWhereNull('pages_memorized')
                  ->orWhereNull('juz_memorized')
                  ->orWhereNull('surahs_memorized');
            });

        $total = $query->count();
        
        if ($total === 0) {
            $this->info('✅ No records need backfilling. All done!');
            return 0;
        }

        $this->info("📊 Records to process: {$total}");
        $this->newLine();

        $bar = $this->output->createProgressBar($total);
        $bar->setFormat('verbose');
        $bar->start();

        $processed = 0;
        $updated = 0;
        $failed = 0;
        $failedIds = [];

        $query->chunk($this->option('batch'), function($rows) use ($calculator, $bar, &$processed, &$updated, &$failed, &$failedIds) {
            foreach ($rows as $row) {
                $processed++;
                $changed = false;

                try {
                    // Derive pages if missing or zero
                    if (empty($row->page_from) || empty($row->page_to)) {
                        $derived = $calculator->derivePagesFromVerses(
                            $row->surah_from,
                            $row->verse_from,
                            $row->surah_to,
                            $row->verse_to
                        );
                        
                        if ($derived) {
                            [$row->page_from, $row->page_to] = $derived;
                            $changed = true;
                        } else {
                            $failed++;
                            $failedIds[] = $row->id;
                            Log::warning("Could not derive pages for quran_tracking", [
                                'id' => $row->id,
                                'surah_from' => $row->surah_from,
                                'verse_from' => $row->verse_from,
                                'surah_to' => $row->surah_to,
                                'verse_to' => $row->verse_to,
                            ]);
                        }
                    }

                    // Compute metrics if we have valid pages
                    if ($row->page_from && $row->page_to) {
                        $row->pages_memorized = $calculator->computePages($row->page_from, $row->page_to);
                        $row->juz_memorized = $calculator->computeJuzByPages($row->page_from, $row->page_to);
                        $changed = true;
                    }

                    // Compute surahs
                    if ($row->surah_from && $row->surah_to) {
                        $row->surahs_memorized = $calculator->computeSurahs($row->surah_from, $row->surah_to);
                        $changed = true;
                    }

                    if ($changed) {
                        // Use saveQuietly to avoid triggering observer
                        $row->saveQuietly();
                        $updated++;
                    }

                } catch (\Exception $e) {
                    $failed++;
                    $failedIds[] = $row->id;
                    Log::error("Failed to backfill quran_tracking record", [
                        'id' => $row->id,
                        'error' => $e->getMessage(),
                    ]);
                }

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        // Summary
        $this->info('✅ Backfill complete!');
        $this->newLine();
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Processed', $processed],
                ['Successfully Updated', $updated],
                ['Failed', $failed],
            ]
        );

        if ($failed > 0) {
            $this->newLine();
            $this->warn("⚠️  {$failed} records could not be backfilled.");
            $this->warn('Failed IDs: ' . implode(', ', array_slice($failedIds, 0, 20)));
            if (count($failedIds) > 20) {
                $this->warn('... and ' . (count($failedIds) - 20) . ' more. Check logs for details.');
            }
            $this->newLine();
            $this->info('💡 These records may need manual review. Check the logs for details.');
        }

        return 0;
    }
}

