<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyFeeSetting extends Model
{
    use BelongsToSchool, HasFactory;

    protected $attributes = [
        'credit_balance' => 0,
    ];

    protected $fillable = [
        'school_id',
        'guardian_id',
        'expected_fee',
        'credit_balance',
        'updated_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'expected_fee' => 'decimal:2',
            'credit_balance' => 'decimal:2',
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
