<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class GuardianFeeAdjustment extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'guardian_id',
        'academic_term_id',
        'category_name',
        'adjustment_type',
        'custom_amount',
        'reason',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'custom_amount' => 'decimal:2',
        ];
    }

    // Relationships
    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function academicTerm()
    {
        return $this->belongsTo(AcademicTerm::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeForGuardian($query, $guardianId)
    {
        return $query->where('guardian_id', $guardianId);
    }

    public function scopeForTerm($query, $termId)
    {
        return $query->where('academic_term_id', $termId);
    }
}

