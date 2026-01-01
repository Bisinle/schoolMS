<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class LevelDayBlueprint extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'level',
        'name',
        'start_time',
        'end_time',
        'is_active',
        'description',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'is_active' => 'boolean',
    ];

    /**
     * Get the school that owns this blueprint.
     */
    public function school()
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get all periods for this blueprint, ordered by sequence.
     */
    public function periods()
    {
        return $this->hasMany(BlueprintPeriod::class)->orderBy('sequence_order');
    }

    /**
     * Get only the teachable lesson periods.
     */
    public function lessonPeriods()
    {
        return $this->periods()->where('is_teachable', true);
    }

    /**
     * Get the total number of lesson periods in this blueprint.
     */
    public function getLessonPeriodsCountAttribute()
    {
        return $this->lessonPeriods()->count();
    }

    /**
     * Get the total duration of the school day in minutes.
     */
    public function getTotalDurationAttribute()
    {
        $start = \Carbon\Carbon::parse($this->start_time);
        $end = \Carbon\Carbon::parse($this->end_time);
        return $start->diffInMinutes($end);
    }
}

