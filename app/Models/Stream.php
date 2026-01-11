<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class Stream extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'grade_id',
        'name',
        'code',
        'capacity',
        'room_id',
        'description',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
        'capacity' => 'integer',
    ];

    // Relationships
    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'stream_teacher')
            ->withPivot('is_class_teacher')
            ->withTimestamps();
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'stream_subject')
            ->withPivot(['sessions_per_week', 'priority', 'must_be_daily', 'can_repeat_same_day'])
            ->withTimestamps();
    }

    public function exams()
    {
        return $this->hasMany(Exam::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    // Helper methods
    public function getClassTeacher()
    {
        return $this->teachers()->wherePivot('is_class_teacher', true)->first();
    }

    public function getStudentsCountAttribute()
    {
        return $this->students()->count();
    }

    public function canBeDeleted()
    {
        return $this->students()->count() === 0;
    }

    public function hasCapacity()
    {
        if (!$this->capacity) {
            return true;
        }
        return $this->students()->where('status', 'active')->count() < $this->capacity;
    }

    public function getDisplayNameAttribute()
    {
        return $this->grade ? "{$this->grade->name} - {$this->name}" : $this->name;
    }
}
