<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuranHomework extends Model
{
    use HasFactory;

    protected $table = 'quran_homework';

    protected $fillable = [
        'student_id',
        'teacher_id',
        'school_id',
        'assigned_date',
        'due_date',
        'homework_type',
        'surah_from',
        'verse_from',
        'surah_to',
        'verse_to',
        'page_from',
        'page_to',
        'completed',
        'completion_date',
        'teacher_instructions',
        'completion_notes',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'due_date' => 'date',
        'completion_date' => 'date',
        'surah_from' => 'integer',
        'verse_from' => 'integer',
        'surah_to' => 'integer',
        'verse_to' => 'integer',
        'page_from' => 'integer',
        'page_to' => 'integer',
        'completed' => 'boolean',
    ];

    // Relationships
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

    // Scopes
    public function scopePending($query)
    {
        return $query->where('completed', false);
    }

    public function scopeCompleted($query)
    {
        return $query->where('completed', true);
    }

    public function scopeOverdue($query)
    {
        return $query->where('completed', false)
            ->where('due_date', '<', now());
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeHomeworkType($query, $type)
    {
        return $query->where('homework_type', $type);
    }

    // Computed attributes
    public function getIsOverdueAttribute()
    {
        return !$this->completed && $this->due_date->isPast();
    }

    public function getDaysUntilDueAttribute()
    {
        return $this->due_date->diffInDays(now(), false);
    }

    public function getHomeworkTypeLabelAttribute()
    {
        return match($this->homework_type) {
            'memorize' => 'Memorization',
            'revise' => 'Revision',
            'read' => 'Reading',
            default => 'Unknown'
        };
    }

    public function getStatusBadgeAttribute()
    {
        if ($this->completed) {
            return 'completed';
        }
        
        if ($this->is_overdue) {
            return 'overdue';
        }
        
        return 'pending';
    }

    protected $appends = ['homework_type_label', 'is_overdue', 'status_badge'];

    // Helper method to check if homework matches a tracking record
    public function matchesTracking(QuranTracking $tracking)
    {
        return $this->surah_from == $tracking->surah_from
            && $this->surah_to == $tracking->surah_to
            && $this->verse_from == $tracking->verse_from
            && $this->verse_to == $tracking->verse_to;
    }

    // Mark homework as complete
    public function markAsComplete($notes = null)
    {
        $this->update([
            'completed' => true,
            'completion_date' => now(),
            'completion_notes' => $notes,
        ]);
    }
}

