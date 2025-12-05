<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class InvoiceLineItem extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'guardian_invoice_id',
        'student_id',
        'student_name',
        'grade_name',
        'fee_breakdown', // JSON: {"Tuition": 35000, "Transport": 10000, ...}
        'total_amount',
    ];

    protected function casts(): array
    {
        return [
            'fee_breakdown' => 'array', // Automatically cast JSON to array
            'total_amount' => 'decimal:2',
        ];
    }

    // Relationships
    public function guardianInvoice()
    {
        return $this->belongsTo(GuardianInvoice::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    // Automatically calculate total_amount before saving
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($lineItem) {
            // Calculate total from fee_breakdown JSON
            if ($lineItem->fee_breakdown && is_array($lineItem->fee_breakdown)) {
                $total = 0;

                foreach ($lineItem->fee_breakdown as $fee) {
                    // Support both old format (number) and new format (array with 'amount' key)
                    if (is_array($fee) && isset($fee['amount'])) {
                        $total += $fee['amount'];
                    } elseif (is_numeric($fee)) {
                        // Backward compatibility with old format
                        $total += $fee;
                    }
                }

                $lineItem->total_amount = $total;
            } else {
                $lineItem->total_amount = 0;
            }
        });
    }
}

