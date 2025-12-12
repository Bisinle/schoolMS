<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuranAssessment extends Model
{
    use HasFactory;

    protected $table = 'quran_assessments';

    protected $fillable = [
        'quran_tracking_id',
        'fluency_rating',
        'tajweed_rating',
        'mistakes_count',
        'assessment_notes',
    ];

    protected $casts = [
        'fluency_rating' => 'integer',
        'tajweed_rating' => 'integer',
        'mistakes_count' => 'integer',
    ];

    /**
     * Get the quran tracking record that owns this assessment.
     */
    public function quranTracking()
    {
        return $this->belongsTo(QuranTracking::class);
    }

    /**
     * Get average rating (average of fluency and tajweed).
     */
    public function getAverageRatingAttribute()
    {
        $ratings = array_filter([$this->fluency_rating, $this->tajweed_rating]);
        
        if (empty($ratings)) {
            return null;
        }
        
        return round(array_sum($ratings) / count($ratings), 1);
    }

    /**
     * Check if assessment has any ratings.
     */
    public function hasRatings()
    {
        return $this->fluency_rating !== null || $this->tajweed_rating !== null;
    }

    /**
     * Get performance level based on average rating.
     */
    public function getPerformanceLevelAttribute()
    {
        $avg = $this->average_rating;
        
        if ($avg === null) {
            return null;
        }
        
        return match(true) {
            $avg >= 4.5 => 'Excellent',
            $avg >= 3.5 => 'Very Good',
            $avg >= 2.5 => 'Good',
            $avg >= 1.5 => 'Fair',
            default => 'Needs Improvement',
        };
    }
}

