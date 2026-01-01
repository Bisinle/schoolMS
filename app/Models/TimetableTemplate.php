<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class TimetableTemplate extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'grade_id',
        'academic_term_id',
        'name',
        'description',
        'is_active',
        'status',
        'active_days',
        'school_start_time',
        'school_end_time',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'active_days' => 'array',
            'school_start_time' => 'datetime:H:i',
            'school_end_time' => 'datetime:H:i',
        ];
    }

    // Relationships
    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function academicTerm()
    {
        return $this->belongsTo(AcademicTerm::class);
    }

    public function slots()
    {
        return $this->hasMany(TimetableSlot::class);
    }

    public function conflicts()
    {
        return $this->hasMany(TimetableConflict::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeForGrade($query, $gradeId)
    {
        return $query->where('grade_id', $gradeId);
    }

    public function scopeForTerm($query, $termId)
    {
        return $query->where('academic_term_id', $termId);
    }

    // Helper methods
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }

    public function hasConflicts(): bool
    {
        return $this->conflicts()->where('status', 'detected')->exists();
    }

    public function getActiveDaysArray(): array
    {
        return $this->active_days ?? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    }


}

