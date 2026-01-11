<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use App\Models\LevelDayBlueprint;
use App\Models\TimetablePeriod;
use Illuminate\Support\Facades\DB;

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
    public function streams()
    {
        return $this->hasMany(Stream::class);
    }

    public function students()
    {
        return $this->hasManyThrough(Student::class, Stream::class);
    }

    /**
     * Get all teachers assigned to any stream in this grade
     * Note: This returns a collection, not a relationship query builder
     * Use getTeachersCount() for counting
     */
    public function teachers()
    {
        return Teacher::whereHas('streams', function ($query) {
            $query->where('grade_id', $this->id);
        })->where('school_id', $this->school_id)->get();
    }

    /**
     * Get count of teachers assigned to this grade
     */
    public function getTeachersCount()
    {
        return Teacher::whereHas('streams', function ($query) {
            $query->where('grade_id', $this->id);
        })->where('school_id', $this->school_id)->count();
    }

    public function subjects()
    {
        // Get subjects through streams
        return $this->hasManyThrough(Subject::class, Stream::class, 'grade_id', 'id', 'id', 'subject_id')
            ->join('stream_subject', 'subjects.id', '=', 'stream_subject.subject_id')
            ->where('stream_subject.stream_id', '=', DB::raw('streams.id'))
            ->distinct();
    }

    public function exams()
    {
        return $this->hasManyThrough(Exam::class, Stream::class, 'grade_id', 'stream_id');
    }

    public function attendances()
    {
        return $this->hasManyThrough(Attendance::class, Stream::class, 'grade_id', 'stream_id');
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
        // Get class teachers from all streams in this grade
        $streams = $this->streams;
        foreach ($streams as $stream) {
            $classTeacher = $stream->getClassTeacher();
            if ($classTeacher) {
                return $classTeacher;
            }
        }
        return null;
    }

    /**
     * Check if this grade can generate a timetable.
     * Returns validation results with errors, warnings, and success indicators.
     *
     * This method performs comprehensive prerequisite validation to ensure
     * all required data is in place before auto-generation can proceed.
     *
     * Validation follows strict requirements:
     * 1. Class teacher must be assigned
     * 2. Default room must be assigned
     * 3. Subjects with curriculum rules must be configured
     * 4. Active blueprint must exist for grade level
     * 5. Periods must be generated from blueprint
     *
     * Error messages follow design principles:
     * - Specific: Exact details of what's missing
     * - Actionable: Clear steps to fix
     * - Hierarchical: All errors shown at once with status indicators
     * - Linked: Navigation paths to fix issues
     */
    public function canGenerateTimetable(): array
    {
        $errors = [];
        $warnings = [];
        $successes = [];

        // ============================================
        // CRITICAL VALIDATIONS (Block Generation)
        // ============================================

        // Check 1: Class teacher exists
        $classTeacher = $this->getClassTeacher();
        if (!$classTeacher) {
            $errors[] = [
                'message' => 'No class teacher assigned',
                'action' => "Go to Grades → {$this->name} → Edit → Assign a class teacher",
                'type' => 'class_teacher'
            ];
        } else {
            $successes[] = "Class teacher assigned: {$classTeacher->user->name}";
        }

        // Check 2: Default room assigned (REQUIRED)
        if (!$this->default_room_id) {
            $errors[] = [
                'message' => 'No default classroom assigned',
                'action' => "Go to Grades → {$this->name} → Edit → Assign a default room",
                'type' => 'default_room'
            ];
        } else {
            $room = $this->defaultRoom;
            $successes[] = "Default classroom assigned: {$room->name}";
        }

        // Check 3: Has subjects assigned
        $subjectsCount = $this->subjects()->count();
        if ($subjectsCount === 0) {
            $errors[] = [
                'message' => 'No subjects assigned',
                'action' => "Go to Grades → {$this->name} → Subjects → Assign subjects",
                'type' => 'subjects'
            ];
        } else {
            $successes[] = "{$subjectsCount} subjects assigned";
        }

        // Check 4: Has active blueprint for level
        $blueprint = LevelDayBlueprint::where('school_id', $this->school_id)
            ->where('level', $this->level)
            ->where('is_active', true)
            ->first();

        if (!$blueprint) {
            $errors[] = [
                'message' => "No active timetable blueprint found for {$this->level} level",
                'action' => "Go to Blueprints → Create blueprint for {$this->level}",
                'type' => 'blueprint'
            ];
        } else {
            $successes[] = "Blueprint exists for {$this->level}: {$blueprint->name}";
        }

        // Check 5: Periods generated from blueprint
        $periodsCount = 0;
        if ($blueprint) {
            $periodsCount = TimetablePeriod::where('school_id', $this->school_id)
                ->where('grade_level', $this->level)
                ->whereNotNull('generated_from_blueprint_id')
                ->count();

            if ($periodsCount === 0) {
                $errors[] = [
                    'message' => "No periods generated from blueprint for {$this->level} level",
                    'action' => "Go to Blueprints → {$blueprint->name} → Generate Periods",
                    'type' => 'periods'
                ];
            } else {
                $successes[] = "Periods generated from blueprint ({$periodsCount} periods)";
            }
        }

        // Check 6: Subjects have curriculum rules configured
        if ($subjectsCount > 0) {
            $subjectsWithRules = $this->subjects()
                ->withPivot(['sessions_per_week', 'priority', 'must_be_daily', 'can_repeat_same_day'])
                ->get();

            // Check for missing sessions_per_week OR priority
            $subjectsWithMissingRules = $subjectsWithRules->filter(function ($subject) {
                $sessionsInvalid = empty($subject->pivot->sessions_per_week) || $subject->pivot->sessions_per_week <= 0;
                $priorityInvalid = empty($subject->pivot->priority);
                return $sessionsInvalid || $priorityInvalid;
            });

            if ($subjectsWithMissingRules->count() > 0) {
                $count = $subjectsWithMissingRules->count();
                $subjectNames = $subjectsWithMissingRules->pluck('name')->take(3)->implode(', ');

                $errors[] = [
                    'message' => "{$count} subjects missing curriculum rules (sessions per week, priority)",
                    'action' => "Go to Grades → {$this->name} → Subjects → Configure: {$subjectNames}",
                    'type' => 'curriculum_rules',
                    'details' => $subjectNames
                ];
            }
        }

        // ============================================
        // BLUEPRINT IS SINGLE SOURCE OF TRUTH
        // ============================================
        // We do NOT validate if total sessions_per_week exceed available slots.
        // The blueprint defines the available capacity, and the generation algorithm
        // will fill slots based on what's available. If there are more subjects than
        // slots, some subjects simply won't be scheduled - this is expected behavior.
        // The sessions_per_week in grade_subject is informational only.

        // ============================================
        // WARNINGS (Allow Generation with Caution)
        // ============================================

        // Warning 1: Check if teachers have subject specializations
        $teachers = $this->teachers()->get();
        if ($teachers->count() > 0) {
            $teachersWithoutSpecializations = $teachers->filter(function ($teacher) {
                return $teacher->subjects()->count() === 0;
            });

            if ($teachersWithoutSpecializations->count() > 0) {
                $teacherNames = $teachersWithoutSpecializations->map(function ($teacher) {
                    return $teacher->user->name ?? 'Unknown';
                })->take(2)->implode(', ');

                $teacherIds = $teachersWithoutSpecializations->pluck('id')->take(2)->toArray();

                $warnings[] = [
                    'message' => "No subject specializations set for teachers: {$teacherNames}",
                    'action' => "Go to Teachers → Edit → Add subject specializations for better teacher matching",
                    'type' => 'teacher_specializations',
                    'teacher_ids' => $teacherIds,
                ];
            }
        }

        return [
            'can_generate' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
            'successes' => $successes,
            'summary' => $this->getGenerationSummary($blueprint),
        ];
    }

    /**
     * Get a summary of what will be generated
     * Blueprint is the single source of truth for available slots
     */
    private function getGenerationSummary($blueprint): array
    {
        if (!$blueprint) {
            return [];
        }

        // Blueprint defines how many teachable periods per day
        $teachablePeriodsPerDay = $blueprint->periods()->where('is_teachable', true)->count();

        // Calculate available slots: periods per day × working days per week
        $workingDaysPerWeek = 5; // Default to 5 working days (Monday-Friday)
        $totalSlots = $teachablePeriodsPerDay * $workingDaysPerWeek;

        $totalRequiredSessions = $this->subjects()
            ->withPivot('sessions_per_week')
            ->get()
            ->sum(function ($subject) {
                return $subject->pivot->sessions_per_week ?? 0;
            });

        return [
            'total_slots' => $totalSlots,
            'lesson_slots' => $totalRequiredSessions,
            'empty_slots' => max(0, $totalSlots - $totalRequiredSessions),
            'subjects_count' => $this->subjects()->count(),
            'teachers_count' => $this->teachers()->count(),
            'blueprint_name' => $blueprint->name,
            'periods_per_day' => $teachablePeriodsPerDay,
            'working_days' => $workingDaysPerWeek,
        ];
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

    /**
     * Get all streams for this grade
     * Used when creating timetable templates
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAvailableStreams()
    {
        return $this->streams()
            ->where('status', 'active')
            ->orderBy('name')
            ->get();
    }

    /**
     * Get timetable templates for a specific stream
     *
     * @param int|null $streamId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getTemplatesForStream($streamId = null)
    {
        return $this->timetableTemplates()
            ->where('stream_id', $streamId)
            ->with(['stream', 'academicTerm'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get all unique streams that have timetable templates for this grade
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getStreamsWithTemplates()
    {
        $streamIds = $this->timetableTemplates()
            ->whereNotNull('stream_id')
            ->distinct()
            ->pluck('stream_id');

        return Stream::whereIn('id', $streamIds)->get();
    }
}