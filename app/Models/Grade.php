<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class Grade extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'name',
        'code',
        'level',
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
            ->withTimestamps();
    }

    public function exams()
    {
        return $this->hasMany(Exam::class);
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
}