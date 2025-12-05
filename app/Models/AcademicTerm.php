<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class AcademicTerm extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'term_number',
        'name',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_active' => 'boolean',
            'term_number' => 'integer',
        ];
    }

    // Relationships
    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function guardianInvoices()
    {
        return $this->hasMany(GuardianInvoice::class);
    }

    public function guardianFeeAdjustments()
    {
        return $this->hasMany(GuardianFeeAdjustment::class);
    }

    public function guardianFeePreferences()
    {
        return $this->hasMany(GuardianFeePreference::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}

