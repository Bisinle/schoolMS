<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class TuitionFee extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'grade_id',
        'academic_year_id',
        'amount_full_day',
        'amount_half_day',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount_full_day' => 'decimal:2',
            'amount_half_day' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForGrade($query, $gradeId)
    {
        return $query->where('grade_id', $gradeId);
    }

    public function scopeForYear($query, $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    // Helper methods
    public function getAmountForType(string $type): float
    {
        return $type === 'full_day' ? $this->amount_full_day : $this->amount_half_day;
    }

    /**
     * Get tuition fee for a specific grade and academic year
     */
    public static function getForGradeAndYear(int $gradeId, int $academicYearId): ?self
    {
        return self::where('grade_id', $gradeId)
            ->where('academic_year_id', $academicYearId)
            ->active()
            ->first();
    }
}

