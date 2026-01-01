<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Grade extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'name',
        'code',
        'level',
        'default_room_id',
        'capacity',
        'description',
        'status',
    ];

    protected $casts = [
        'capacity' => 'integer',
    ];

    // Level options constant
    public const LEVELS = [
        'ECD' => 'ECD',
        'LOWER PRIMARY' => 'Lower Primary',
        'UPPER PRIMARY' => 'Upper Primary',
        'JUNIOR SECONDARY' => 'Junior Secondary',
    ];

    // Relationships
    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'grade_teacher')
            ->withPivot('is_class_teacher')
            ->withTimestamps();
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'grade_subject')
            ->withPivot('sessions_per_week')
            ->withTimestamps();
    }

    public function exams()
    {
        return $this->hasMany(Exam::class);
    }

    public function tuitionFees()
    {
        return $this->hasMany(TuitionFee::class);
    }

    public function timetableTemplates()
    {
        return $this->hasMany(TimetableTemplate::class);
    }

    public function defaultRoom()
    {
        return $this->belongsTo(Room::class, 'default_room_id');
    }

    /**
     * Get the active blueprint for this grade's level
     *
     * @return LevelDayBlueprint|null
     */
    public function activeBlueprint()
    {
        return LevelDayBlueprint::where('school_id', $this->school_id)
            ->where('level', $this->level)
            ->where('is_active', true)
            ->first();
    }

    // Helper methods
    public function getClassTeacher()
    {
        return $this->teachers()->wherePivot('is_class_teacher', true)->first();
    }

    public function hasCapacity()
    {
        if (!$this->capacity) {
            return true;
        }
        return $this->students()->where('status', 'active')->count() < $this->capacity;
    }

    public function getLevelDisplayNameAttribute()
    {
        return self::LEVELS[$this->level] ?? $this->level;
    }

    // ============================================
    // TIMETABLE RELATIONSHIPS - ADDED IN PHASE 3
    // ============================================

    /**
     * Get all timetable slots for this grade through templates
     */
    public function timetableSlots(): HasManyThrough
    {
        return $this->hasManyThrough(
            TimetableSlot::class,
            TimetableTemplate::class,
            'grade_id',           // Foreign key on templates table
            'timetable_template_id', // Foreign key on slots table
            'id',                 // Local key on grades table
            'id'                  // Local key on templates table
        );
    }

    /**
     * Get active timetable slots (from active template)
     */
    public function activeTimetableSlots(): HasMany
    {
        return $this->hasMany(TimetableSlot::class)
            ->whereHas('timetableTemplate', function ($query) {
                $query->where('is_active', true);
            });
    }

    /**
     * Get the active timetable template for this grade
     */
    public function activeTimetableTemplate()
    {
        return $this->timetableTemplates()
            ->where('is_active', true)
            ->where('status', 'published')
            ->first();
    }

    /**
     * Check if grade has an active timetable
     */
    public function hasActiveTimetable(): bool
    {
        return $this->activeTimetableSlots()->exists();
    }

    /**
     * Get timetable for a specific day
     */
    public function getTimetableForDay(string $day)
    {
        return $this->activeTimetableSlots()
            ->where('day_of_week', $day)
            ->with(['subject', 'teacher', 'room', 'period'])
            ->orderBy('timetable_period_id')
            ->get();
    }

    // ============================================
    // VALIDATION HELPERS FOR TIMETABLE MODULE
    // Added: Phase 1 - Module Separation
    // Purpose: Provide validation methods for Timetable module to enforce curriculum integrity
    // ============================================

    /**
     * Check if a subject is allowed for this grade
     *
     * @param int $subjectId
     * @return bool
     */
    public function isSubjectAllowed(int $subjectId): bool
    {
        return $this->subjects()->where('subjects.id', $subjectId)->exists();
    }

    /**
     * Check if a teacher is allowed for this grade
     *
     * @param int $teacherId
     * @return bool
     */
    public function isTeacherAllowed(int $teacherId): bool
    {
        return $this->teachers()->where('teachers.id', $teacherId)->exists();
    }

    /**
     * Get required sessions per week for a subject
     *
     * @param int $subjectId
     * @return int|null Returns null if subject not assigned to grade
     */
    public function getRequiredSessionsForSubject(int $subjectId): ?int
    {
        $subject = $this->subjects()->where('subjects.id', $subjectId)->first();
        return $subject ? $subject->pivot->sessions_per_week : null;
    }

    /**
     * Get actual scheduled sessions for a subject in a term
     *
     * @param int $subjectId
     * @param int $termId
     * @return int
     */
    public function getActualSessionsForSubject(int $subjectId, int $termId): int
    {
        return $this->timetableSlots()
            ->whereHas('timetableTemplate', function ($query) use ($termId) {
                $query->where('academic_term_id', $termId)
                      ->where('is_active', true);
            })
            ->where('subject_id', $subjectId)
            ->where('slot_type', TimetableSlot::TYPE_LESSON)
            ->count();
    }

    /**
     * Check if all subjects meet their session requirements for a term
     *
     * @param int $termId
     * @return bool
     */
    public function hasMetSessionRequirements(int $termId): bool
    {
        foreach ($this->subjects as $subject) {
            $required = $subject->pivot->sessions_per_week;
            $actual = $this->getActualSessionsForSubject($subject->id, $termId);

            if ($actual !== $required) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get session compliance report for a term
     * Shows which subjects are under/over/complete for their session quotas
     *
     * @param int $termId
     * @return array
     */
    public function getSessionComplianceReport(int $termId): array
    {
        $report = [];

        foreach ($this->subjects as $subject) {
            $required = $subject->pivot->sessions_per_week;
            $actual = $this->getActualSessionsForSubject($subject->id, $termId);

            $report[] = [
                'subject_id' => $subject->id,
                'subject_name' => $subject->name,
                'required_sessions' => $required,
                'actual_sessions' => $actual,
                'difference' => $actual - $required,
                'status' => $actual === $required ? 'complete' : ($actual < $required ? 'under' : 'over'),
            ];
        }

        return $report;
    }

    /**
     * Get all allowed subjects for this grade (for dropdowns)
     * Only returns active subjects
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllowedSubjects()
    {
        return $this->subjects()->where('status', 'active')->get();
    }

    /**
     * Get all allowed teachers for this grade (for dropdowns)
     * Only returns teachers with active user accounts
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllowedTeachers()
    {
        return $this->teachers()->whereHas('user', function ($query) {
            $query->where('is_active', true);
        })->get();
    }
}