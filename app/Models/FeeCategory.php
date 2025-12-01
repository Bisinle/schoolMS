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
        'grade_id',
        'category_name',
        'default_amount',
        'is_per_child',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'default_amount' => 'decimal:2',
            'is_per_child' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function grade()
    {
        return $this->belongsTo(Grade::class);
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
}

