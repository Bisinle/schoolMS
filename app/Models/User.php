<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Enums\UserRole;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'is_active',
        'created_by',
        'last_login_at',
        'must_change_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
        ];
    }

    // Relationships
    public function guardian()
    {
        return $this->hasOne(Guardian::class);
    }
    
    public function teacher()
    {
        return $this->hasOne(Teacher::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function createdUsers()
    {
        return $this->hasMany(User::class, 'created_by');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'user_id');
    }

    public function causedActivities()
    {
        return $this->hasMany(ActivityLog::class, 'causer_id');
    }

    // 🆕 NEW: Documents relationship (for users without specific roles)
    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    // 🆕 NEW: Get all documents accessible by this user (including their children's if guardian)
    public function accessibleDocuments()
    {
        if ($this->isAdmin()) {
            return Document::query();
        }

        if ($this->isTeacher() && $this->teacher) {
            return Document::forEntity('App\Models\Teacher', $this->teacher->id);
        }

        if ($this->isGuardian() && $this->guardian) {
            $childIds = $this->guardian->students->pluck('id')->toArray();
            
            return Document::where(function ($query) use ($childIds) {
                $query->forEntity('App\Models\Guardian', $this->guardian->id)
                      ->orWhere(function ($q) use ($childIds) {
                          $q->where('documentable_type', 'App\Models\Student')
                            ->whereIn('documentable_id', $childIds);
                      });
            });
        }

        return Document::forEntity('App\Models\User', $this->id);
    }

    // Role checks
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }

    public function isGuardian(): bool
    {
        return $this->role === 'guardian';
    }

    public function isAccountant(): bool
    {
        return $this->role === 'accountant';
    }

    public function isReceptionist(): bool
    {
        return $this->role === 'receptionist';
    }

    public function isNurse(): bool
    {
        return $this->role === 'nurse';
    }

    public function isIT(): bool
    {
        return $this->role === 'it_staff';
    }

    public function isMaid(): bool
    {
        return $this->role === 'maid';
    }

    public function isCook(): bool
    {
        return $this->role === 'cook';
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    // Update last login
    public function updateLastLogin()
    {
        $this->update(['last_login_at' => now()]);
    }
}