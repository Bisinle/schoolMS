# Form Components

Comprehensive form components for the schoolMS application with consistent navy/orange theme styling.

## Components

### 1. TextInput

Enhanced text input with label, error display, helper text, and auto-focus support.

**Props:**
- `label` (string) - Input label text
- `name` (string) - Input name attribute
- `value` (string) - Input value
- `onChange` (function) - Change handler
- `error` (string) - Error message to display
- `required` (boolean) - Whether field is required (shows asterisk)
- `disabled` (boolean) - Whether input is disabled
- `placeholder` (string) - Placeholder text
- `type` (string) - Input type (default: 'text')
- `helperText` (string) - Helper text below input
- `isFocused` (boolean) - Auto-focus on mount
- `className` (string) - Additional CSS classes for input
- `containerClassName` (string) - Additional CSS classes for container

**Example:**
```jsx
<TextInput
  label="First Name"
  name="first_name"
  value={data.first_name}
  onChange={(e) => setData('first_name', e.target.value)}
  error={errors.first_name}
  required
  placeholder="e.g., John"
/>
```

---

### 2. SelectInput

Enhanced select dropdown with label, error display, and flexible options format.

**Props:**
- `label` (string) - Select label text
- `name` (string) - Select name attribute
- `value` (string|number) - Selected value
- `onChange` (function) - Change handler
- `error` (string) - Error message to display
- `required` (boolean) - Whether field is required
- `disabled` (boolean) - Whether select is disabled
- `options` (array) - Options array (format: `[{ value, label }]` or simple array)
- `placeholder` (string) - Placeholder option text (default: "Select...")
- `showPlaceholder` (boolean) - Show placeholder option (default: true)
- `helperText` (string) - Helper text below select
- `optionRenderer` (function) - Custom option renderer function

**Example:**
```jsx
<SelectInput
  label="Grade"
  name="grade_id"
  value={data.grade_id}
  onChange={(e) => setData('grade_id', e.target.value)}
  options={grades.map(g => ({ value: g.id, label: g.name }))}
  error={errors.grade_id}
  required
/>
```

---

### 3. TextareaInput

Enhanced textarea with label, error display, auto-resize, and character count.

**Props:**
- `label` (string) - Textarea label text
- `name` (string) - Textarea name attribute
- `value` (string) - Textarea value
- `onChange` (function) - Change handler
- `error` (string) - Error message to display
- `required` (boolean) - Whether field is required
- `disabled` (boolean) - Whether textarea is disabled
- `placeholder` (string) - Placeholder text
- `rows` (number) - Number of rows (default: 4)
- `autoResize` (boolean) - Auto-resize based on content (default: false)
- `maxLength` (number) - Maximum character count
- `showCharCount` (boolean) - Show character counter
- `helperText` (string) - Helper text below textarea

**Example:**
```jsx
<TextareaInput
  label="Description"
  name="description"
  value={data.description}
  onChange={(e) => setData('description', e.target.value)}
  rows={6}
  maxLength={500}
  showCharCount
  placeholder="Enter description..."
/>
```

---

### 4. FormSection

Groups related form fields with consistent spacing and styling. Supports optional collapsible functionality.

**Props:**
- `title` (string) - Section title
- `description` (string) - Optional section description
- `children` (node) - Form fields to group
- `collapsible` (boolean) - Whether section can be collapsed (default: false)
- `defaultExpanded` (boolean) - Initial expanded state (default: true)
- `showBorder` (boolean) - Show bottom border (default: true)
- `gridCols` (string) - Grid columns: '1', '2', '3' (default: '2')

**Helper Components:**
- `FormField` - For full-width fields within a grid
- `FormRow` - For custom row layouts

**Example:**
```jsx
<FormSection
  title="Personal Information"
  description="Enter the student's personal details"
>
  <TextInput label="First Name" ... />
  <TextInput label="Last Name" ... />
  
  <FormField span="full">
    <TextInput label="Email" ... />
  </FormField>
</FormSection>
```

---

### 5. FormActions

Consistent submit/cancel button layout with loading state handling.

**Props:**
- `submitLabel` (string) - Submit button text (default: "Save")
- `cancelLabel` (string) - Cancel button text (default: "Cancel")
- `cancelHref` (string) - Cancel button URL
- `processing` (boolean) - Whether form is processing
- `canSubmit` (boolean) - Whether submit is allowed (default: true)
- `onCancel` (function) - Optional cancel handler (overrides cancelHref)
- `showSubmitIcon` (boolean) - Show save icon (default: true)
- `showCancelIcon` (boolean) - Show X icon (default: false)
- `submitVariant` (string) - Submit button color: 'orange', 'blue', 'green', 'navy' (default: 'orange')
- `alignment` (string) - Button alignment: 'left', 'center', 'right', 'between' (default: 'right')

**Example:**
```jsx
<FormActions
  submitLabel="Register Student"
  cancelHref="/students"
  processing={processing}
/>
```

---

### 6. ReadOnlyField

Display-only field for auto-generated or non-editable values with optional copy-to-clipboard.

**Props:**
- `label` (string) - Field label text
- `value` (string) - Field value to display
- `copyable` (boolean) - Enable copy-to-clipboard (default: false)
- `badge` (string) - Optional badge text (e.g., "Auto-generated")
- `badgeColor` (string) - Badge color: 'green', 'blue', 'orange', 'gray', 'navy' (default: 'green')
- `helperText` (string) - Helper text below field
- `placeholder` (string) - Placeholder when no value

**Helper Components:**
- `ReadOnlyFieldGroup` - Grid layout for multiple read-only fields
- `ReadOnlyInfo` - Simple label-value pair

**Example:**
```jsx
<ReadOnlyField
  label="Admission Number"
  value="STU-2025-001"
  copyable
  badge="Auto-generated"
  helperText="This ID is automatically assigned upon registration"
/>
```

---

## Usage

Import components from the centralized index:

```jsx
import {
  TextInput,
  SelectInput,
  TextareaInput,
  FormSection,
  FormActions,
  ReadOnlyField
} from '@/Components/Forms';
```

## Complete Form Example

```jsx
import { useForm } from '@inertiajs/react';
import {
  TextInput,
  SelectInput,
  FormSection,
  FormActions,
  ReadOnlyField
} from '@/Components/Forms';

export default function StudentCreate({ grades }) {
  const { data, setData, post, processing, errors } = useForm({
    first_name: '',
    last_name: '',
    grade_id: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/students');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Auto-Generated">
        <ReadOnlyField
          label="Admission Number"
          value="Will be auto-generated"
          badge="Auto-generated"
        />
      </FormSection>

      <FormSection title="Personal Information">
        <TextInput
          label="First Name"
          name="first_name"
          value={data.first_name}
          onChange={(e) => setData('first_name', e.target.value)}
          error={errors.first_name}
          required
        />
        
        <TextInput
          label="Last Name"
          name="last_name"
          value={data.last_name}
          onChange={(e) => setData('last_name', e.target.value)}
          error={errors.last_name}
          required
        />
      </FormSection>

      <FormSection title="Academic Information">
        <SelectInput
          label="Grade"
          name="grade_id"
          value={data.grade_id}
          onChange={(e) => setData('grade_id', e.target.value)}
          options={grades.map(g => ({ value: g.id, label: g.name }))}
          error={errors.grade_id}
          required
        />
      </FormSection>

      <FormActions
        submitLabel="Register Student"
        cancelHref="/students"
        processing={processing}
      />
    </form>
  );
}
```

## Theme

All components use the navy/orange theme:
- Focus ring: `focus:ring-orange`
- Submit buttons: `bg-orange hover:bg-orange-dark`
- Error states: `border-red-500` and `text-red-600`
- Labels: `text-gray-700`
- Helper text: `text-gray-500`

## Testing

Use `FormComponentsTest.jsx` to visually test all components. Delete after verification.

