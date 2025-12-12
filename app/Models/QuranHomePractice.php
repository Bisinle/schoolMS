<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class QuranHomePractice extends Model
{
    use HasFactory;

    protected $table = 'quran_home_practice';

    protected $fillable = [
        'student_id',
        'guardian_id',
        'school_id',
        'practice_date',
        'duration_minutes',
        'practice_type',
        'surah_from',
        'surah_to',
        'verse_from',
        'verse_to',
        'page_from',
        'page_to',
        'notes',
    ];

    protected $casts = [
        'practice_date' => 'date',
        'duration_minutes' => 'integer',
        'surah_from' => 'integer',
        'surah_to' => 'integer',
        'verse_from' => 'integer',
        'verse_to' => 'integer',
        'page_from' => 'integer',
        'page_to' => 'integer',
    ];

    /**
     * Relationships
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Scopes
     */
    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeForGuardian($query, $guardianId)
    {
        return $query->where('guardian_id', $guardianId);
    }

    public function scopePracticeType($query, $type)
    {
        return $query->where('practice_type', $type);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('practice_date', [$startDate, $endDate]);
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('practice_date', [
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek(),
        ]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereBetween('practice_date', [
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth(),
        ]);
    }

    /**
     * Computed Attributes
     */
    public function getPracticeTypeLabelAttribute()
    {
        $labels = [
            'memorize' => 'Memorization',
            'revise' => 'Revision',
            'read' => 'Reading',
        ];

        return $labels[$this->practice_type] ?? 'Unknown';
    }

    public function getDurationHoursAttribute()
    {
        return round($this->duration_minutes / 60, 1);
    }

    public function getFormattedDurationAttribute()
    {
        $hours = floor($this->duration_minutes / 60);
        $minutes = $this->duration_minutes % 60;

        if ($hours > 0 && $minutes > 0) {
            return "{$hours}h {$minutes}m";
        } elseif ($hours > 0) {
            return "{$hours}h";
        } else {
            return "{$minutes}m";
        }
    }

    public function getIsFutureDateAttribute()
    {
        return $this->practice_date->isFuture();
    }

    public function getDaysAgoAttribute()
    {
        return $this->practice_date->diffInDays(Carbon::now());
    }

    /**
     * Helper Methods
     */
    public function hasSurahRange()
    {
        return !is_null($this->surah_from) && !is_null($this->surah_to);
    }

    public function hasPageRange()
    {
        return !is_null($this->page_from) && !is_null($this->page_to);
    }

    /**
     * Validation Rules
     */
    public static function validationRules()
    {
        return [
            'student_id' => 'required|exists:students,id',
            'practice_date' => 'required|date|before_or_equal:today',
            'duration_minutes' => 'required|integer|min:1|max:480', // Max 8 hours
            'practice_type' => 'required|in:memorize,revise,read',
            'surah_from' => 'nullable|integer|min:1|max:114',
            'surah_to' => 'nullable|integer|min:1|max:114|gte:surah_from',
            'verse_from' => 'nullable|integer|min:1',
            'verse_to' => 'nullable|integer|min:1|gte:verse_from',
            'page_from' => 'nullable|integer|min:1|max:604',
            'page_to' => 'nullable|integer|min:1|max:604|gte:page_from',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}

