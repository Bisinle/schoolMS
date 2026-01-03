<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;
use App\Models\Traits\HasPriorityBand;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory, BelongsToSchool, HasPriorityBand;

    protected $fillable = [
        'school_id',
        'name',
        'category',
        'code',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'category' => 'string',
            'status' => 'string',
        ];
    }

    // Relationships
    public function teachers()
    {
        return $this->hasMany(Teacher::class);
    }

    public function grades()
    {
        return $this->belongsToMany(Grade::class, 'grade_subject')
            ->withPivot(['sessions_per_week', 'priority', 'must_be_daily', 'can_repeat_same_day'])
            ->withTimestamps();
    }

    public function exams()
    {
        return $this->hasMany(Exam::class);
    }

    public function timetableSlots()
    {
        return $this->hasMany(TimetableSlot::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeAcademic($query)
    {
        return $query->where('category', 'academic');
    }

    public function scopeIslamic($query)
    {
        return $query->where('category', 'islamic');
    }

    public function scopeArts($query)
    {
        return $query->where('category', 'arts');
    }

    // ============================================
    // TIMETABLE HELPER METHODS - ADDED IN PHASE 3
    // ============================================

    /**
     * Get active timetable slots for this subject
     */
    public function activeTimetableSlots(): HasMany
    {
        return $this->hasMany(TimetableSlot::class)
            ->whereHas('timetableTemplate', function ($query) {
                $query->where('is_active', true);
            });
    }

    /**
     * Check if subject requires a lab/special room
     */
    public function requiresLab(): bool
    {
        // Check if subject name suggests it needs a lab
        $labSubjects = [
            'chemistry', 'physics', 'biology', 'computer science',
            'science', 'laboratory', 'ict', 'computer'
        ];

        return in_array(strtolower($this->name), $labSubjects);
    }

    /**
     * Check if subject is a core subject
     */
    public function isCoreSubject(): bool
    {
        $coreSubjects = [
            'mathematics', 'english', 'kiswahili', 'science',
            'social studies', 'religious education'
        ];

        return in_array(strtolower($this->name), $coreSubjects);
    }

    // ============================================
    // PRIORITY BAND METHODS - ADDED FOR SMART SCHEDULING
    // ============================================

    /**
     * Get the priority for this subject in a specific grade
     *
     * @param int $gradeId The grade ID
     * @return string|null The priority (high, neutral, low) or null if not assigned
     */
    public function getPriorityForGrade(int $gradeId): ?string
    {
        $grade = $this->grades()->where('grades.id', $gradeId)->first();
        return $grade ? $grade->pivot->priority : null;
    }

    /**
     * Get the priority band for this subject in a specific grade
     * Maps subject priority to period priority band
     *
     * @param int $gradeId The grade ID
     * @return string|null The priority band (morning_high, neutral, afternoon_low) or null
     */
    public function getPriorityBandForGrade(int $gradeId): ?string
    {
        $priority = $this->getPriorityForGrade($gradeId);
        return $priority ? self::mapPriorityToBand($priority) : null;
    }

    /**
     * Check if this subject should be scheduled in a specific priority band for a grade
     *
     * @param int $gradeId The grade ID
     * @param string $periodBand The period priority band
     * @return bool True if the subject matches the period band
     */
    public function matchesPriorityBand(int $gradeId, string $periodBand): bool
    {
        $subjectPriority = $this->getPriorityForGrade($gradeId);
        return $subjectPriority ? self::priorityMatchesBand($subjectPriority, $periodBand) : false;
    }

    /**
     * Get recommended time of day for this subject in a grade
     *
     * @param int $gradeId The grade ID
     * @return string Human-readable recommendation
     */
    public function getRecommendedTimeForGrade(int $gradeId): string
    {
        $priority = $this->getPriorityForGrade($gradeId);

        return match ($priority) {
            'high' => 'Best scheduled in the morning when students are most alert',
            'neutral' => 'Can be scheduled at any time of day',
            'low' => 'Best scheduled in the afternoon',
            default => 'No scheduling preference set',
        };
    }
}