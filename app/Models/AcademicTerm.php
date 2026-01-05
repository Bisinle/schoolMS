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

    public function timetableTemplates()
    {
        return $this->hasMany(TimetableTemplate::class);
    }

    public function teacherAvailability()
    {
        return $this->hasMany(TeacherAvailability::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Boot method to enforce single active term rule
    protected static function boot()
    {
        parent::boot();

        // When saving a term as active, deactivate all other terms for the school
        static::saving(function ($term) {
            if ($term->is_active && $term->isDirty('is_active')) {
                // Get the school_id through the academic year relationship
                $academicYear = $term->academicYear ?? AcademicYear::find($term->academic_year_id);

                if ($academicYear) {
                    // Deactivate all other terms for this school
                    static::whereHas('academicYear', function ($query) use ($academicYear) {
                        $query->where('school_id', $academicYear->school_id);
                    })
                    ->where('id', '!=', $term->id)
                    ->update(['is_active' => false]);
                }
            }
        });
    }
}

