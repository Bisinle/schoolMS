<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'student_id',
        'marks',
    ];

    protected function casts(): array
    {
        return [
            'marks' => 'decimal:2',
        ];
    }

    // Relationships
    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    // Helper methods
    public function getRubricAttribute()
    {
        if ($this->marks >= 90) {
            return 'Exceeding Expectation';
        } elseif ($this->marks >= 70) {
            return 'Meeting Expectation';
        } elseif ($this->marks >= 50) {
            return 'Approaching Expectation';
        } else {
            return 'Below Expectation';
        }
    }

    public function getRubricColorAttribute()
    {
        if ($this->marks >= 90) {
            return 'green';
        } elseif ($this->marks >= 70) {
            return 'blue';
        } elseif ($this->marks >= 50) {
            return 'yellow';
        } else {
            return 'red';
        }
    }
}