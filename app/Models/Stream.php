<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class Stream extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'name',
        'code',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    // Relationships
    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    // Helper methods
    public function getGradesCountAttribute()
    {
        return $this->grades()->count();
    }

    public function canBeDeleted()
    {
        return $this->grades()->count() === 0;
    }

    public function getGradesListAttribute()
    {
        return $this->grades()->pluck('name')->toArray();
    }
}
