<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class GuardianPayment extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'guardian_invoice_id',
        'payment_date',
        'amount',
        'payment_method',
        'reference_number',
        'notes',
        'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'payment_date' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    // Relationships
    public function guardianInvoice()
    {
        return $this->belongsTo(GuardianInvoice::class);
    }

    // Alias for easier access
    public function invoice()
    {
        return $this->guardianInvoice();
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    // Automatically update invoice totals after payment is saved
    protected static function boot()
    {
        parent::boot();

        static::saved(function ($payment) {
            $payment->guardianInvoice->recalculateTotals();
        });

        static::deleted(function ($payment) {
            $payment->guardianInvoice->recalculateTotals();
        });
    }
}

