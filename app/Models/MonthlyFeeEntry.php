<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyFeeEntry extends Model
{
    use BelongsToSchool, HasFactory;

    protected $attributes = [
        'credit_applied' => 0,
    ];

    protected $fillable = [
        'school_id',
        'guardian_id',
        'year',
        'month',
        'expected_amount',
        'amount_collected',
        'credit_applied',
        'paid_date',
        'recorded_by',
        'notes',
    ];

    protected $appends = ['status'];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'expected_amount' => 'decimal:2',
            'amount_collected' => 'decimal:2',
            'credit_applied' => 'decimal:2',
            'paid_date' => 'date',
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

    /**
     * Computed, never stored — recomputed from expected_amount/amount_collected
     * on every read so it can never drift out of sync with the two source
     * columns. needs_fee takes priority: an unset expected amount is a data
     * gap to fix, not "unpaid".
     */
    public function getStatusAttribute(): string
    {
        if ((float) $this->expected_amount <= 0) {
            return 'needs_fee';
        }

        if ($this->amount_collected === null || (float) $this->amount_collected <= 0) {
            return 'unpaid';
        }

        if ((float) $this->amount_collected < (float) $this->expected_amount) {
            return 'partial';
        }

        return 'paid';
    }
}
