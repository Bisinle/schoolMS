<?php

namespace App\Observers;

use App\Models\QuranTracking;
use App\Models\QuranHomework;
use App\Services\QuranTrackingCalculator;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;

/**
 * Observer for QuranTracking model.
 * Automatically computes pages_memorized, surahs_memorized, and juz_memorized
 * on create and update operations.
 */
class QuranTrackingObserver
{
    protected QuranTrackingCalculator $calculator;

    public function __construct()
    {
        $this->calculator = App::make(QuranTrackingCalculator::class);
    }

    /**
     * Handle the QuranTracking "creating" event.
     */
    public function creating(QuranTracking $model): void
    {
        $this->computeAndSet($model);
    }

    /**
     * Handle the QuranTracking "updating" event.
     */
    public function updating(QuranTracking $model): void
    {
        $this->computeAndSet($model);
    }

    /**
     * Handle the QuranTracking "created" event.
     * Auto-complete matching homework assignments.
     */
    public function created(QuranTracking $model): void
    {
        $this->autoCompleteHomework($model);
    }

    /**
     * Compute and set all metrics for the model.
     */
    protected function computeAndSet(QuranTracking $model): void
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

            // Set derived pages if they were computed
            if (!empty($metrics['page_from']) && empty($model->page_from)) {
                $model->page_from = $metrics['page_from'];
            }
            if (!empty($metrics['page_to']) && empty($model->page_to)) {
                $model->page_to = $metrics['page_to'];
            }

            // Set computed metrics
            $model->pages_memorized = $metrics['pages_memorized'];
            $model->surahs_memorized = $metrics['surahs_memorized'];
            $model->juz_memorized = $metrics['juz_memorized'];

        } catch (\Exception $e) {
            Log::error('QuranTrackingObserver: Failed to compute metrics', [
                'model_id' => $model->id ?? 'new',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Set defaults on failure to prevent null values
            $model->pages_memorized = $model->pages_memorized ?? 0;
            $model->surahs_memorized = $model->surahs_memorized ?? 0;
            $model->juz_memorized = $model->juz_memorized ?? 0;
        }
    }

    /**
     * Auto-complete matching homework assignments when tracking is created.
     */
    protected function autoCompleteHomework(QuranTracking $model): void
    {
        try {
            // Find pending homework for this student that matches the tracking record
            $matchingHomework = QuranHomework::where('student_id', $model->student_id)
                ->where('completed', false)
                ->where('surah_from', $model->surah_from)
                ->where('surah_to', $model->surah_to)
                ->where('verse_from', $model->verse_from)
                ->where('verse_to', $model->verse_to)
                ->get();

            // Mark all matching homework as complete
            foreach ($matchingHomework as $homework) {
                $homework->markAsComplete("Auto-completed by tracking record on {$model->date->format('Y-m-d')}");

                Log::info('QuranTrackingObserver: Auto-completed homework', [
                    'homework_id' => $homework->id,
                    'tracking_id' => $model->id,
                    'student_id' => $model->student_id,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('QuranTrackingObserver: Failed to auto-complete homework', [
                'tracking_id' => $model->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - this is a non-critical feature
        }
    }
}

