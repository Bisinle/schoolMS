# Fix: Timetable Template Duplicate Entry Error

## Problem
When creating a timetable template for grades without streams, you get this error:
```
SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry '13-4-0' 
for key 'timetable_templates.unique_active_timetable'
```

## Root Cause
The unique constraint `unique_active_timetable` on `(grade_id, academic_term_id, is_active)` was preventing multiple **draft** templates (where `is_active = 0`) for the same grade and term.

In MySQL, when you have a unique constraint that includes a boolean column set to `0` (false), it treats multiple rows with the same values as duplicates, even though they're all drafts.

## Solution Applied

### 1. Database Migration
Created migration: `database/migrations/2026_01_19_100000_fix_timetable_templates_unique_constraint.php`

**What it does:**
- Drops the problematic `unique_active_timetable` constraint
- Adds a regular index `idx_template_lookup` for query performance
- Allows multiple draft templates for the same grade/stream/term combination

### 2. Application-Level Validation
Updated `app/Http/Controllers/TimetableTemplateController.php`:

**In `store()` method:**
- Added validation to prevent creating a new template if an **active** one already exists
- Only checks when `is_active = true`
- Allows unlimited draft templates

**In `publish()` method:**
- Enhanced to properly handle stream-specific templates
- Deactivates other active templates for the same grade/stream/term before activating new one
- Properly handles NULL stream_id for grades without streams

## How to Apply the Fix

### Step 1: Run the Migration
```bash
php artisan migrate
```

This will:
- Drop the problematic unique constraint
- Add the new index
- Allow you to create multiple draft templates

### Step 2: Verify the Fix
After running the migration, try creating a timetable template for a grade without streams again. It should work without errors.

## What Changed

### Before:
- ❌ Could not create multiple draft templates for the same grade/term
- ❌ Constraint enforced uniqueness even for drafts (`is_active = 0`)
- ❌ Error when trying to create second template for grades without streams

### After:
- ✅ Can create unlimited draft templates for the same grade/stream/term
- ✅ Only one active template allowed per grade/stream/term (enforced in code)
- ✅ Proper handling of NULL stream_id for grades without streams
- ✅ No database constraint errors

## Technical Details

### Old Constraint (Removed):
```sql
UNIQUE KEY unique_active_timetable (grade_id, academic_term_id, is_active)
```

### New Index (Added):
```sql
INDEX idx_template_lookup (grade_id, stream_id, academic_term_id, is_active)
```

### Validation Logic:
- **Draft templates**: No restrictions, create as many as needed
- **Active templates**: Only one per grade/stream/term combination
- **Publishing**: Automatically deactivates other active templates before activating new one

## Files Modified

1. `database/migrations/2026_01_19_100000_fix_timetable_templates_unique_constraint.php` (NEW)
2. `app/Http/Controllers/TimetableTemplateController.php` (UPDATED)
   - Enhanced `store()` method with active template validation
   - Enhanced `publish()` method with stream-aware deactivation

## No Breaking Changes
This fix is backward compatible:
- Existing templates are not affected
- All existing functionality continues to work
- Only removes the problematic constraint and adds application-level validation

