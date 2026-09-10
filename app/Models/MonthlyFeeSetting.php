<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyFeeSetting extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'guardian_id',
        'expected_fee',
        'updated_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'expected_fee' => 'decimal:2',
        ];
    }

    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
