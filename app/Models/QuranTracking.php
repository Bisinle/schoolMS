<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class QuranTracking extends Model
{
    use HasFactory, BelongsToSchool;

    protected $table = 'quran_tracking';

    protected $fillable = [
        'student_id',
        'teacher_id',
        'school_id',
        'date',
        'reading_type',
        'surah_from',
        'surah_to',
        'verse_from',
        'verse_to',
        'page_from',
        'page_to',
        'difficulty',
        'pages_memorized',
        'surahs_memorized',
        'juz_memorized',
        'subac_participation',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'surah_from' => 'integer',
        'surah_to' => 'integer',
        'verse_from' => 'integer',
        'verse_to' => 'integer',
        'page_from' => 'integer',
        'page_to' => 'integer',
        'pages_memorized' => 'integer',
        'surahs_memorized' => 'integer',
        'juz_memorized' => 'integer',
        'subac_participation' => 'boolean',
    ];

    protected $appends = ['reading_type_label', 'difficulty_label', 'total_verses'];

    /**
     * Get the student that owns the tracking record.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the teacher that created the tracking record.
     */
    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * Get the school that owns the tracking record.
     */
    public function school()
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the assessment for this tracking record.
     */
    public function assessment()
    {
        return $this->hasOne(QuranAssessment::class);
    }

    /**
     * Scope to filter by reading type.
     */
    public function scopeReadingType($query, $type)
    {
        return $query->where('reading_type', $type);
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeDateRange($query, $from, $to)
    {
        return $query->whereBetween('date', [$from, $to]);
    }

    /**
     * Scope to filter by student.
     */
    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    /**
     * Get total verses covered in this tracking record.
     * For single surah: verse_to - verse_from + 1
     * For multi-surah: calculated using QuranApiService
     */
    public function getTotalVersesAttribute()
    {
        // If single surah
        if ($this->surah_from == $this->surah_to) {
            return ($this->verse_to - $this->verse_from) + 1;
        }

        // For multi-surah, this is a placeholder
        // The actual calculation should be done in the controller using QuranApiService
        return null;
    }

    /**
     * Check if this tracking spans multiple surahs.
     */
    public function getIsMultiSurahAttribute()
    {
        return $this->surah_from != $this->surah_to;
    }

    /**
     * Get surah range display.
     */
    public function getSurahRangeAttribute()
    {
        if ($this->surah_from == $this->surah_to) {
            return "Surah {$this->surah_from}";
        }
        return "Surah {$this->surah_from} - {$this->surah_to}";
    }

    /**
     * Get reading type label.
     */
    public function getReadingTypeLabelAttribute()
    {
        return match($this->reading_type) {
            'new_learning' => 'New Learning',
            'revision' => 'Revision',
            'subac' => 'Subac',
            default => $this->reading_type,
        };
    }

    /**
     * Get difficulty label.
     */
    public function getDifficultyLabelAttribute()
    {
        return match($this->difficulty) {
            'very_well' => 'Very Well',
            'middle' => 'Middle',
            'difficult' => 'Difficult',
            default => $this->difficulty,
        };
    }
}

