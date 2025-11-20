<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class Subject extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'name',
        'category',
        'code',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'category' => 'string',
            'status' => 'string',
        ];
    }

    // Relationships
    public function grades()
    {
        return $this->belongsToMany(Grade::class, 'grade_subject')
            ->withTimestamps();
    }

    public function exams()
    {
        return $this->hasMany(Exam::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeAcademic($query)
    {
        return $query->where('category', 'academic');
    }

    public function scopeIslamic($query)
    {
        return $query->where('category', 'islamic');
    }
}