<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class QuranSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'teacher_id',
        'school_id',
        'schedule_type',
        'target_pages_per_period',
        'target_verses_per_period',
        'start_date',
        'expected_completion_date',
        'target_total_pages',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'expected_completion_date' => 'date',
        'is_active' => 'boolean',
        'target_pages_per_period' => 'integer',
        'target_verses_per_period' => 'integer',
        'target_total_pages' => 'integer',
    ];

    /**
     * Relationships
     */
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

    /**
     * Scopes
     */
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

    public function scopeScheduleType($query, $type)
    {
        return $query->where('schedule_type', $type);
    }

    /**
     * Computed Attributes
     */
    public function getScheduleTypeLabelAttribute()
    {
        $labels = [
            'daily' => 'Daily',
            'weekly' => 'Weekly',
            'monthly' => 'Monthly',
        ];

        return $labels[$this->schedule_type] ?? 'Unknown';
    }

    public function getDaysElapsedAttribute()
    {
        return $this->start_date->diffInDays(Carbon::now());
    }

    public function getDaysRemainingAttribute()
    {
        if (!$this->expected_completion_date) {
            return null;
        }

        $remaining = Carbon::now()->diffInDays($this->expected_completion_date, false);
        return $remaining > 0 ? $remaining : 0;
    }

    public function getIsOverdueAttribute()
    {
        if (!$this->expected_completion_date) {
            return false;
        }

        return Carbon::now()->isAfter($this->expected_completion_date);
    }

    public function getProgressPercentageAttribute()
    {
        if (!$this->target_total_pages) {
            return 0;
        }

        // Get student's total pages memorized
        $totalMemorized = $this->student->quranTracking()
            ->where('date', '>=', $this->start_date)
            ->sum('pages_memorized');

        return min(100, round(($totalMemorized / $this->target_total_pages) * 100));
    }

    public function getCurrentProgressAttribute()
    {
        // Get student's total pages memorized since schedule start
        return $this->student->quranTracking()
            ->where('date', '>=', $this->start_date)
            ->sum('pages_memorized');
    }

    public function getStatusBadgeAttribute()
    {
        if (!$this->is_active) {
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

    /**
     * Helper Methods
     */
    public function deactivate()
    {
        $this->update(['is_active' => false]);
    }

    public function activate()
    {
        // Deactivate other active schedules for this student
        self::where('student_id', $this->student_id)
            ->where('id', '!=', $this->id)
            ->update(['is_active' => false]);

        $this->update(['is_active' => true]);
    }

    /**
     * Validation Rules
     */
    public static function validationRules()
    {
        return [
            'student_id' => 'required|exists:students,id',
            'schedule_type' => 'required|in:daily,weekly,monthly',
            'target_pages_per_period' => 'nullable|integer|min:1',
            'target_verses_per_period' => 'nullable|integer|min:1',
            'start_date' => 'required|date',
            'expected_completion_date' => 'nullable|date|after:start_date',
            'target_total_pages' => 'nullable|integer|min:1|max:604',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Boot method to enforce one active schedule per student
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($schedule) {
            if ($schedule->is_active) {
                // Deactivate other active schedules for this student
                self::where('student_id', $schedule->student_id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }
        });

        static::updating(function ($schedule) {
            if ($schedule->is_active && $schedule->isDirty('is_active')) {
                // Deactivate other active schedules for this student
                self::where('student_id', $schedule->student_id)
                    ->where('id', '!=', $schedule->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }
        });
    }
}

