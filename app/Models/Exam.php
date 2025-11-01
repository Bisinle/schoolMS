<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exam extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'exam_type',
        'term',
        'academic_year',
        'exam_date',
        'grade_id',
        'subject_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'exam_date' => 'date',
            'academic_year' => 'integer',
        ];
    }

    // Relationships
    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function results()
    {
        return $this->hasMany(ExamResult::class);
    }

    // Scopes
    public function scopeForTerm($query, $term, $academicYear)
    {
        return $query->where('term', $term)
            ->where('academic_year', $academicYear);
    }

    public function scopeForGrade($query, $gradeId)
    {
        return $query->where('grade_id', $gradeId);
    }

    // Helper methods
    public function getExamTypeNameAttribute()
    {
        return ucfirst(str_replace('_', ' ', $this->exam_type));
    }

    public function hasResults()
    {
        return $this->results()->exists();
    }
}