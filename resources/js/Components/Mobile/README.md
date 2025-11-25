# Mobile Components

Reusable mobile-specific components extracted from common patterns across the application.

## Components

### 1. SwipeableListItem

**CRITICAL COMPONENT** - Used in 8+ index pages for mobile list items.

Provides swipe-to-reveal actions with smooth animations. Extracted from Students, Teachers, Documents, and other index pages.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | Main card content (always visible) |
| `primaryAction` | Object | - | Left swipe action configuration |
| `secondaryAction` | Object | - | Right swipe action configuration |
| `onSwipeLeft` | Function | - | Callback when swiped left |
| `onSwipeRight` | Function | - | Callback when swiped right |
| `disabled` | Boolean | `false` | Disable swipe actions |
| `swipeDelta` | Number | `60` | Swipe sensitivity |
| `className` | String | `''` | Additional CSS classes |

#### Action Configuration

```javascript
{
  color: 'blue' | 'red' | 'green' | 'orange' | 'purple' | 'indigo',
  buttons: [
    {
      icon: IconComponent,
      href: '/path',  // Optional: for navigation
      onClick: () => {}, // Optional: for actions
      size: 'small' | 'medium' | 'large'
    }
  ]
}
```

#### Usage

```jsx
import { SwipeableListItem } from '@/Components/Mobile';
import { Eye, Edit, Trash2, FileText } from 'lucide-react';

<SwipeableListItem
  primaryAction={{
    color: 'blue',
    buttons: [
      { icon: Eye, href: `/students/${student.id}` },
      { icon: Edit, href: `/students/${student.id}/edit` },
      { icon: Trash2, onClick: () => handleDelete(student) }
    ]
  }}
  secondaryAction={{
    color: 'green',
    buttons: [
      { icon: FileText, onClick: () => generateReport(student) }
    ]
  }}
>
  <div className="p-4">
    {/* Your card content */}
  </div>
</SwipeableListItem>
```

---

### 2. ExpandableCard

Expandable card with smooth animations and chevron rotation. Used inside SwipeableListItem for detail views.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `header` | ReactNode | - | Always visible header content |
| `children` | ReactNode | - | Expandable content |
| `defaultExpanded` | Boolean | `false` | Initial expanded state |
| `onToggle` | Function | - | Callback when toggled |
| `showChevron` | Boolean | `true` | Show chevron icon |
| `chevronPosition` | String | `'right'` | Chevron position: 'right', 'left' |
| `headerClassName` | String | `''` | CSS classes for header |
| `contentClassName` | String | `''` | CSS classes for content |
| `disabled` | Boolean | `false` | Disable expand/collapse |

#### Helper Components

- **ExpandableCardHeader** - Pre-styled header with title, subtitle, badge, meta
- **ExpandableCardContent** - Pre-styled content area with consistent padding

#### Usage

```jsx
import { 
  ExpandableCard, 
  ExpandableCardHeader, 
  ExpandableCardContent 
} from '@/Components/Mobile';
import { Badge } from '@/Components/UI';

<ExpandableCard
  headerClassName="p-4"
  contentClassName="px-4 pb-4 pt-3"
  header={
    <ExpandableCardHeader
      title="John Doe"
      subtitle="STU001 • Grade 10"
      badge={<Badge variant="status" value="active" size="sm" />}
      meta={
        <>
          <span className="text-xs text-gray-500">Male</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">15 years</span>
        </>
      }
    />
  }
>
  <ExpandableCardContent>
    {/* Expanded details */}
  </ExpandableCardContent>
</ExpandableCard>
```

---

### 3. MobileListContainer

Wrapper for mobile list views with consistent styling and empty state handling.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | List items to display |
| `emptyState` | Object | - | Empty state configuration |
| `isEmpty` | Boolean | `false` | Whether the list is empty |
| `className` | String | `''` | Additional CSS classes |
| `rounded` | Boolean | `true` | Use rounded corners |
| `shadow` | Boolean | `true` | Show shadow |
| `border` | Boolean | `true` | Show border |

#### Helper Components

- **MobileListSection** - Section wrapper with header
- **MobileListDivider** - Visual divider between items
- **MobileListHeader** - Sticky header for filters/search

#### Usage

```jsx
import { MobileListContainer } from '@/Components/Mobile';
import { Users } from 'lucide-react';

<MobileListContainer
  isEmpty={students.length === 0}
  emptyState={{
    icon: Users,
    title: "No students found",
    message: "Try adjusting your filters",
    action: {
      label: "Add Student",
      href: "/students/create"
    }
  }}
>
  {students.map(student => (
    <SwipeableListItem key={student.id}>
      {/* ... */}
    </SwipeableListItem>
  ))}
</MobileListContainer>
```

---

## Complete Example

Combining all components for a typical mobile list view:

```jsx
import { 
  SwipeableListItem, 
  ExpandableCard,
  ExpandableCardHeader,
  ExpandableCardContent,
  MobileListContainer 
} from '@/Components/Mobile';
import { Badge } from '@/Components/UI';
import { Eye, Edit, Trash2, FileText, Calendar, Users, Phone } from 'lucide-react';

<MobileListContainer
  isEmpty={students.length === 0}
  emptyState={{
    icon: Users,
    title: "No students found",
    message: "Try adjusting your filters"
  }}
>
  {students.map(student => (
    <SwipeableListItem
      key={student.id}
      primaryAction={{
        color: 'blue',
        buttons: [
          { icon: Eye, href: `/students/${student.id}` },
          { icon: Edit, href: `/students/${student.id}/edit` },
          { icon: Trash2, onClick: () => handleDelete(student) }
        ]
      }}
      secondaryAction={{
        color: 'green',
        buttons: [
          { icon: FileText, onClick: () => generateReport(student) }
        ]
      }}
    >
      <ExpandableCard
        headerClassName="p-4"
        contentClassName="px-4 pb-4 pt-3"
        header={
          <ExpandableCardHeader
            title={student.name}
            subtitle={`${student.admission_number} • ${student.grade.name}`}
            badge={<Badge variant="status" value="active" size="sm" />}
          />
        }
      >
        <ExpandableCardContent>
          <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">
                {new Date(student.date_of_birth).toLocaleDateString()}
              </span>
            </div>
            {student.guardian && (
              <>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {student.guardian.user.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {student.guardian.phone_number}
                  </span>
                </div>
              </>
            )}
          </div>
        </ExpandableCardContent>
      </ExpandableCard>
    </SwipeableListItem>
  ))}
</MobileListContainer>
```

## Testing

Use `MobileComponentsTest.jsx` to visually test all components. View on mobile device or resize browser to <768px.

**Delete the test file after verification.**

