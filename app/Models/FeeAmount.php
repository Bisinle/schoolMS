<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class FeeAmount extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'fee_category_id',
        'academic_year_id',
        'grade_range',
        'amount',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function feeCategory()
    {
        return $this->belongsTo(FeeCategory::class);
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

    public function scopeForYear($query, $academicYearId)
    {
        return $query->where('academic_year_id', $academicYearId);
    }

    public function scopeUniversal($query)
    {
        return $query->whereNull('grade_range');
    }

    public function scopeGradeSpecific($query)
    {
        return $query->whereNotNull('grade_range');
    }

    // Helper methods
    public function isUniversal(): bool
    {
        return $this->grade_range === null;
    }

    public function isGradeSpecific(): bool
    {
        return $this->grade_range !== null;
    }

    /**
     * Check if this fee amount applies to a given grade
     *
     * @param string $gradeName The grade name (e.g., "PP1", "PP2", "1", "2", "3", etc.)
     * @return bool
     */
    public function appliesToGrade(string $gradeName): bool
    {
        // Universal fees apply to all grades
        if ($this->isUniversal()) {
            return true;
        }

        // Parse the grade range and check if the grade falls within it
        return $this->gradeInRange($gradeName, $this->grade_range);
    }

    /**
     * Check if a grade falls within a grade range
     *
     * @param string $gradeName The grade name (e.g., "PP1", "Pre-Primary 1", "Grade 1", "1", "5")
     * @param string $gradeRange The range (e.g., "PP1-PP2", "1-3", "4-5")
     * @return bool
     */
    protected function gradeInRange(string $gradeName, string $gradeRange): bool
    {
        // Normalize grade name: remove "Grade " and "Pre-Primary " prefixes
        $normalizedGrade = $gradeName;

        // Handle "Pre-Primary 1" -> "PP1", "Pre-Primary 2" -> "PP2"
        if (str_contains($gradeName, 'Pre-Primary')) {
            $normalizedGrade = 'PP' . str_replace('Pre-Primary ', '', $gradeName);
        }

        // Handle "Grade 1" -> "1", "Grade 6" -> "6"
        if (str_starts_with($gradeName, 'Grade ')) {
            $normalizedGrade = str_replace('Grade ', '', $gradeName);
        }

        // Handle PP grades specially
        if (str_starts_with($normalizedGrade, 'PP')) {
            return str_contains($gradeRange, $normalizedGrade);
        }

        // Handle numeric grades
        if (str_contains($gradeRange, '-')) {
            [$start, $end] = explode('-', $gradeRange);
            $gradeNum = (int) $normalizedGrade;
            return $gradeNum >= (int) $start && $gradeNum <= (int) $end;
        }

        // Single grade match
        return $normalizedGrade === $gradeRange;
    }

    /**
     * Get all fee amounts that apply to a specific grade for a given academic year
     * 
     * @param string $gradeName
     * @param int $academicYearId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getApplicableFeesForGrade(string $gradeName, int $academicYearId)
    {
        return static::with('feeCategory')
            ->active()
            ->forYear($academicYearId)
            ->whereHas('feeCategory', function ($query) {
                $query->active();
            })
            ->get()
            ->filter(function ($feeAmount) use ($gradeName) {
                return $feeAmount->appliesToGrade($gradeName);
            });
    }
}

