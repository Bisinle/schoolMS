<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class TeacherAvailability extends Model
{
    use HasFactory, BelongsToSchool;

    protected $table = 'teacher_availability';

    protected $fillable = [
        'school_id',
        'teacher_id',
        'academic_term_id',
        'day_of_week',
        'start_time',
        'end_time',
        'availability_type',
        'reason',
        'notes',
        'is_recurring',
        'effective_from',
        'effective_until',
    ];

    protected function casts(): array
    {
        return [
            'is_recurring' => 'boolean',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'effective_from' => 'date',
            'effective_until' => 'date',
        ];
    }

    // Relationships
    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function academicTerm()
    {
        return $this->belongsTo(AcademicTerm::class);
    }

    // Scopes
    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    public function scopeForDay($query, string $day)
    {
        return $query->where('day_of_week', $day);
    }

    public function scopeAvailable($query)
    {
        return $query->where('availability_type', 'available');
    }

    public function scopeUnavailable($query)
    {
        return $query->where('availability_type', 'unavailable');
    }

    public function scopeActive($query)
    {
        $today = now()->toDateString();
        
        return $query->where(function ($q) use ($today) {
            $q->whereNull('effective_from')
              ->orWhere('effective_from', '<=', $today);
        })->where(function ($q) use ($today) {
            $q->whereNull('effective_until')
              ->orWhere('effective_until', '>=', $today);
        });
    }

    public function scopeForTerm($query, $termId)
    {
        return $query->where(function ($q) use ($termId) {
            $q->where('academic_term_id', $termId)
              ->orWhereNull('academic_term_id'); // Include general availability
        });
    }

    // Helper methods
    public function isAvailable(): bool
    {
        return $this->availability_type === 'available';
    }

    public function isUnavailable(): bool
    {
        return $this->availability_type === 'unavailable';
    }

    public function isActiveNow(): bool
    {
        $today = now()->toDateString();
        
        $afterStart = !$this->effective_from || $this->effective_from <= $today;
        $beforeEnd = !$this->effective_until || $this->effective_until >= $today;
        
        return $afterStart && $beforeEnd;
    }

    public function conflictsWith($startTime, $endTime): bool
    {
        $thisStart = \Carbon\Carbon::parse($this->start_time);
        $thisEnd = \Carbon\Carbon::parse($this->end_time);
        $checkStart = \Carbon\Carbon::parse($startTime);
        $checkEnd = \Carbon\Carbon::parse($endTime);

        return $thisStart < $checkEnd && $thisEnd > $checkStart;
    }
}

