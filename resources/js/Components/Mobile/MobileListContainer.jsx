import React from 'react';
import EmptyState from '@/Components/UI/EmptyState';

/**
 * MobileListContainer Component
 * 
 * Wrapper for mobile list views with consistent styling and empty state handling.
 * Provides the standard container used across all mobile index pages.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - List items to display
 * @param {Object} props.emptyState - Empty state configuration (when no items)
 * @param {React.Component} props.emptyState.icon - Icon component
 * @param {string} props.emptyState.title - Empty state title
 * @param {string} props.emptyState.message - Empty state message
 * @param {Object} props.emptyState.action - Optional action button
 * @param {boolean} props.isEmpty - Whether the list is empty
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.rounded - Use rounded corners (default: true)
 * @param {boolean} props.shadow - Show shadow (default: true)
 * @param {boolean} props.border - Show border (default: true)
 * 
 * @example
 * <MobileListContainer
 *   isEmpty={students.length === 0}
 *   emptyState={{
 *     icon: Users,
 *     title: "No students found",
 *     message: "Try adjusting your filters",
 *     action: {
 *       label: "Add Student",
 *       href: "/students/create"
 *     }
 *   }}
 * >
 *   {students.map(student => (
 *     <SwipeableListItem key={student.id}>
 *       ...
 *     </SwipeableListItem>
 *   ))}
 * </MobileListContainer>
 */
export default function MobileListContainer({
    children,
    emptyState,
    isEmpty = false,
    className = '',
    rounded = true,
    shadow = true,
    border = true,
}) {
    const containerClasses = `
        bg-white 
        
        ${rounded ? 'rounded-2xl' : ''} 
        ${shadow ? 'shadow-sm' : ''} 
        ${border ? 'border border-gray-100' : ''} 
        overflow-hidden
        ${className}
    `.trim().replace(/\s+/g, ' ');

    // Show empty state if no children or isEmpty is true
    const showEmptyState = isEmpty || (!children || (Array.isArray(children) && children.length === 0));

    return (
        <div className={containerClasses}>
            {showEmptyState && emptyState ? (
                <EmptyState
                    icon={emptyState.icon}
                    title={emptyState.title}
                    message={emptyState.message}
                    action={emptyState.action}
                    size={emptyState.size || 'md'}
                    iconColor={emptyState.iconColor || 'gray'}
                />
            ) : (
                children
            )}
        </div>
    );
}

/**
 * MobileListSection Component
 * 
 * Section wrapper for grouping mobile list items with a header.
 */
export function MobileListSection({ 
    title, 
    subtitle,
    action,
    children, 
    className = '' 
}) {
    return (
        <div className={`space-y-3 ${className}`}>
            {/* Section Header */}
            {(title || subtitle || action) && (
                <div className="flex  items-center justify-between px-1">
                    <div>
                        {title && (
                            <h3 className="text-sm font-semibold text-gray-900">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-xs text-gray-600 mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {action && (
                        <div className="flex-shrink-0">
                            {action}
                        </div>
                    )}
                </div>
            )}

            {/* Section Content */}
            <MobileListContainer>
                {children}
            </MobileListContainer>
        </div>
    );
}

/**
 * MobileListDivider Component
 * 
 * Visual divider between list items.
 */
export function MobileListDivider({ className = '' }) {
    return (
        <div className={`border-b border-gray-200 ${className}`} />
    );
}

/**
 * MobileListHeader Component
 * 
 * Sticky header for mobile lists with filters/search.
 */
export function MobileListHeader({ 
    children, 
    sticky = true,
    className = '' 
}) {
    return (
        <div className={`
            bg-white
            border-b border-gray-200 
            ${sticky ? 'sticky top-0 z-30' : ''} 
            ${className}
        `}>
            {children}
        </div>
    );
}

