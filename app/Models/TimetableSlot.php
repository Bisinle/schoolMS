<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class TimetableSlot extends Model
{
    use HasFactory, BelongsToSchool;

    // Slot type constants
    public const TYPE_LESSON = 'lesson';
    public const TYPE_BREAK = 'break';
    public const TYPE_LUNCH = 'lunch';
    public const TYPE_ASSEMBLY = 'assembly';
    public const TYPE_ACTIVITY = 'activity';
    public const TYPE_STUDY = 'study';
    public const TYPE_OTHER = 'other';

    // Slot types that should not have subjects or teachers
    public const NON_ACADEMIC_TYPES = [
        self::TYPE_BREAK,
        self::TYPE_LUNCH,
    ];

    protected $fillable = [
        'school_id',
        'timetable_template_id',
        'timetable_period_id',
        'day_of_week',
        'sequence_order',
        'start_time',
        'end_time',
        'duration_minutes',
        'subject_id',
        'teacher_id',
        'auto_assigned_teacher',
        'room_id',
        'slot_type',
        'priority_band',
        'is_teachable',
        'manually_created',
        'notes',
        'topic',
        'is_substitution',
        'original_teacher_id',
    ];

    protected function casts(): array
    {
        return [
            'is_substitution' => 'boolean',
            'is_teachable' => 'boolean',
            'manually_created' => 'boolean',
            'auto_assigned_teacher' => 'boolean',
        ];
    }

    /**
     * Boot method to enforce business rules
     */
    protected static function boot()
    {
        parent::boot();

        // Before saving, enforce slot_type rules
        static::saving(function ($slot) {
            // If it's a break or lunch, clear subject, teacher, and topic
            if (in_array($slot->slot_type, self::NON_ACADEMIC_TYPES)) {
                $slot->subject_id = null;
                $slot->teacher_id = null;
                $slot->topic = null;
                $slot->is_substitution = false;
                $slot->original_teacher_id = null;
            }

            // If it's a lesson, subject_id is required (will be validated in controller)
            // This is just a safety check
            if ($slot->slot_type === self::TYPE_LESSON && !$slot->subject_id) {
                throw new \InvalidArgumentException('Lesson slots must have a subject assigned.');
            }
        });
    }

    // Relationships
    public function timetableTemplate()
    {
        return $this->belongsTo(TimetableTemplate::class);
    }

    // Alias for timetableTemplate
    public function template()
    {
        return $this->timetableTemplate();
    }

    public function period()
    {
        return $this->belongsTo(TimetablePeriod::class, 'timetable_period_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function originalTeacher()
    {
        return $this->belongsTo(Teacher::class, 'original_teacher_id');
    }

    public function conflicts()
    {
        return $this->hasMany(TimetableConflict::class, 'slot_id_1')
            ->orWhere('slot_id_2', $this->id);
    }

    // Scopes
    public function scopeForDay($query, string $day)
    {
        return $query->where('day_of_week', $day);
    }

    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    public function scopeForSubject($query, $subjectId)
    {
        return $query->where('subject_id', $subjectId);
    }

    public function scopeForRoom($query, $roomId)
    {
        return $query->where('room_id', $roomId);
    }

    public function scopeLessons($query)
    {
        return $query->where('slot_type', 'lesson');
    }

    public function scopeBreaks($query)
    {
        return $query->whereIn('slot_type', ['break', 'lunch']);
    }

    public function scopeSubstitutions($query)
    {
        return $query->where('is_substitution', true);
    }

    // Helper methods
    public function isLesson(): bool
    {
        return $this->slot_type === self::TYPE_LESSON;
    }

    public function isBreak(): bool
    {
        return in_array($this->slot_type, self::NON_ACADEMIC_TYPES);
    }

    public function isNonAcademic(): bool
    {
        return in_array($this->slot_type, self::NON_ACADEMIC_TYPES);
    }

    public function isAcademic(): bool
    {
        return !$this->isNonAcademic();
    }

    public function requiresTeacher(): bool
    {
        // Only lessons require teachers
        return $this->slot_type === self::TYPE_LESSON;
    }

    public function requiresSubject(): bool
    {
        // Only lessons require subjects
        return $this->slot_type === self::TYPE_LESSON;
    }

    public function hasTeacher(): bool
    {
        return !is_null($this->teacher_id);
    }

    public function hasSubject(): bool
    {
        return !is_null($this->subject_id);
    }

    public function hasRoom(): bool
    {
        return !is_null($this->room_id);
    }

    public function getActiveTeacher()
    {
        return $this->is_substitution && $this->teacher_id
            ? $this->teacher
            : ($this->originalTeacher ?? $this->teacher);
    }

    /**
     * Get display name for the slot
     */
    public function getDisplayName(): string
    {
        if ($this->isLesson() && $this->subject) {
            return $this->subject->name;
        }

        if ($this->period) {
            return $this->period->name;
        }

        return ucfirst($this->slot_type);
    }
}

