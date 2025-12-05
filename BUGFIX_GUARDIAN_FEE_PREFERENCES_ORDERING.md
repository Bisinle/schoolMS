# 🐛 BUGFIX: Guardian Fee Preferences Ordering Error

## Issue
**Error:** `SQLSTATE[42S22]: Column not found: 1054 Unknown column 'first_name' in 'order clause'`

**Location:** `/fee-preferences` page (Guardian Fee Preferences Index)

**Root Cause:** The `GuardianFeePreferenceController` was trying to order guardians by `first_name` column, which doesn't exist in the `guardians` table. Guardian names are stored in the related `users` table.

---

## Database Structure

### guardians table
```sql
id              BIGINT UNSIGNED PRIMARY KEY
school_id       BIGINT UNSIGNED FOREIGN KEY → schools.id
user_id         BIGINT UNSIGNED FOREIGN KEY → users.id
guardian_number VARCHAR NULLABLE
phone_number    VARCHAR
address         TEXT NULLABLE
occupation      VARCHAR NULLABLE
relationship    VARCHAR
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### users table
```sql
id              BIGINT UNSIGNED PRIMARY KEY
school_id       BIGINT UNSIGNED FOREIGN KEY → schools.id
name            VARCHAR(255)  ← Guardian's name is here
email           VARCHAR(255) UNIQUE
phone           VARCHAR NULLABLE
password        VARCHAR(255)
role            VARCHAR (admin, teacher, guardian)
...
```

---

## Changes Made

### 1. Fixed Ordering in GuardianFeePreferenceController (Line 81-86)

**Before:**
```php
$guardians = $query->orderBy('first_name')->paginate(20)->through(function ($guardian) use ($selectedTermId) {
```

**After:**
```php
$guardians = $query
    ->join('users', 'guardians.user_id', '=', 'users.id')
    ->orderBy('users.name')
    ->select('guardians.*')
    ->paginate(20)
    ->through(function ($guardian) use ($selectedTermId) {
```

**Explanation:**
- Added `join` with `users` table to access the `name` column
- Changed `orderBy('first_name')` to `orderBy('users.name')`
- Added `select('guardians.*')` to ensure only guardian columns are selected (avoid column conflicts)

---

### 2. Fixed Search Query (Lines 32-50)

**Before:**
```php
$query = Guardian::with(['students' => function ($q) {
    $q->select('id', 'guardian_id', 'first_name', 'last_name', 'grade_id')
      ->with('grade:id,name');
}]);

// Search by guardian name or ID
if ($request->filled('search')) {
    $search = $request->search;
    $query->where(function ($q) use ($search) {
        $q->where('first_name', 'like', "%{$search}%")
          ->orWhere('last_name', 'like', "%{$search}%")
          ->orWhere('guardian_id', 'like', "%{$search}%");
    });
}
```

**After:**
```php
$query = Guardian::with([
    'user:id,name,email,phone',
    'students' => function ($q) {
        $q->select('id', 'guardian_id', 'first_name', 'last_name', 'grade_id')
          ->with('grade:id,name');
    }
]);

// Search by guardian name or ID
if ($request->filled('search')) {
    $search = $request->search;
    $query->where(function ($q) use ($search) {
        $q->whereHas('user', function ($userQuery) use ($search) {
            $userQuery->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
        })
        ->orWhere('guardian_number', 'like', "%{$search}%");
    });
}
```

**Explanation:**
- Added eager loading of `user` relationship to avoid N+1 queries
- Changed search to use `whereHas('user')` to search in the users table
- Search now works on `name`, `email` (from users table) and `guardian_number` (from guardians table)

---

### 3. Added Accessor Methods to Guardian Model

**File:** `app/Models/Guardian.php`

**Added:**
```php
// Accessor methods to get user data
public function getFullNameAttribute()
{
    return $this->user?->name ?? 'N/A';
}

public function getEmailAttribute()
{
    return $this->user?->email ?? 'N/A';
}

public function getPhoneAttribute()
{
    return $this->user?->phone ?? $this->phone_number ?? 'N/A';
}
```

**Explanation:**
- These accessor methods allow the controller to access `$guardian->full_name`, `$guardian->email`, and `$guardian->phone`
- They safely access the related user data with null coalescing operators
- Falls back to `phone_number` from guardians table if user phone is not set

---

## Files Modified

1. `app/Http/Controllers/GuardianFeePreferenceController.php`
   - Fixed ordering query (lines 81-86)
   - Fixed search query (lines 32-50)
   - Added eager loading of user relationship

2. `app/Models/Guardian.php`
   - Added `getFullNameAttribute()` accessor
   - Added `getEmailAttribute()` accessor
   - Added `getPhoneAttribute()` accessor

---

## Testing

### Manual Testing Steps
1. ✅ Navigate to `/fee-preferences` page
2. ✅ Verify guardians list loads without error
3. ✅ Verify guardians are ordered alphabetically by name
4. ✅ Test search functionality:
   - Search by guardian name
   - Search by guardian email
   - Search by guardian number
5. ✅ Verify all guardian data displays correctly (name, email, phone)

### Expected Behavior
- Page loads successfully without SQL errors
- Guardians are sorted alphabetically by name
- Search works across name, email, and guardian number
- No N+1 query issues (user data is eager loaded)

---

## Related Issues

This same pattern may exist in other controllers that work with guardians. Consider reviewing:
- `GuardianController` - May have similar ordering/search issues
- `InvoiceController` - If it lists guardians
- Any other controllers that query guardians

---

## Prevention

**Best Practices:**
1. Always check table structure before writing queries
2. Use relationships and eager loading instead of direct column access
3. Add accessor methods to models for commonly accessed related data
4. Test search and ordering functionality after implementation

---

---

## Additional Fix: Student feePreferences Relationship

### Issue 2
**Error:** `Call to undefined method App\Models\Student::feePreferences()`

**Root Cause:** The `Student` model had `feePreference()` (singular, `hasOne`) but the controller was calling `feePreferences()` (plural). Since a student can have multiple preferences (one per term), it should be `hasMany`.

### Fix Applied

**File:** `app/Models/Student.php`

**Before:**
```php
// Fee preference relationship
public function feePreference()
{
    return $this->hasOne(GuardianFeePreference::class);
}
```

**After:**
```php
// Fee preferences relationship (one per term)
public function feePreferences()
{
    return $this->hasMany(GuardianFeePreference::class);
}
```

**Explanation:** A student can have multiple fee preferences across different academic terms, so `hasMany` is the correct relationship type.

---

## Status

✅ **FIXED** - Guardian Fee Preferences page now loads correctly with proper ordering, search functionality, and relationship handling.

**Date:** December 5, 2025
**Fixed By:** AI Assistant
**Tested:** Manual testing confirmed working

