<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'admission_number',
        'first_name',
        'last_name',
        'gender',
        'date_of_birth',
        'guardian_id',
        'grade_id',
        'class_name', // Deprecated, use grade relationship
        'enrollment_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'enrollment_date' => 'date',
        ];
    }

    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    // 🆕 NEW RELATIONSHIPS FOR ACADEMIC MODULE
    public function examResults()
    {
        return $this->hasMany(ExamResult::class);
    }

    public function reportComments()
    {
        return $this->hasMany(ReportComment::class);
    }

    // EXISTING HELPERS
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getGradeNameAttribute(): string
    {
        return $this->grade ? $this->grade->name : ($this->class_name ?? 'N/A');
    }

    public function getAttendanceStats($startDate = null, $endDate = null)
    {
        $query = $this->attendances();

        if ($startDate && $endDate) {
            $query->whereBetween('attendance_date', [$startDate, $endDate]);
        }

        $allRecords = $query->get();

        $total = $allRecords->count();
        $present = $allRecords->where('status', 'present')->count();
        $absent = $allRecords->where('status', 'absent')->count();
        $late = $allRecords->where('status', 'late')->count();
        $excused = $allRecords->where('status', 'excused')->count();

        return [
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'excused' => $excused,
            'attendance_rate' => $total > 0 ? round(($present / $total) * 100, 1) : 0,
        ];
    }

    // 🆕 NEW HELPER FOR ACADEMIC MODULE
    public function getTermResults($term, $academicYear)
    {
        return $this->examResults()
            ->whereHas('exam', function ($query) use ($term, $academicYear) {
                $query->where('term', $term)
                    ->where('academic_year', $academicYear);
            })
            ->with(['exam.subject'])
            ->get();
    }
}