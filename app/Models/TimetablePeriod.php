<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class TimetablePeriod extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'generated_from_blueprint_id', // Track if auto-generated from blueprint
        'grade_level',          // Grade level group (ECD, LOWER PRIMARY, UPPER PRIMARY, JUNIOR SECONDARY)
        'name',
        'order',                // Chronological position in the day (unique per school + grade_level)
        'period_number',        // Optional label (nullable, non-unique)
        'lesson_number',        // Lesson number for lesson-type periods only
        'start_time',
        'end_time',
        'duration_minutes',
        'period_type',
        'is_break',
        'is_active',
        'description',
        'color_code',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
            'period_number' => 'integer',
            'lesson_number' => 'integer',
            'duration_minutes' => 'integer',
            'is_break' => 'boolean',
            'is_active' => 'boolean',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
        ];
    }

    // Relationships
    public function slots()
    {
        return $this->hasMany(TimetableSlot::class, 'timetable_period_id');
    }

    public function generatedFromBlueprint()
    {
        return $this->belongsTo(LevelDayBlueprint::class, 'generated_from_blueprint_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLessons($query)
    {
        return $query->where('period_type', 'lesson');
    }

    public function scopeBreaks($query)
    {
        return $query->where('is_break', true);
    }

    /**
     * Filter by grade level
     */
    public function scopeForGradeLevel($query, $gradeLevel)
    {
        return $query->where('grade_level', $gradeLevel);
    }

    /**
     * Order periods by their chronological sequence in the day
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }

    /**
     * Order periods by lesson number (for lesson-type periods only)
     */
    public function scopeByLessonNumber($query)
    {
        return $query->whereNotNull('lesson_number')->orderBy('lesson_number');
    }

    /**
     * Filter periods that were auto-generated from blueprints
     */
    public function scopeGenerated($query)
    {
        return $query->whereNotNull('generated_from_blueprint_id');
    }

    /**
     * Filter periods that were manually created
     */
    public function scopeManual($query)
    {
        return $query->whereNull('generated_from_blueprint_id');
    }

    // Helper methods
    public function isLesson(): bool
    {
        return $this->period_type === 'lesson';
    }

    public function isBreakPeriod(): bool
    {
        return $this->is_break || in_array($this->period_type, ['break', 'lunch']);
    }

    public function isGenerated(): bool
    {
        return !is_null($this->generated_from_blueprint_id);
    }

    public function getDurationInMinutes(): int
    {
        if ($this->duration_minutes) {
            return $this->duration_minutes;
        }

        // Calculate from start and end time
        $start = \Carbon\Carbon::parse($this->start_time);
        $end = \Carbon\Carbon::parse($this->end_time);

        return $start->diffInMinutes($end);
    }
}

