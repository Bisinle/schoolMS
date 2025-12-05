<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class TransportRoute extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'route_name',
        'amount_two_way',
        'amount_one_way',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount_two_way' => 'decimal:2',
            'amount_one_way' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function guardianFeePreferences()
    {
        return $this->hasMany(GuardianFeePreference::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Helper methods
    public function getAmountForType(string $type): float
    {
        return $type === 'two_way' ? $this->amount_two_way : $this->amount_one_way;
    }
}

