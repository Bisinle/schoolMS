<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToSchool;

class GuardianInvoice extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'guardian_id',
        'academic_term_id',
        'invoice_number',
        'invoice_date',
        'due_date',
        'subtotal_amount',
        'discount_percentage',
        'discount_amount',
        'total_amount',
        'amount_paid',
        'balance_due',
        'payment_plan',
        'status',
        'notes',
        'generated_by',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'date',
            'due_date' => 'date',
            'subtotal_amount' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'balance_due' => 'decimal:2',
        ];
    }

    // Relationships
    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function academicTerm()
    {
        return $this->belongsTo(AcademicTerm::class);
    }

    public function lineItems()
    {
        return $this->hasMany(InvoiceLineItem::class);
    }

    public function payments()
    {
        return $this->hasMany(GuardianPayment::class);
    }

    public function generatedBy()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePartial($query)
    {
        return $query->where('status', 'partial');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue');
    }

    public function scopeForGuardian($query, $guardianId)
    {
        return $query->where('guardian_id', $guardianId);
    }

    public function scopeForTerm($query, $termId)
    {
        return $query->where('academic_term_id', $termId);
    }

    // Helper methods
    public function updateStatus()
    {
        if ($this->balance_due == 0) {
            $this->status = 'paid';
        } elseif ($this->amount_paid > 0 && $this->balance_due > 0) {
            $this->status = 'partial';
        } elseif ($this->due_date < now() && $this->balance_due > 0) {
            $this->status = 'overdue';
        } else {
            $this->status = 'pending';
        }
        
        $this->save();
    }

    public function recalculateTotals()
    {
        // Recalculate subtotal from line items
        $this->subtotal_amount = $this->lineItems()->sum('total_amount');
        
        // Calculate discount
        if ($this->payment_plan === 'full') {
            $this->discount_percentage = 5;
            $this->discount_amount = $this->subtotal_amount * 0.05;
        } else {
            $this->discount_percentage = 0;
            $this->discount_amount = 0;
        }
        
        // Calculate total
        $this->total_amount = $this->subtotal_amount - $this->discount_amount;
        
        // Recalculate amount paid from payments
        $this->amount_paid = $this->payments()->sum('amount');
        
        // Calculate balance
        $this->balance_due = $this->total_amount - $this->amount_paid;
        
        $this->save();
        $this->updateStatus();
    }
}

