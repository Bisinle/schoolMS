<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuranHomework extends Model
{
    use HasFactory, BelongsToSchool;

    protected $table = 'quran_homework';

    protected $fillable = [
        'student_id',
        'teacher_id',
        'school_id',
        'quran_schedule_id',
        'assigned_date',
        'status',
        'reading_type',
        'surah_from',
        'verse_from',
        'surah_to',
        'verse_to',
        'page_from',
        'page_to',
        'quality_rating',
        'pages_memorized',
        'surahs_memorized',
        'juz_memorized',
        'juz_from',
        'juz_to',
        'hizb_from',
        'hizb_to',
        'rub_from',
        'rub_to',
        'subac_participation',
        'notes',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'surah_from' => 'integer',
        'verse_from' => 'integer',
        'surah_to' => 'integer',
        'verse_to' => 'integer',
        'page_from' => 'integer',
        'page_to' => 'integer',
        'pages_memorized' => 'integer',
        'surahs_memorized' => 'integer',
        'juz_memorized' => 'integer',
        'juz_from' => 'integer',
        'juz_to' => 'integer',
        'hizb_from' => 'integer',
        'hizb_to' => 'integer',
        'rub_from' => 'integer',
        'rub_to' => 'integer',
        'subac_participation' => 'boolean',
    ];

    protected $appends = ['reading_type_label', 'quality_rating_label', 'total_verses', 'status_label'];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function schedule()
    {
        return $this->belongsTo(QuranSchedule::class, 'quran_schedule_id');
    }

    public function assessment()
    {
        return $this->hasOne(QuranAssessment::class);
    }

    public function scopeReadingType($query, $type)
    {
        return $query->where('reading_type', $type);
    }

    public function scopeDateRange($query, $from, $to)
    {
        return $query->whereBetween('assigned_date', [$from, $to]);
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeGraded($query)
    {
        return $query->where('status', 'graded');
    }

    public function scopeAbsent($query)
    {
        return $query->where('status', 'absent');
    }

    public function scopeNotPrepared($query)
    {
        return $query->where('status', 'not_prepared');
    }

    public function getTotalVersesAttribute()
    {
        if ($this->surah_from == $this->surah_to) {
            return ($this->verse_to - $this->verse_from) + 1;
        }

        // Multi-surah: computed in the controller via QuranApiClient.
        return null;
    }

    public function getIsMultiSurahAttribute()
    {
        return $this->surah_from != $this->surah_to;
    }

    public function getSurahRangeAttribute()
    {
        if ($this->surah_from == $this->surah_to) {
            return "Surah {$this->surah_from}";
        }

        return "Surah {$this->surah_from} - {$this->surah_to}";
    }

    public function getReadingTypeLabelAttribute()
    {
        return match ($this->reading_type) {
            'new_learning' => 'New Learning',
            'revision' => 'Revision',
            'subac' => 'Subac',
            default => $this->reading_type,
        };
    }

    public function getQualityRatingLabelAttribute()
    {
        return match ($this->quality_rating) {
            'excellent' => 'Excellent',
            'very_good' => 'Very Good',
            'moderate' => 'Moderate',
            'poor' => 'Poor',
            default => null,
        };
    }

    public function getStatusLabelAttribute()
    {
        return match ($this->status) {
            'pending' => 'Pending',
            'graded' => 'Graded',
            'absent' => 'Absent',
            'not_prepared' => 'Not Prepared',
            default => $this->status,
        };
    }
}
