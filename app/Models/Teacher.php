<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Teacher extends Model
{
    use BelongsToSchool, HasFactory, SoftDeletes;

    protected $fillable = [
        'school_id',
        'user_id',
        'employee_number',
        'phone_number',
        'address',
        'qualification',
        'subject_id',
        'date_of_joining',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date_of_joining' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function grades()
    {
        return $this->belongsToMany(Grade::class, 'grade_teacher')
            ->withPivot('is_class_teacher')
            ->withTimestamps();
    }

    /**
     * Get the subjects this teacher specializes in (many-to-many).
     */
    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'teacher_subject')
            ->withTimestamps();
    }

    public function assignedGrades()
    {
        return $this->grades()->wherePivot('is_class_teacher', false);
    }

    public function classTeacherGrades()
    {
        return $this->grades()->wherePivot('is_class_teacher', true);
    }

    public function timetableSlots()
    {
        return $this->hasMany(TimetableSlot::class);
    }

    public function availability()
    {
        return $this->hasMany(TeacherAvailability::class);
    }

    // 🆕 NEW: Documents relationship
    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    // 🆕 NEW: Helper to get documents by category
    public function getDocumentsByCategory($categorySlug)
    {
        return $this->documents()
            ->whereHas('category', function ($query) use ($categorySlug) {
                $query->where('slug', $categorySlug);
            })
            ->get();
    }

    // 🆕 NEW: Check if teacher has uploaded required documents
    public function hasRequiredDocuments()
    {
        $requiredCategories = DocumentCategory::active()
            ->forEntity('Teacher')
            ->required()
            ->count();

        $uploadedVerifiedDocs = $this->documents()
            ->verified()
            ->whereHas('category', function ($query) {
                $query->where('is_required', true);
            })
            ->distinct('document_category_id')
            ->count('document_category_id');

        return $uploadedVerifiedDocs >= $requiredCategories;
    }

    // ============================================
    // TIMETABLE HELPER METHODS - ADDED IN PHASE 3
    // ============================================

    /**
     * Get active timetable slots for this teacher
     */
    public function activeTimetableSlots(): HasMany
    {
        return $this->hasMany(TimetableSlot::class)
            ->whereHas('timetableTemplate', function ($query) {
                $query->where('is_active', true);
            });
    }

    /**
     * Check if teacher is available on a specific day and time
     */
    public function isAvailableAt(string $day, string $startTime, string $endTime): bool
    {
        // Check for unavailability records
        $unavailable = $this->availability()
            ->where('day_of_week', $day)
            ->where('availability_type', 'unavailable')
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where(function ($q) use ($startTime) {
                    $q->where('start_time', '<=', $startTime)
                        ->where('end_time', '>=', $startTime);
                })->orWhere(function ($q) use ($endTime) {
                    $q->where('start_time', '<=', $endTime)
                        ->where('end_time', '>=', $endTime);
                });
            })
            ->exists();

        return ! $unavailable;
    }

    /**
     * Check if teacher has timetable conflict at given day/period
     */
    public function hasConflictAt(string $day, int $periodId, int $timetableTemplateId): bool
    {
        return $this->timetableSlots()
            ->where('day_of_week', $day)
            ->where('timetable_period_id', $periodId)
            ->where('timetable_template_id', $timetableTemplateId)
            ->exists();
    }

    /**
     * Get teacher's timetable for a specific day
     */
    public function getTimetableForDay(string $day)
    {
        return $this->activeTimetableSlots()
            ->where('day_of_week', $day)
            ->with(['subject', 'room', 'period'])
            ->orderBy('timetable_period_id')
            ->get();
    }

    /**
     * Get teacher's full week timetable
     */
    public function getWeeklyTimetable()
    {
        return $this->activeTimetableSlots()
            ->with(['subject', 'room', 'period'])
            ->get()
            ->groupBy('day_of_week');
    }
}
