<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class UniversalFee extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'fee_type',
        'fee_name',
        'academic_year_id',
        'amount',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // Fee type constants
    public const TYPE_FOOD = 'food';
    public const TYPE_SPORTS = 'sports';
    public const TYPE_LIBRARY = 'library';
    public const TYPE_TECHNOLOGY = 'technology';
    public const TYPE_OTHER = 'other';

    public const TYPES = [
        self::TYPE_FOOD => 'Food',
        self::TYPE_SPORTS => 'Sports',
        self::TYPE_LIBRARY => 'Library',
        self::TYPE_TECHNOLOGY => 'Technology',
        self::TYPE_OTHER => 'Other',
    ];

    // Relationships
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

    public function scopeOfType($query, string $type)
    {
        return $query->where('fee_type', $type);
    }

    // Helper methods
    public function getDisplayNameAttribute(): string
    {
        if ($this->fee_type === self::TYPE_OTHER && $this->fee_name) {
            return $this->fee_name;
        }
        return self::TYPES[$this->fee_type] ?? $this->fee_type;
    }

    /**
     * Get the human-readable name for the fee type
     */
    public function getFeeTypeName(): string
    {
        if ($this->fee_type === self::TYPE_OTHER && $this->fee_name) {
            return $this->fee_name;
        }
        return self::TYPES[$this->fee_type] ?? ucfirst($this->fee_type);
    }

    /**
     * Get all universal fees for an academic year
     */
    public static function getForYear(int $academicYearId)
    {
        return self::where('academic_year_id', $academicYearId)
            ->active()
            ->get();
    }

    /**
     * Get specific fee type for an academic year
     */
    public static function getByType(string $type, int $academicYearId): ?self
    {
        return self::where('fee_type', $type)
            ->where('academic_year_id', $academicYearId)
            ->active()
            ->first();
    }
}

