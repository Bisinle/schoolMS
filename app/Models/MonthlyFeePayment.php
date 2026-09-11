<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyFeePayment extends Model
{
    use BelongsToSchool, HasFactory;

    protected $fillable = [
        'school_id',
        'guardian_id',
        'amount',
        'applied_to_arrears',
        'applied_to_current_month',
        'applied_to_credit',
        'received_at',
        'recorded_by',
        'corrects_entry_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'applied_to_arrears' => 'decimal:2',
            'applied_to_current_month' => 'decimal:2',
            'applied_to_credit' => 'decimal:2',
            'received_at' => 'date',
        ];
    }

    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function correctsEntry()
    {
        return $this->belongsTo(MonthlyFeeEntry::class, 'corrects_entry_id');
    }
}
