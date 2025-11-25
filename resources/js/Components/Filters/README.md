# Filter Components

Comprehensive filter components and custom hook for managing filter state with Inertia.js integration.

## Hook

### useFilters

Custom hook for managing filter state with debounced search and immediate filter updates.

**Parameters:**
- `route` (string) - The route to navigate to (e.g., '/students')
- `initialFilters` (object) - Initial filter values from server
- `preserveState` (boolean) - Preserve component state (default: true)
- `preserveScroll` (boolean) - Preserve scroll position (default: true)
- `replace` (boolean) - Replace history instead of push (default: true)
- `debounceMs` (number) - Debounce delay for search in ms (default: 500)
- `debounceFields` (array) - Fields to debounce (default: ['search'])
- `immediateFields` (array) - Fields to apply immediately (default: all except debounced)

**Returns:**
- `filters` (object) - Current filter values
- `updateFilter` (function) - Update single or multiple filters
- `clearFilters` (function) - Clear all filters
- `hasActiveFilters` (boolean) - Whether any filters are active
- `getActiveFilters` (function) - Get active filters as array
- `applyFilters` (function) - Manually apply filters

**Example:**
```jsx
import useFilters from '@/Hooks/useFilters';

const { filters, updateFilter, clearFilters, hasActiveFilters } = useFilters({
  route: '/students',
  initialFilters: { search: '', grade_id: '', status: '' },
});

// Update single filter
updateFilter('search', 'John');

// Update multiple filters
updateFilter({ grade_id: '1', status: 'active' });

// Clear all filters
clearFilters();
```

---

## Components

### 1. SearchInput

Enhanced search input with icon, clear button, and enter-to-submit.

**Props:**
- `value` (string) - Search input value
- `onChange` (function) - Change handler
- `onSubmit` (function) - Optional submit handler (called on Enter)
- `onClear` (function) - Optional clear handler
- `placeholder` (string) - Placeholder text (default: "Search...")
- `showClearButton` (boolean) - Show clear button (default: true)
- `autoFocus` (boolean) - Auto-focus on mount (default: false)
- `size` (string) - Input size: 'sm', 'md', 'lg' (default: 'md')

**Example:**
```jsx
<SearchInput
  value={filters.search}
  onChange={(e) => updateFilter('search', e.target.value)}
  placeholder="Search students..."
/>
```

---

### 2. FilterSelect

Compact select dropdown for filter bars with "All" option.

**Props:**
- `label` (string) - Optional label text
- `name` (string) - Select name attribute
- `value` (string|number) - Selected value
- `onChange` (function) - Change handler
- `options` (array) - Options array ([{ value, label }] or simple array)
- `allLabel` (string) - Label for "All" option (default: "All")
- `allValue` (string) - Value for "All" option (default: "")
- `showAllOption` (boolean) - Show "All" option (default: true)
- `hideLabel` (boolean) - Hide label (default: false)
- `hideLabelOnMobile` (boolean) - Hide label on mobile (default: true)
- `size` (string) - Select size: 'sm', 'md', 'lg' (default: 'md')

**Helper Components:**
- `FilterSelectGroup` - Grid layout for multiple selects

**Example:**
```jsx
<FilterSelect
  label="Grade"
  value={filters.grade_id}
  onChange={(e) => updateFilter('grade_id', e.target.value)}
  options={grades.map(g => ({ value: g.id, label: g.name }))}
  allLabel="All Grades"
/>
```

---

### 3. FilterBar

Responsive container for filter components with clear all functionality.

**Props:**
- `children` (node) - Filter components
- `onClear` (function) - Clear all filters handler
- `showClear` (boolean) - Show clear button (default: auto-detect)
- `title` (string) - Optional title (default: "Filters")
- `showTitle` (boolean) - Show title (default: true)
- `icon` (node) - Custom icon
- `clearLabel` (string) - Clear button label (default: "Reset Filters")
- `layout` (string) - Layout: 'horizontal', 'grid' (default: 'grid')
- `gridCols` (string) - Grid columns: '1', '2', '3', '4' (default: 'auto')
- `compact` (boolean) - Compact mode (default: false)

**Helper Components:**
- `FilterBarSection` - Create sections within FilterBar
- `FilterBarActions` - Action buttons in FilterBar

**Example:**
```jsx
<FilterBar onClear={clearFilters}>
  <SearchInput
    value={filters.search}
    onChange={(e) => updateFilter('search', e.target.value)}
  />
  <FilterSelect
    label="Grade"
    value={filters.grade_id}
    onChange={(e) => updateFilter('grade_id', e.target.value)}
    options={grades}
  />
</FilterBar>
```

---

### 4. ActiveFilters

Displays active filter pills with remove functionality.

**Props:**
- `filters` (object) - Active filters object
- `onRemove` (function) - Remove filter handler (key) => void
- `labels` (object) - Filter labels mapping { key: label }
- `valueLabels` (object) - Value labels mapping { key: { value: label } }
- `formatValue` (function) - Custom value formatter (key, value) => string
- `title` (string) - Optional title (default: "Active Filters:")
- `showTitle` (boolean) - Show title (default: true)
- `excludeKeys` (array) - Keys to exclude from display

**Helper Components:**
- `FilterPill` - Individual filter pill
- `ActiveFiltersBar` - Full-width bar with clear all button

**Example:**
```jsx
<ActiveFilters
  filters={filters}
  onRemove={(key) => updateFilter(key, '')}
  labels={{
    search: 'Search',
    grade_id: 'Grade',
    status: 'Status'
  }}
  valueLabels={{
    grade_id: { '1': 'Grade 1', '2': 'Grade 2' },
    status: { 'active': 'Active', 'inactive': 'Inactive' }
  }}
/>
```

---

## Complete Example

```jsx
import { Head } from '@inertiajs/react';
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar, ActiveFiltersBar } from '@/Components/Filters';

export default function StudentsIndex({ students, grades, filters: initialFilters }) {
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useFilters({
    route: '/students',
    initialFilters,
  });

  return (
    <>
      <Head title="Students" />

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <ActiveFiltersBar
          filters={filters}
          onRemove={(key) => updateFilter(key, '')}
          onClearAll={clearFilters}
          labels={{ search: 'Search', grade_id: 'Grade', status: 'Status' }}
          valueLabels={{
            grade_id: grades.reduce((acc, g) => ({ ...acc, [g.id]: g.name }), {}),
          }}
        />
      )}

      {/* Filter Bar */}
      <FilterBar onClear={clearFilters}>
        <SearchInput
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Search students..."
        />
        <FilterSelect
          label="Grade"
          value={filters.grade_id}
          onChange={(e) => updateFilter('grade_id', e.target.value)}
          options={grades.map(g => ({ value: g.id, label: g.name }))}
          allLabel="All Grades"
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          options={['active', 'inactive']}
          allLabel="All Status"
        />
      </FilterBar>

      {/* Students List */}
    </>
  );
}
```

## Theme

All components use the navy/orange theme:
- Focus ring: `focus:ring-orange`
- Active filter pills: `bg-orange/10 border-orange/20 text-navy`
- Clear buttons: `bg-gray-100 hover:bg-gray-200`

## Testing

Use `FilterComponentsTest.jsx` to visually test all components. Delete after verification.

