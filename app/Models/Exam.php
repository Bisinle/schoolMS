<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\BelongsToSchool;

class Exam extends Model
{
    use HasFactory, SoftDeletes, BelongsToSchool;

    protected $fillable = [
        'school_id',
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

    // NEW: Scope for marking status
    public function scopeMarked($query)
    {
        return $query->whereHas('grade', function ($q) {
            $q->whereHas('students');
        })->whereHas('results', function ($q) {
            $q->selectRaw('exam_id, COUNT(*) as results_count')
              ->groupBy('exam_id')
              ->havingRaw('results_count >= (SELECT COUNT(*) FROM students WHERE students.grade_id = exams.grade_id AND students.status = "active")');
        });
    }

    public function scopeUnmarked($query)
    {
        return $query->whereDoesntHave('results')
            ->orWhereHas('grade', function ($q) {
                $q->whereHas('students', function ($sq) {
                    $sq->where('status', 'active');
                });
            })->whereHas('results', function ($q) {
                $q->selectRaw('exam_id, COUNT(*) as results_count')
                  ->groupBy('exam_id')
                  ->havingRaw('results_count < (SELECT COUNT(*) FROM students WHERE students.grade_id = exams.grade_id AND students.status = "active")');
            });
    }

    public function scopePartiallyMarked($query)
    {
        return $query->whereHas('results')
            ->whereHas('grade', function ($q) {
                $q->whereHas('students', function ($sq) {
                    $sq->where('status', 'active');
                });
            })->whereHas('results', function ($q) {
                $q->selectRaw('exam_id, COUNT(*) as results_count')
                  ->groupBy('exam_id')
                  ->havingRaw('results_count > 0')
                  ->havingRaw('results_count < (SELECT COUNT(*) FROM students WHERE students.grade_id = exams.grade_id AND students.status = "active")');
            });
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

    // NEW: Get completion statistics
    public function getCompletionStats()
    {
        $totalStudents = $this->grade->students()->where('status', 'active')->count();
        $markedStudents = $this->results()->count();
        $completionRate = $totalStudents > 0 ? round(($markedStudents / $totalStudents) * 100, 1) : 0;

        return [
            'total_students' => $totalStudents,
            'marked_students' => $markedStudents,
            'completion_rate' => $completionRate,
            'is_complete' => $completionRate === 100.0,
            'is_partial' => $completionRate > 0 && $completionRate < 100,
            'is_not_started' => $completionRate === 0,
        ];
    }

    // NEW: Check if fully marked
    public function isFullyMarked()
    {
        $stats = $this->getCompletionStats();
        return $stats['is_complete'];
    }

    // NEW: Check if partially marked
    public function isPartiallyMarked()
    {
        $stats = $this->getCompletionStats();
        return $stats['is_partial'];
    }

    // NEW: Check if not started
    public function isNotStarted()
    {
        $stats = $this->getCompletionStats();
        return $stats['is_not_started'];
    }
}