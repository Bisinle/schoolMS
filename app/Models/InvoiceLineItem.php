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
                $lineItem->total_amount = array_sum($lineItem->fee_breakdown);
            } else {
                $lineItem->total_amount = 0;
            }
        });
    }
}

