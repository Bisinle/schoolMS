<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class FeeCategory extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'name',
        'description',
        'is_universal',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_universal' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function feeAmounts()
    {
        return $this->hasMany(FeeAmount::class);
    }

    public function activeFeeAmounts()
    {
        return $this->hasMany(FeeAmount::class)->where('is_active', true);
    }

    // Get fee amounts for a specific academic year
    public function feeAmountsForYear($academicYearId)
    {
        return $this->feeAmounts()->where('academic_year_id', $academicYearId);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeUniversal($query)
    {
        return $query->where('is_universal', true);
    }

    public function scopeGradeSpecific($query)
    {
        return $query->where('is_universal', false);
    }

    // Helper methods
    public function isUniversal(): bool
    {
        return $this->is_universal;
    }

    public function isGradeSpecific(): bool
    {
        return !$this->is_universal;
    }
}

