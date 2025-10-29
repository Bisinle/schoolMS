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

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getGradeNameAttribute(): string
    {
        return $this->grade ? $this->grade->name : ($this->class_name ?? 'N/A');
    }
}