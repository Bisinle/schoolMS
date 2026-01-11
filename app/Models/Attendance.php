<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class Attendance extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'student_id',
        'stream_id',
        'marked_by',
        'attendance_date',
        'status',
        'remarks',
    ];

    protected $casts = [
        'attendance_date' => 'date',
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function stream()
    {
        return $this->belongsTo(Stream::class);
    }

    public function grade()
    {
        return $this->hasOneThrough(Grade::class, Stream::class, 'id', 'id', 'stream_id', 'grade_id');
    }

    public function markedBy()
    {
        return $this->belongsTo(User::class, 'marked_by');
    }

    // Scopes
    public function scopeForDate($query, $date)
    {
        return $query->where('attendance_date', $date);
    }

    public function scopeForStream($query, $streamId)
    {
        return $query->where('stream_id', $streamId);
    }

    public function scopeForGrade($query, $gradeId)
    {
        return $query->whereHas('stream', function ($q) use ($gradeId) {
            $q->where('grade_id', $gradeId);
        });
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('attendance_date', [$startDate, $endDate]);
    }
}