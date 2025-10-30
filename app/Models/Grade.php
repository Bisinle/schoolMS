<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'level',
        'capacity',
        'description',
        'status',
    ];

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

    public function classTeacher()
    {
        return $this->belongsToMany(Teacher::class, 'grade_teacher')
                    ->wherePivot('is_class_teacher', true)
                    ->withTimestamps()
                    ->first();
    }

    public function getStudentCountAttribute()
    {
        return $this->students()->count();
    }

    public function getAvailableSpotsAttribute()
    {
        return $this->capacity - $this->student_count;
    }

    public function attendances()
{
    return $this->hasMany(Attendance::class);
}
}