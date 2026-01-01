<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlueprintPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'level_day_blueprint_id',
        'sequence_order',
        'period_type',
        'duration_minutes',
        'priority_band',
        'is_teachable',
        'start_time',
        'end_time',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'is_teachable' => 'boolean',
        'sequence_order' => 'integer',
        'duration_minutes' => 'integer',
    ];

    /**
     * Get the blueprint that owns this period.
     */
    public function blueprint()
    {
        return $this->belongsTo(LevelDayBlueprint::class, 'level_day_blueprint_id');
    }

    /**
     * Scope to get only teachable periods.
     */
    public function scopeTeachable($query)
    {
        return $query->where('is_teachable', true);
    }

    /**
     * Scope to get periods by priority band.
     */
    public function scopeByPriorityBand($query, $band)
    {
        return $query->where('priority_band', $band);
    }

    /**
     * Scope to get periods by type.
     */
    public function scopeByType($query, $type)
    {
        return $query->where('period_type', $type);
    }

    /**
     * Check if this is a lesson period.
     */
    public function isLesson()
    {
        return $this->period_type === 'lesson' && $this->is_teachable;
    }

    /**
     * Check if this is a break period.
     */
    public function isBreak()
    {
        return in_array($this->period_type, ['short_break', 'breakfast', 'lunch']);
    }

    /**
     * Get a human-readable label for this period.
     */
    public function getLabelAttribute()
    {
        if ($this->isLesson()) {
            return "Lesson {$this->sequence_order}";
        }
        
        return ucwords(str_replace('_', ' ', $this->period_type));
    }
}

