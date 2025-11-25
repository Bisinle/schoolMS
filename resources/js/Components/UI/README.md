# UI Components - Phase 2: Core Components Complete ✅

This directory contains reusable UI components extracted from common patterns across the codebase.

## 📁 Components Created

### 1. `Badge.jsx` - Badge Component
A versatile badge component using Phase 1 badge utilities.

**Props:**
- `variant` - Badge type: 'status', 'category', 'difficulty', 'readingType', 'role', 'gender', 'level', 'documentStatus'
- `value` - The value to determine styling
- `label` - Optional custom label (auto-formats if not provided)
- `size` - Size: 'xs', 'sm', 'md', 'lg' (default: 'sm')
- `className` - Additional CSS classes

**Example:**
```jsx
import { Badge } from '@/Components/UI';

<Badge variant="status" value="active" />
<Badge variant="role" value="admin" size="md" />
<Badge variant="category" value="academic" className="ml-2" />
```

---

### 2. `StatCard.jsx` - Statistics Card
Extracted from Dashboard.jsx - displays metrics with icons, values, and optional trends.

**Props:**
- `icon` - Lucide icon component (required)
- `title` - Card title/label (required)
- `value` - Main value to display (required)
- `gradient` - Tailwind gradient classes (default: 'from-orange-500 to-red-600')
- `trend` - Optional trend text
- `trendDirection` - 'up' or 'down' (default: 'up')
- `color` - Alternative to gradient (e.g., 'orange', 'blue')
- `href` - Optional link URL (makes card clickable)
- `className` - Additional CSS classes

**Example:**
```jsx
import { StatCard } from '@/Components/UI';
import { Users } from 'lucide-react';

<StatCard
  icon={Users}
  title="Total Students"
  value={150}
  gradient="from-orange-500 to-red-600"
  trend="12% increase"
  href="/students"
/>
```

---

### 3. `ProgressBar.jsx` - Progress Bar
Extracted from Dashboard.jsx - horizontal progress indicator with customizable colors.

**Props:**
- `value` - Current progress value (required)
- `max` - Maximum value (default: 100)
- `color` - Color name: 'orange', 'green', 'blue', etc. (default: 'orange')
- `showLabel` - Show percentage label (default: false)
- `labelPosition` - 'inside', 'outside', 'top' (default: 'outside')
- `size` - 'xs', 'sm', 'md', 'lg' (default: 'sm')
- `animated` - Animate progress (default: true)
- `className` - Additional CSS classes

**Example:**
```jsx
import { ProgressBar } from '@/Components/UI';

<ProgressBar value={75} max={100} color="orange" showLabel />
<ProgressBar value={45} color="green" size="md" />
```

---

### 4. `EmptyState.jsx` - Empty State
Consistent empty state for tables, lists, and search results.

**Props:**
- `icon` - Lucide icon component (required)
- `title` - Main heading text (required)
- `message` - Descriptive message (required)
- `action` - Optional action button object:
  - `label` - Button text
  - `href` - Link URL (or use onClick)
  - `onClick` - Click handler
  - `variant` - 'primary' or 'secondary'
- `size` - 'sm', 'md', 'lg' (default: 'md')
- `iconColor` - Icon background color (default: 'gray')
- `className` - Additional CSS classes

**Example:**
```jsx
import { EmptyState } from '@/Components/UI';
import { Users } from 'lucide-react';

<EmptyState
  icon={Users}
  title="No students found"
  message="Try adjusting your filters to see more students"
  action={{
    label: "Add Student",
    href: "/students/create"
  }}
/>
```

---

### 5. `Avatar.jsx` - Avatar Component
User profile images with initials fallback.

**Props:**
- `src` - Image source URL
- `name` - User's name (used for initials)
- `size` - 'xs', 'sm', 'md', 'lg', 'xl', '2xl' (default: 'md')
- `color` - Background color for initials: 'orange', 'navy', 'blue', etc. (default: 'orange')
- `shape` - 'circle', 'rounded', 'square' (default: 'circle')
- `border` - Show border (default: false)
- `className` - Additional CSS classes

**Example:**
```jsx
import { Avatar } from '@/Components/UI';

<Avatar src="/images/user.jpg" name="John Doe" size="lg" />
<Avatar name="Jane Smith" size="md" color="navy" />
```

---

### 6. `Card.jsx` - Card Wrapper
Consistent card styling with header/body/footer support.

**Props:**
- `children` - Card content (required)
- `header` - Optional header content
- `footer` - Optional footer content
- `padding` - 'none', 'sm', 'md', 'lg' (default: 'md')
- `shadow` - 'none', 'sm', 'md', 'lg', 'xl' (default: 'sm')
- `border` - Show border (default: true)
- `rounded` - Round corners (default: true)
- `hover` - Hover effect: 'none', 'shadow', 'lift' (default: 'none')
- `className` - Additional CSS classes

**Helper Components:**
- `CardHeader` - Pre-styled header
- `CardTitle` - Pre-styled title
- `CardDescription` - Pre-styled description

**Example:**
```jsx
import { Card, CardHeader, CardTitle } from '@/Components/UI';

<Card>
  <p>Simple card content</p>
</Card>

<Card
  header={<CardHeader>Card Title</CardHeader>}
  footer={<button>Action</button>}
  padding="lg"
  shadow="md"
>
  <CardTitle>Main Title</CardTitle>
  <p>Card body content</p>
</Card>
```

---

## 📦 Centralized Imports

Use the index file for clean imports:

```jsx
import { Badge, StatCard, ProgressBar, EmptyState, Avatar, Card } from '@/Components/UI';
```

---

## 🧪 Testing

A visual test page is included: `UIComponentsTest.jsx`

This file demonstrates all components with various configurations and can be deleted after verification.

---

## ⚠️ Important Notes

- **Phase 2 Complete**: All core UI components created
- **No Existing Files Modified**: Components are standalone and ready for integration
- **Uses Phase 1 Utilities**: Badge component uses the badge utilities from Phase 1
- **Next Phase**: Phase 3 will involve integrating these components into existing pages

---

## 🎯 Benefits

1. **Consistency** - Same UI patterns across all pages
2. **Maintainability** - Update styles in one place
3. **Reusability** - Import and use anywhere
4. **Type Safety** - Clear prop interfaces
5. **Performance** - Smaller bundle size (shared components)
6. **Developer Experience** - Easy to use with clear examples

---

**Created**: Phase 2 - Core UI Components
**Status**: ✅ Complete - Ready for Phase 3 Integration

