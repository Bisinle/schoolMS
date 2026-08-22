<?php

namespace App\Observers;

use App\Models\QuranHomework;
use App\Services\QuranTrackingCalculator;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;

/**
 * Automatically computes pages_memorized, surahs_memorized, juz_memorized,
 * and the Juz/Hizb/Rub ranges on create and update.
 */
class QuranHomeworkObserver
{
    protected QuranTrackingCalculator $calculator;

    public function __construct()
    {
        $this->calculator = App::make(QuranTrackingCalculator::class);
    }

    public function creating(QuranHomework $model): void
    {
        $this->computeAndSet($model);
    }

    public function updating(QuranHomework $model): void
    {
        $this->computeAndSet($model);
    }

    protected function computeAndSet(QuranHomework $model): void
    {
        try {
            $metrics = $this->calculator->computeAllMetrics(
                $model->page_from,
                $model->page_to,
                $model->surah_from,
                $model->surah_to,
                $model->verse_from,
                $model->verse_to
            );

            if (! empty($metrics['page_from']) && empty($model->page_from)) {
                $model->page_from = $metrics['page_from'];
            }
            if (! empty($metrics['page_to']) && empty($model->page_to)) {
                $model->page_to = $metrics['page_to'];
            }

            // Only compute these metrics if they haven't been explicitly set (i.e., if they're still 0/default)
            if (empty($model->pages_memorized)) {
                $model->pages_memorized = $metrics['pages_memorized'];
            }
            if (empty($model->surahs_memorized)) {
                $model->surahs_memorized = $metrics['surahs_memorized'];
            }
            if (empty($model->juz_memorized)) {
                $model->juz_memorized = $metrics['juz_memorized'];
            }

            // Always set the structural ranges
            $model->juz_from = $metrics['juz_from'];
            $model->juz_to = $metrics['juz_to'];
            $model->hizb_from = $metrics['hizb_from'];
            $model->hizb_to = $metrics['hizb_to'];
            $model->rub_from = $metrics['rub_from'];
            $model->rub_to = $metrics['rub_to'];
        } catch (\Exception $e) {
            Log::error('QuranHomeworkObserver: Failed to compute metrics', [
                'model_id' => $model->id ?? 'new',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $model->pages_memorized = $model->pages_memorized ?? 0;
            $model->surahs_memorized = $model->surahs_memorized ?? 0;
            $model->juz_memorized = $model->juz_memorized ?? 0;
        }
    }
}
