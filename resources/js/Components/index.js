/**
 * Centralized Component Exports
 * 
 * This file provides a single entry point for importing commonly used components.
 * Instead of importing from multiple paths, you can import from '@/Components'.
 * 
 * Example:
 * import { Badge, StatCard, Avatar, TextInput, SearchInput } from '@/Components';
 */

// UI Components
export { Badge } from './UI/Badge';
export { StatCard } from './UI/StatCard';
export { ProgressBar } from './UI/ProgressBar';
export { EmptyState } from './UI/EmptyState';
export { Avatar } from './UI/Avatar';
export { Card } from './UI/Card';

// Form Components
export { TextInput } from './Forms/TextInput';
export { SelectInput } from './Forms/SelectInput';
export { TextareaInput } from './Forms/TextareaInput';
export { FormSection } from './Forms/FormSection';
export { FormActions } from './Forms/FormActions';
export { ReadOnlyField } from './Forms/ReadOnlyField';

// Filter Components
export { SearchInput } from './Filters/SearchInput';
export { FilterSelect } from './Filters/FilterSelect';
export { FilterBar } from './Filters/FilterBar';

// Mobile Components
export { SwipeableListItem } from './Mobile/SwipeableListItem';
export { ExpandableCard } from './Mobile/ExpandableCard';
export { MobileListContainer } from './Mobile/MobileListContainer';

// Other Common Components
export { default as ConfirmationModal } from './ConfirmationModal';
export { default as SwipeActionButton } from './SwipeActionButton';

