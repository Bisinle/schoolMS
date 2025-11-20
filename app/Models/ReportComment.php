<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class ReportComment extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'student_id',
        'term',
        'academic_year',
        'teacher_comment',
        'teacher_comment_locked_at',
        'teacher_locked_by',
        'headteacher_comment',
        'headteacher_comment_locked_at',
        'headteacher_locked_by',
    ];

    protected function casts(): array
    {
        return [
            'teacher_comment_locked_at' => 'datetime',
            'headteacher_comment_locked_at' => 'datetime',
            'academic_year' => 'integer',
        ];
    }

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacherLocker()
    {
        return $this->belongsTo(User::class, 'teacher_locked_by');
    }

    public function headteacherLocker()
    {
        return $this->belongsTo(User::class, 'headteacher_locked_by');
    }

    // Helper methods
    public function isTeacherCommentLocked()
    {
        return !is_null($this->teacher_comment_locked_at);
    }

    public function isHeadteacherCommentLocked()
    {
        return !is_null($this->headteacher_comment_locked_at);
    }

    public function canEditTeacherComment(User $user)
    {
        if ($user->isAdmin()) {
            return true;
        }

        return !$this->isTeacherCommentLocked();
    }

    public function canEditHeadteacherComment(User $user)
    {
        if ($user->isAdmin()) {
            return true;
        }

        return !$this->isHeadteacherCommentLocked();
    }
}