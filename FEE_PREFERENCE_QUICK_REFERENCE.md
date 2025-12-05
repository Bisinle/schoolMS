# Fee Preference System - Quick Reference Guide

## 🚀 Quick Start

### Run Migrations
```bash
cd schoolMS
php artisan migrate
```

### Seed Sample Data
```bash
php artisan db:seed --class=FeePreferenceSystemSeeder
```

---

## 📚 Model Quick Reference

### TransportRoute
```php
use App\Models\TransportRoute;

// Get all active routes
$routes = TransportRoute::active()->get();

// Get amount for transport type
$route = TransportRoute::find(1);
$twoWayAmount = $route->getAmountForType('two_way');
$oneWayAmount = $route->getAmountForType('one_way');
```

### TuitionFee
```php
use App\Models\TuitionFee;

// Get tuition fee for a grade and year
$fee = TuitionFee::getForGradeAndYear($gradeId, $academicYearId);

// Get amount for tuition type
$fullDayAmount = $fee->getAmountForType('full_day');
$halfDayAmount = $fee->getAmountForType('half_day');

// Get all tuition fees for a year
$fees = TuitionFee::forYear($academicYearId)->with('grade')->get();
```

### UniversalFee
```php
use App\Models\UniversalFee;

// Get all universal fees for a year
$fees = UniversalFee::getForYear($academicYearId);

// Get specific fee type
$foodFee = UniversalFee::getByType('food', $academicYearId);
$sportsFee = UniversalFee::getByType('sports', $academicYearId);

// Fee types
UniversalFee::TYPE_FOOD      // 'food'
UniversalFee::TYPE_SPORTS    // 'sports'
UniversalFee::TYPE_LIBRARY   // 'library'
UniversalFee::TYPE_TECHNOLOGY // 'technology'
UniversalFee::TYPE_OTHER     // 'other'
```

### GuardianFeePreference
```php
use App\Models\GuardianFeePreference;

// Get or create preference (with defaults)
$pref = GuardianFeePreference::getOrCreateForStudentTerm($studentId, $termId);

// Get existing preference (or null)
$pref = GuardianFeePreference::getForStudentTerm($studentId, $termId);

// Check if uses transport
if ($pref->usesTransport()) {
    $transportAmount = $pref->getTransportAmount();
}

// Access preference values
$pref->tuition_type;        // 'full_day' or 'half_day'
$pref->transport_route_id;  // ID or null
$pref->transport_type;      // 'one_way', 'two_way', or null
$pref->include_food;        // true or false
$pref->include_sports;      // true or false

// Constants
GuardianFeePreference::TUITION_FULL_DAY    // 'full_day'
GuardianFeePreference::TUITION_HALF_DAY    // 'half_day'
GuardianFeePreference::TRANSPORT_ONE_WAY   // 'one_way'
GuardianFeePreference::TRANSPORT_TWO_WAY   // 'two_way'
```

---

## 💡 Common Use Cases

### 1. Calculate Total Fees for a Student
```php
function calculateStudentFees($studentId, $termId)
{
    $student = Student::with('grade')->findOrFail($studentId);
    $term = AcademicTerm::with('academicYear')->findOrFail($termId);
    $year = $term->academicYear;
    
    // Get or create preference
    $pref = GuardianFeePreference::getOrCreateForStudentTerm($studentId, $termId);
    
    $fees = [];
    
    // 1. Tuition
    $tuition = TuitionFee::getForGradeAndYear($student->grade_id, $year->id);
    if ($tuition) {
        $fees['Tuition'] = $tuition->getAmountForType($pref->tuition_type);
    }
    
    // 2. Transport
    if ($pref->usesTransport()) {
        $fees['Transport'] = $pref->getTransportAmount();
    }
    
    // 3. Food
    if ($pref->include_food) {
        $foodFee = UniversalFee::getByType('food', $year->id);
        if ($foodFee) {
            $fees['Food'] = $foodFee->amount;
        }
    }
    
    // 4. Sports
    if ($pref->include_sports) {
        $sportsFee = UniversalFee::getByType('sports', $year->id);
        if ($sportsFee) {
            $fees['Sports'] = $sportsFee->amount;
        }
    }
    
    return [
        'breakdown' => $fees,
        'total' => array_sum($fees),
    ];
}
```

### 2. Create/Update Fee Preference
```php
use App\Models\GuardianFeePreference;

// Create new preference
$pref = GuardianFeePreference::create([
    'school_id' => auth()->user()->school_id,
    'guardian_id' => $guardianId,
    'student_id' => $studentId,
    'academic_term_id' => $termId,
    'tuition_type' => 'full_day',
    'transport_route_id' => 1,
    'transport_type' => 'two_way',
    'include_food' => true,
    'include_sports' => true,
    'notes' => 'Special dietary requirements',
]);

// Update existing preference
$pref->update([
    'tuition_type' => 'half_day',
    'transport_route_id' => null,
    'transport_type' => null,
    'include_food' => false,
]);
```

### 3. Get All Students Using a Transport Route
```php
$route = TransportRoute::find(1);

$preferences = GuardianFeePreference::where('transport_route_id', $route->id)
    ->with(['student', 'guardian.user'])
    ->forTerm($currentTermId)
    ->get();

foreach ($preferences as $pref) {
    echo $pref->student->first_name . ' ' . $pref->student->last_name;
    echo ' (' . $pref->transport_type . ')';
    echo PHP_EOL;
}
```

### 4. Bulk Create Preferences for All Students
```php
$term = AcademicTerm::active()->first();
$students = Student::where('status', 'active')->get();

foreach ($students as $student) {
    GuardianFeePreference::getOrCreateForStudentTerm($student->id, $term->id);
}
```

---

## 🎨 Blade/Inertia Examples

### Display Transport Routes in Select
```php
// Controller
$routes = TransportRoute::active()->get();

return Inertia::render('Preferences/Create', [
    'routes' => $routes,
]);
```

```jsx
// React Component
<select value={data.transport_route_id} onChange={...}>
    <option value="">No Transport</option>
    {routes.map(route => (
        <option key={route.id} value={route.id}>
            {route.route_name} - 
            Two-way: KSh {route.amount_two_way.toLocaleString()}, 
            One-way: KSh {route.amount_one_way.toLocaleString()}
        </option>
    ))}
</select>
```

### Display Fee Breakdown
```jsx
const feeBreakdown = {
    'Tuition (Full-day)': 33000,
    'Transport (Eastleigh - Two-way)': 12000,
    'Food': 8000,
    'Sports': 5000,
};

<div>
    {Object.entries(feeBreakdown).map(([name, amount]) => (
        <div key={name} className="flex justify-between">
            <span>{name}</span>
            <span>KSh {amount.toLocaleString()}</span>
        </div>
    ))}
    <div className="border-t pt-2 font-bold">
        <span>Total</span>
        <span>KSh {Object.values(feeBreakdown).reduce((a, b) => a + b, 0).toLocaleString()}</span>
    </div>
</div>
```

---

## 🔍 Useful Queries

### Get Students Without Preferences for Current Term
```php
$term = AcademicTerm::active()->first();

$studentsWithoutPrefs = Student::where('status', 'active')
    ->whereDoesntHave('feePreference', function($q) use ($term) {
        $q->where('academic_term_id', $term->id);
    })
    ->get();
```

### Get Revenue Breakdown by Fee Type
```php
$term = AcademicTerm::active()->first();
$year = $term->academicYear;

$preferences = GuardianFeePreference::forTerm($term->id)->get();

$revenue = [
    'tuition_full_day' => 0,
    'tuition_half_day' => 0,
    'transport_one_way' => 0,
    'transport_two_way' => 0,
    'food' => 0,
    'sports' => 0,
];

foreach ($preferences as $pref) {
    // Count tuition
    if ($pref->tuition_type === 'full_day') {
        $revenue['tuition_full_day']++;
    } else {
        $revenue['tuition_half_day']++;
    }
    
    // Count transport
    if ($pref->transport_type === 'two_way') {
        $revenue['transport_two_way']++;
    } elseif ($pref->transport_type === 'one_way') {
        $revenue['transport_one_way']++;
    }
    
    // Count universal fees
    if ($pref->include_food) $revenue['food']++;
    if ($pref->include_sports') $revenue['sports']++;
}
```

---

## 📝 Validation Rules

### Fee Preference Form
```php
$validated = $request->validate([
    'student_id' => 'required|exists:students,id',
    'academic_term_id' => 'required|exists:academic_terms,id',
    'tuition_type' => 'required|in:full_day,half_day',
    'transport_route_id' => 'nullable|exists:transport_routes,id',
    'transport_type' => 'required_with:transport_route_id|in:one_way,two_way',
    'include_food' => 'boolean',
    'include_sports' => 'boolean',
    'notes' => 'nullable|string|max:1000',
]);
```

---

## 🎯 Best Practices

1. **Always use `getOrCreateForStudentTerm()`** when you need a preference - it creates defaults if missing
2. **Check `usesTransport()`** before calling `getTransportAmount()`
3. **Use scopes** for filtering: `active()`, `forYear()`, `forTerm()`
4. **Eager load relationships** to avoid N+1 queries
5. **Use helper methods** instead of accessing amounts directly

---

**Last Updated**: 2025-12-05

