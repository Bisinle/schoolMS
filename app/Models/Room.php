<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\BelongsToSchool;

class Room extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'name',
        'code',
        'room_type',
        'capacity',
        'building',
        'floor',
        'facilities',
        'status',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'is_active' => 'boolean',
            'facilities' => 'array',
        ];
    }

    // Relationships
    public function slots()
    {
        return $this->hasMany(TimetableSlot::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopeClassrooms($query)
    {
        return $query->where('room_type', 'classroom');
    }

    public function scopeLaboratories($query)
    {
        return $query->where('room_type', 'laboratory');
    }

    // Helper methods
    public function isAvailable(): bool
    {
        return $this->status === 'available' && $this->is_active;
    }

    public function isClassroom(): bool
    {
        return $this->room_type === 'classroom';
    }

    public function hasCapacity(int $studentCount): bool
    {
        if (!$this->capacity) {
            return true; // No limit set
        }

        return $studentCount <= $this->capacity;
    }

    public function getDisplayName(): string
    {
        return $this->code ? "{$this->code} - {$this->name}" : $this->name;
    }
}

