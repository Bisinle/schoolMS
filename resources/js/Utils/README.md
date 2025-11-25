# Utility Functions - Phase 1: Extraction Complete ✅

This directory contains shared utility functions extracted from across the codebase for consistent UI and data formatting.

## 📁 Files Created

### 1. `badges.js` - Badge Styling Functions
Centralized badge helper functions that return Tailwind CSS classes for consistent badge styling.

**Functions:**
- `getStatusBadge(status)` - Active/Inactive status badges
- `getCategoryBadge(category)` - Subject/Document category badges
- `getCategoryGradient(category)` - Gradient classes for category cards
- `getDifficultyBadge(difficulty)` - Quran tracking difficulty badges
- `getReadingTypeBadge(readingType)` - Quran reading type badges
- `getRoleBadge(role)` - User role badges
- `getGenderBadge(gender)` - Gender badges
- `getLevelBadge(level)` - Grade level badges
- `getDocumentStatusBadge(status)` - Document status badges

**Example Usage:**
```javascript
import { getStatusBadge, getRoleBadge } from '@/Utils/badges';

// In your component
<span className={`px-3 py-1 rounded-full ${getStatusBadge('active')}`}>
    Active
</span>

<span className={`px-3 py-1 rounded-full ${getRoleBadge('admin')}`}>
    Admin
</span>
```

### 2. `formatting.js` - Data Formatting Functions
Functions for formatting dates, numbers, currency, and text.

**Functions:**
- `formatDate(date, options)` - Format dates with custom options
- `formatDateTime(date)` - Format date with time
- `formatDateShort(date)` - Short date format (MM/DD/YYYY)
- `formatDateLong(date)` - Long date format (Month Day, Year)
- `formatCurrency(amount, currency)` - Format as currency (default: KSH)
- `formatPercentage(value, decimals)` - Format as percentage
- `formatNumber(value)` - Format with thousand separators
- `truncateText(text, maxLength, suffix)` - Truncate text by characters
- `truncateWords(text, maxWords, suffix)` - Truncate text by words
- `capitalize(text)` - Capitalize first letter
- `toTitleCase(text)` - Convert to title case

**Example Usage:**
```javascript
import { formatDate, formatCurrency, truncateText } from '@/Utils/formatting';

// In your component
<p>{formatDate(student.date_of_birth)}</p>
<p>{formatCurrency(1500.50)}</p> // Output: KSH 1,500.50
<p>{truncateText(longDescription, 100)}</p>
```

### 3. `constants.js` - Shared Constants
Centralized constants for status values, categories, and dropdown options.

**Constants:**
- `STATUS_OPTIONS` / `STATUS_VALUES` - Active/Inactive options
- `DOCUMENT_STATUS_OPTIONS` / `DOCUMENT_STATUS_VALUES` - Document statuses
- `CATEGORY_OPTIONS` / `CATEGORY_VALUES` - Subject categories
- `GENDER_OPTIONS` / `GENDER_VALUES` - Gender options
- `GRADE_LEVEL_OPTIONS` / `GRADE_LEVEL_VALUES` - Grade levels
- `ROLE_OPTIONS` / `ROLE_VALUES` - User roles
- `READING_TYPE_OPTIONS` / `READING_TYPE_VALUES` - Quran reading types
- `DIFFICULTY_OPTIONS` / `DIFFICULTY_VALUES` - Difficulty levels
- `SCHOOL_TYPE_OPTIONS` / `SCHOOL_TYPE_VALUES` - School types

**Example Usage:**
```javascript
import { STATUS_OPTIONS, GENDER_OPTIONS, ROLE_VALUES } from '@/Utils/constants';

// In a select dropdown
<select>
    {STATUS_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
            {option.label}
        </option>
    ))}
</select>

// Using constant values
if (user.role === ROLE_VALUES.ADMIN) {
    // Admin-specific logic
}
```

## 🧪 Testing

Two test files are included for verification:

1. **`test-utilities.js`** - Console-based tests (can be deleted after verification)
2. **`UtilityTest.jsx`** - React component for visual testing (can be deleted after verification)

To test the utilities, you can temporarily import and use `UtilityTest.jsx` in any route.

## ⚠️ Important Notes

- **Phase 1 Complete**: These utilities are created but NOT yet integrated into existing components
- **No Existing Files Modified**: All existing components still use their inline functions
- **Next Phase**: Phase 2 will involve refactoring existing components to use these utilities
- **Test Files**: `test-utilities.js` and `UtilityTest.jsx` can be deleted after verification

## 📊 Files Scanned for Patterns

The following files were analyzed to extract common patterns:
- `Pages/Students/Index.jsx`
- `Pages/Teachers/Index.jsx`
- `Pages/Documents/Index.jsx`
- `Pages/Guardians/QuranTracking/Index.jsx`
- `Pages/Subjects/Index.jsx`
- `Pages/Grades/Index.jsx`
- `Pages/Users/Show.jsx`

## 🎯 Benefits

1. **Consistency** - Same badge styles across all pages
2. **Maintainability** - Update styles in one place
3. **Reusability** - Import and use anywhere
4. **Type Safety** - Centralized constants prevent typos
5. **Performance** - Smaller bundle size (shared functions)

## 🚀 Next Steps (Phase 2)

Phase 2 will involve:
1. Refactoring existing components to use these utilities
2. Removing duplicate inline functions
3. Updating imports across the codebase
4. Testing to ensure no regressions

---

**Created**: Phase 1 - Utility Extraction
**Status**: ✅ Complete - Ready for Phase 2 Integration

