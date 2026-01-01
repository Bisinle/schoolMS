<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory, BelongsToSchool;

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
    public function grades()
    {
        return $this->belongsToMany(Grade::class, 'grade_subject')
            ->withPivot('sessions_per_week')
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
}