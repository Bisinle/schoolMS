<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class School extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'admin_name',
        'admin_email',
        'admin_phone',
        'is_active',
        'status',
        'school_type',
        'trial_ends_at',
        'current_student_count',
        'address',
        'logo_path',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'trial_ends_at' => 'datetime',
        'current_student_count' => 'integer',
    ];

    /**
     * Relationships
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function teachers()
    {
        return $this->hasMany(Teacher::class);
    }

    public function guardians()
    {
        return $this->hasMany(Guardian::class);
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }

    public function exams()
    {
        return $this->hasMany(Exam::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    /**
     * Helper Methods
     */
    public function isActive(): bool
    {
        return $this->is_active && $this->status !== 'suspended';
    }

    public function isOnTrial(): bool
    {
        return $this->status === 'trial' && $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function trialDaysRemaining(): ?int
    {
        if (!$this->isOnTrial()) {
            return null;
        }

        return now()->diffInDays($this->trial_ends_at, false);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)->where('status', '!=', 'suspended');
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false)->orWhere('status', 'suspended');
    }

    public function scopeOnTrial($query)
    {
        return $query->where('status', 'trial')
            ->whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '>', now());
    }
}

