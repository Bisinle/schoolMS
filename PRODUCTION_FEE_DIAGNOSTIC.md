# Production Fee Pickup Diagnostic Guide

## Issue
Invoices are not picking up fee amounts in production, even though fee categories and amounts exist.

## Possible Causes

### 1. **School ID Mismatch** (Most Likely)
The `BelongsToSchool` trait adds a global scope that filters all queries by `school_id`. If there's a mismatch:
- Fee amounts might belong to a different school
- The authenticated user's `school_id` might not match the fee amounts' `school_id`

### 2. **Academic Year Mismatch**
- Fee amounts must exist for the **active academic year**
- Check that `fee_amounts.academic_year_id` matches the active term's `academic_year_id`

### 3. **Active Status Issues**
- Both `fee_amounts.is_active` AND `fee_categories.is_active` must be `true`
- Check both tables

### 4. **Grade Name Mismatch**
- Grade names in `grades` table must match the format expected by `appliesToGrade()`
- Examples: "PP1", "PP2", "1", "2", "3", etc.
- NOT: "Pre-Primary 1", "Grade 1", etc. (these are normalized)

### 5. **Grade Range Format Issues**
- Universal fees: `grade_range` should be `NULL`
- Grade-specific fees: `grade_range` should be like "PP1-PP2", "1-3", "4-6"

## Diagnostic Steps

### Step 1: Check School ID Consistency

```bash
php artisan tinker
```

```php
// Get current user's school ID
$user = auth()->user();
echo "User School ID: {$user->school_id}\n";

// Check fee categories
$categories = \App\Models\FeeCategory::withoutGlobalScope(\App\Models\Scopes\SchoolScope::class)->get();
echo "Fee Categories:\n";
foreach ($categories as $cat) {
    echo "  - {$cat->name} (School ID: {$cat->school_id})\n";
}

// Check fee amounts
$amounts = \App\Models\FeeAmount::withoutGlobalScope(\App\Models\Scopes\SchoolScope::class)->get();
echo "Fee Amounts:\n";
foreach ($amounts as $amt) {
    echo "  - Category ID: {$amt->fee_category_id}, School ID: {$amt->school_id}\n";
}
```

**Expected**: All should have the same `school_id` as the logged-in user.

### Step 2: Check Active Academic Year

```php
$activeTerm = \App\Models\AcademicTerm::where('is_active', true)->with('academicYear')->first();
echo "Active Term: {$activeTerm->academicYear->year} - Term {$activeTerm->term_number}\n";
echo "Academic Year ID: {$activeTerm->academic_year_id}\n";

// Check fee amounts for this year
$feeAmounts = \App\Models\FeeAmount::where('academic_year_id', $activeTerm->academic_year_id)->get();
echo "Fee amounts for active year: {$feeAmounts->count()}\n";
```

**Expected**: Should show fee amounts for the active academic year.

### Step 3: Check Active Status

```php
$feeAmounts = \App\Models\FeeAmount::with('feeCategory')
    ->where('academic_year_id', $activeTerm->academic_year_id)
    ->get();

foreach ($feeAmounts as $fee) {
    echo "{$fee->feeCategory->name}:\n";
    echo "  - Fee Amount Active: " . ($fee->is_active ? 'YES' : 'NO') . "\n";
    echo "  - Fee Category Active: " . ($fee->feeCategory->is_active ? 'YES' : 'NO') . "\n";
}
```

**Expected**: Both should be `YES`.

### Step 4: Test Fee Retrieval

```php
$grade = \App\Models\Grade::first();
echo "Testing grade: {$grade->name}\n";

$fees = \App\Models\FeeAmount::getApplicableFeesForGrade($grade->name, $activeTerm->academic_year_id);
echo "Fees found: {$fees->count()}\n";

if ($fees->count() > 0) {
    foreach ($fees as $fee) {
        echo "  - {$fee->feeCategory->name}: KSh " . number_format($fee->amount, 2) . "\n";
    }
} else {
    echo "❌ NO FEES FOUND!\n";
    
    // Debug: Check without active scope
    $allFees = \App\Models\FeeAmount::with('feeCategory')
        ->where('academic_year_id', $activeTerm->academic_year_id)
        ->get();
    echo "Total fees (without active filter): {$allFees->count()}\n";
    
    // Debug: Check with active scope
    $activeFees = \App\Models\FeeAmount::with('feeCategory')
        ->active()
        ->where('academic_year_id', $activeTerm->academic_year_id)
        ->get();
    echo "Active fees: {$activeFees->count()}\n";
    
    // Debug: Check with category active
    $categoryActiveFees = \App\Models\FeeAmount::with('feeCategory')
        ->active()
        ->where('academic_year_id', $activeTerm->academic_year_id)
        ->whereHas('feeCategory', function($q) { $q->active(); })
        ->get();
    echo "Fees with active categories: {$categoryActiveFees->count()}\n";
}
```

### Step 5: Check Logs

After generating an invoice, check the logs:

```bash
tail -f storage/logs/laravel.log | grep "Invoice Generation"
```

Look for the debug log entry that shows:
- Student name
- Grade
- Academic year ID
- Number of fees found
- Fee names

## Quick Fixes

### Fix 1: School ID Mismatch

```php
// Update all fee categories to current school
$schoolId = auth()->user()->school_id;
\App\Models\FeeCategory::withoutGlobalScope(\App\Models\Scopes\SchoolScope::class)
    ->update(['school_id' => $schoolId]);

// Update all fee amounts to current school
\App\Models\FeeAmount::withoutGlobalScope(\App\Models\Scopes\SchoolScope::class)
    ->update(['school_id' => $schoolId]);
```

### Fix 2: Activate All Fees

```php
\App\Models\FeeCategory::update(['is_active' => true]);
\App\Models\FeeAmount::update(['is_active' => true]);
```

### Fix 3: Check Grade Names

```php
$grades = \App\Models\Grade::all();
foreach ($grades as $grade) {
    echo "{$grade->name}\n";
}
```

If you see "Pre-Primary 1" or "Grade 1", update them:

```php
\App\Models\Grade::where('name', 'Pre-Primary 1')->update(['name' => 'PP1']);
\App\Models\Grade::where('name', 'Pre-Primary 2')->update(['name' => 'PP2']);
\App\Models\Grade::where('name', 'Grade 1')->update(['name' => '1']);
// etc.
```

## Contact

If none of these fixes work, provide the output of Step 1-4 for further diagnosis.

