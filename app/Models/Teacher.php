<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'employee_number',
        'phone_number',
        'address',
        'qualification',
        'subject_specialization',
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

    public function grades()
    {
        return $this->belongsToMany(Grade::class, 'grade_teacher')
                    ->withPivot('is_class_teacher')
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
}