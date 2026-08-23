<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use App\Services\QuranTrackingCalculator;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuranSchedule extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'student_id',
        'teacher_id',
        'school_id',
        'surah_from',
        'verse_from',
        'surah_to',
        'verse_to',
        'start_date',
        'end_date',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'surah_from' => 'integer',
        'verse_from' => 'integer',
        'surah_to' => 'integer',
        'verse_to' => 'integer',
    ];

    protected $appends = ['target_total_pages', 'current_progress', 'progress_percentage', 'days_elapsed', 'days_remaining', 'status_badge'];

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

    public function homework()
    {
        return $this->hasMany(QuranHomework::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function getDaysElapsedAttribute()
    {
        return $this->start_date->diffInDays(Carbon::now());
    }

    public function getDaysRemainingAttribute()
    {
        if (! $this->end_date) {
            return null;
        }

        $remaining = Carbon::now()->diffInDays($this->end_date, false);

        return $remaining > 0 ? $remaining : 0;
    }

    public function getIsOverdueAttribute()
    {
        if (! $this->end_date) {
            return false;
        }

        return Carbon::now()->isAfter($this->end_date);
    }

    /**
     * Computed, not stored — derived from the verse range via the same
     * page-mapping infra Homework uses, so it can never drift from it.
     */
    public function getTargetTotalPagesAttribute()
    {
        $calculator = app(QuranTrackingCalculator::class);
        $pages = $calculator->derivePagesFromVerses($this->surah_from, $this->verse_from, $this->surah_to, $this->verse_to);

        if (! $pages) {
            return null;
        }

        return $calculator->computePages($pages[0], $pages[1]);
    }

    public function getProgressPercentageAttribute()
    {
        $target = $this->target_total_pages;

        if (! $target) {
            return 0;
        }

        return min(100, round(($this->current_progress / $target) * 100));
    }

    public function getCurrentProgressAttribute()
    {
        return $this->homework()->where('status', 'graded')->sum('pages_memorized');
    }

    public function getStatusBadgeAttribute()
    {
        if (! $this->is_active) {
            return 'inactive';
        }

        if ($this->is_overdue) {
            return 'overdue';
        }

        $progress = $this->progress_percentage;

        if ($progress >= 100) {
            return 'completed';
        } elseif ($progress >= 75) {
            return 'on_track';
        } elseif ($progress >= 50) {
            return 'behind';
        } else {
            return 'significantly_behind';
        }
    }

    public function deactivate()
    {
        $this->update(['is_active' => false]);
    }

    public function activate()
    {
        self::where('student_id', $this->student_id)
            ->where('id', '!=', $this->id)
            ->update(['is_active' => false]);

        $this->update(['is_active' => true]);
    }

    public static function validationRules()
    {
        return [
            'student_id' => 'required|exists:students,id',
            'surah_from' => 'required|integer|min:1|max:114',
            'verse_from' => 'required|integer|min:1',
            'surah_to' => 'required|integer|min:1|max:114',
            'verse_to' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($schedule) {
            if ($schedule->is_active) {
                self::where('student_id', $schedule->student_id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }
        });

        static::updating(function ($schedule) {
            if ($schedule->is_active && $schedule->isDirty('is_active')) {
                self::where('student_id', $schedule->student_id)
                    ->where('id', '!=', $schedule->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }
        });
    }
}
