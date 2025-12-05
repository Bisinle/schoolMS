# Fee Management - Critical Fixes & Code Examples

## 🔴 **CRITICAL ISSUE #1: Duplicate Invoice Prevention**

### Problem
Currently, nothing prevents creating multiple invoices for the same guardian and term.

### Solution
Add unique constraint to database:

```php
// Create new migration
php artisan make:migration add_unique_constraint_to_guardian_invoices_table

// In migration file:
public function up()
{
    Schema::table('guardian_invoices', function (Blueprint $table) {
        $table->unique(['guardian_id', 'academic_term_id'], 'unique_guardian_term_invoice');
    });
}

public function down()
{
    Schema::table('guardian_invoices', function (Blueprint $table) {
        $table->dropUnique('unique_guardian_term_invoice');
    });
}
```

### Update Controller
```php
// In InvoiceController::store()
try {
    $invoice = $this->invoiceService->generateInvoiceForGuardian(
        $guardian,
        $term,
        auth()->id(),
        $validated['payment_plan']
    );
} catch (\Illuminate\Database\QueryException $e) {
    if ($e->getCode() === '23000') { // Unique constraint violation
        return back()->withErrors([
            'error' => 'An invoice already exists for this guardian and term.'
        ]);
    }
    throw $e;
}
```

---

## 🔴 **CRITICAL ISSUE #2: Payment Overpayment**

### Problem
Can record payments that exceed invoice total.

### Solution
```php
// In PaymentController::store()
public function store(Request $request, GuardianInvoice $invoice)
{
    // Calculate what the total would be with this payment
    $currentPaid = $invoice->payments()->sum('amount');
    $newTotal = $currentPaid + $request->amount;
    
    $validated = $request->validate([
        'amount' => [
            'required',
            'numeric',
            'min:0.01',
            function ($attribute, $value, $fail) use ($invoice, $newTotal) {
                if ($newTotal > $invoice->total_amount) {
                    $fail('Total payments would exceed invoice amount. Maximum allowed: KSh ' . 
                        number_format($invoice->balance_due, 2));
                }
            }
        ],
        'payment_date' => 'required|date|before_or_equal:today',
        'payment_method' => 'required|in:cash,mpesa,bank_transfer,cheque',
        'reference_number' => 'nullable|string|max:255',
        'notes' => 'nullable|string|max:1000',
    ]);
    
    // Rest of the code...
}
```

---

## 🔴 **CRITICAL ISSUE #3: N+1 Query Problem**

### Problem
Invoice listing loads relationships inefficiently.

### Solution
```php
// In InvoiceController::index()
$invoices = GuardianInvoice::query()
    ->with([
        'guardian.user:id,name,email',
        'academicTerm.academicYear:id,year',
    ])
    ->withCount('lineItems')
    ->withCount('payments')
    ->withSum('payments', 'amount')
    ->when($request->filled('search'), function ($query) use ($request) {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
            $q->where('invoice_number', 'like', "%{$search}%")
              ->orWhereHas('guardian.user', function ($q) use ($search) {
                  $q->where('name', 'like', "%{$search}%");
              });
        });
    })
    ->when($request->filled('status'), function ($query) use ($request) {
        $query->where('status', $request->status);
    })
    ->when($request->filled('term_id'), function ($query) use ($request) {
        $query->where('academic_term_id', $request->term_id);
    })
    ->latest('invoice_date')
    ->paginate(20)
    ->withQueryString();
```

---

## 🔴 **CRITICAL ISSUE #4: Missing Database Indexes**

### Problem
Slow queries on large datasets.

### Solution
```php
// Create migration
php artisan make:migration add_indexes_to_fee_tables

public function up()
{
    Schema::table('guardian_invoices', function (Blueprint $table) {
        $table->index(['guardian_id', 'academic_term_id']);
        $table->index(['status', 'due_date']);
        $table->index('invoice_date');
        $table->index('created_at');
    });
    
    Schema::table('guardian_payments', function (Blueprint $table) {
        $table->index('guardian_invoice_id');
        $table->index('payment_date');
        $table->index('payment_method');
    });
    
    Schema::table('fee_amounts', function (Blueprint $table) {
        $table->index(['academic_year_id', 'is_active']);
        $table->index(['fee_category_id', 'academic_year_id']);
    });
    
    Schema::table('invoice_line_items', function (Blueprint $table) {
        $table->index('guardian_invoice_id');
        $table->index('student_id');
    });
}
```

---

## 🟡 **HIGH PRIORITY #1: Payment Plan Implementation**

### Problem
Payment plans exist but don't create installments.

### Solution
```php
// Create new model: app/Models/PaymentInstallment.php
class PaymentInstallment extends Model
{
    use BelongsToSchool;
    
    protected $fillable = [
        'school_id',
        'guardian_invoice_id',
        'installment_number',
        'due_date',
        'amount',
        'status', // pending, paid, overdue
    ];
    
    public function invoice()
    {
        return $this->belongsTo(GuardianInvoice::class, 'guardian_invoice_id');
    }
}

// In InvoiceGenerationService::generateInvoiceForGuardian()
// After creating invoice:
$this->createPaymentInstallments($invoice, $paymentPlan);

// Add new method:
protected function createPaymentInstallments(GuardianInvoice $invoice, string $paymentPlan): void
{
    $installments = [];
    
    switch ($paymentPlan) {
        case 'full':
            // Single payment
            $installments[] = [
                'installment_number' => 1,
                'due_date' => $invoice->due_date,
                'amount' => $invoice->total_amount,
            ];
            break;
            
        case 'half_half':
            // Two installments
            $halfAmount = $invoice->total_amount / 2;
            $installments[] = [
                'installment_number' => 1,
                'due_date' => $invoice->invoice_date->addDays(7),
                'amount' => $halfAmount,
            ];
            $installments[] = [
                'installment_number' => 2,
                'due_date' => $invoice->invoice_date->addDays(30),
                'amount' => $halfAmount,
            ];
            break;
            
        case 'monthly':
            // Three installments
            $monthlyAmount = $invoice->total_amount / 3;
            for ($i = 1; $i <= 3; $i++) {
                $installments[] = [
                    'installment_number' => $i,
                    'due_date' => $invoice->invoice_date->addDays($i * 30),
                    'amount' => $monthlyAmount,
                ];
            }
            break;
    }
    
    foreach ($installments as $installment) {
        PaymentInstallment::create([
            'school_id' => $invoice->school_id,
            'guardian_invoice_id' => $invoice->id,
            ...$installment,
            'status' => 'pending',
        ]);
    }
}
```

---

## 🟡 **HIGH PRIORITY #2: Config-based Settings**

### Problem
Hardcoded values throughout the code.

### Solution
```php
// Create config/fees.php
return [
    // Invoice settings
    'invoice_due_days' => env('INVOICE_DUE_DAYS', 14),
    'invoice_number_prefix' => env('INVOICE_NUMBER_PREFIX', 'INV'),
    'invoice_number_padding' => env('INVOICE_NUMBER_PADDING', 4),
    
    // Discount settings
    'discounts' => [
        'full' => env('FULL_PAYMENT_DISCOUNT', 5),
        'half_half' => env('HALF_PAYMENT_DISCOUNT', 2),
        'monthly' => env('MONTHLY_PAYMENT_DISCOUNT', 0),
    ],
    
    // Payment plan settings
    'payment_plans' => [
        'half_half' => [
            'installments' => 2,
            'days_between' => 23, // ~1 month apart
        ],
        'monthly' => [
            'installments' => 3,
            'days_between' => 30,
        ],
    ],
    
    // Reminder settings
    'reminders' => [
        'enabled' => env('FEE_REMINDERS_ENABLED', true),
        'days_before_due' => [3, 7, 14], // Send reminders 3, 7, and 14 days before due
        'days_after_due' => [1, 7, 14, 30], // Send reminders after overdue
    ],
];

// Usage in code:
'due_date' => now()->addDays(config('fees.invoice_due_days')),
'discount_percentage' => config("fees.discounts.{$paymentPlan}"),
```

---

## 🟡 **HIGH PRIORITY #3: Audit Trail**

### Problem
No tracking of who modified invoices/payments.

### Solution
```php
// In GuardianInvoice model, add boot method:
protected static function boot()
{
    parent::boot();
    
    static::updated(function ($invoice) {
        if ($invoice->isDirty(['total_amount', 'status', 'payment_plan'])) {
            ActivityLog::create([
                'school_id' => $invoice->school_id,
                'user_id' => auth()->id(),
                'action' => 'invoice_updated',
                'description' => "Updated invoice {$invoice->invoice_number}",
                'model_type' => GuardianInvoice::class,
                'model_id' => $invoice->id,
                'changes' => $invoice->getChanges(),
            ]);
        }
    });
    
    static::deleted(function ($invoice) {
        ActivityLog::create([
            'school_id' => $invoice->school_id,
            'user_id' => auth()->id(),
            'action' => 'invoice_deleted',
            'description' => "Deleted invoice {$invoice->invoice_number}",
            'model_type' => GuardianInvoice::class,
            'model_id' => $invoice->id,
        ]);
    });
}
```

---

## 📊 **Quick Win: Enhanced Dashboard Stats**

```php
// In FeeManagementController::index()
$stats = [
    'total_guardians' => Guardian::whereHas('students', function($q) {
        $q->where('status', 'active');
    })->count(),
    
    'total_invoices' => 0,
    'total_billed' => 0,
    'total_collected' => 0,
    'total_outstanding' => 0,
    'overdue_count' => 0,
    'overdue_amount' => 0,
    'collection_rate' => 0,
];

if ($currentTerm) {
    $invoices = GuardianInvoice::where('academic_term_id', $currentTerm->id);
    
    $stats['total_invoices'] = $invoices->count();
    $stats['total_billed'] = $invoices->sum('total_amount');
    $stats['total_collected'] = $invoices->sum('amount_paid');
    $stats['total_outstanding'] = $invoices->sum('balance_due');
    
    $overdueInvoices = $invoices->where('status', 'overdue');
    $stats['overdue_count'] = $overdueInvoices->count();
    $stats['overdue_amount'] = $overdueInvoices->sum('balance_due');
    
    $stats['collection_rate'] = $stats['total_billed'] > 0 
        ? round(($stats['total_collected'] / $stats['total_billed']) * 100, 1)
        : 0;
}
```

---

**Implementation Order**:
1. ✅ Add unique constraint (prevents data corruption)
2. ✅ Fix payment overpayment (prevents financial errors)
3. ✅ Add database indexes (improves performance)
4. ✅ Fix N+1 queries (improves performance)
5. ⏭️ Add config file (improves maintainability)
6. ⏭️ Implement payment plans (adds functionality)
7. ⏭️ Add audit trail (improves accountability)

