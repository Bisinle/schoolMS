import React from 'react';
import { Filter, X } from 'lucide-react';

/**
 * FilterBar Component
 * 
 * Responsive container for filter components with clear all functionality.
 * Matches the navy/orange theme used across the application.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Filter components (SearchInput, FilterSelect, etc.)
 * @param {Function} props.onClear - Clear all filters handler
 * @param {boolean} props.showClear - Show clear button (default: auto-detect based on onClear)
 * @param {string} props.title - Optional title (default: "Filters")
 * @param {boolean} props.showTitle - Show title (default: true)
 * @param {React.ReactNode} props.icon - Custom icon (default: Filter icon)
 * @param {string} props.clearLabel - Clear button label (default: "Reset Filters")
 * @param {string} props.layout - Layout: 'horizontal', 'grid' (default: 'grid')
 * @param {string} props.gridCols - Grid columns: '1', '2', '3', '4' (default: 'auto')
 * @param {string} props.className - Additional CSS classes for container
 * @param {string} props.contentClassName - Additional CSS classes for content area
 * @param {boolean} props.compact - Compact mode (less padding) (default: false)
 * 
 * @example
 * <FilterBar onClear={clearFilters}>
 *   <SearchInput
 *     value={filters.search}
 *     onChange={(e) => updateFilter('search', e.target.value)}
 *   />
 *   <FilterSelect
 *     label="Grade"
 *     value={filters.grade_id}
 *     onChange={(e) => updateFilter('grade_id', e.target.value)}
 *     options={grades}
 *   />
 * </FilterBar>
 * 
 * @example
 * // Horizontal layout
 * <FilterBar layout="horizontal" onClear={clearFilters}>
 *   <SearchInput ... />
 *   <FilterSelect ... />
 * </FilterBar>
 */
export default function FilterBar({
    children,
    onClear,
    showClear,
    title = 'Filters',
    showTitle = true,
    icon,
    clearLabel = 'Reset Filters',
    layout = 'grid',
    gridCols = 'auto',
    className = '',
    contentClassName = '',
    compact = false,
}) {
    const shouldShowClear = showClear !== undefined ? showClear : !!onClear;

    const gridColsClasses = {
        'auto': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4',
        '1': 'grid grid-cols-1 gap-3 md:gap-4',
        '2': 'grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4',
        '3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4',
        '4': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4',
    };

    const layoutClasses = {
        horizontal: 'flex flex-wrap items-end gap-3 md:gap-4',
        grid: gridColsClasses[gridCols] || gridColsClasses['auto'],
    };

    const paddingClasses = compact 
        ? 'p-4' 
        : 'p-4 md:p-6';

    return (
        <div className={`
            bg-white 
            rounded-lg 
            md:rounded-xl 
            shadow-sm 
            border 
            border-gray-100 
            ${paddingClasses}
            mb-4 
            md:mb-6
            ${className}
        `.trim().replace(/\s+/g, ' ')}>
            {/* Header */}
            {showTitle && (
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                    {icon || <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />}
                    <h3 className="text-base md:text-lg font-semibold text-navy">
                        {title}
                    </h3>
                </div>
            )}

            {/* Filter Content */}
            <div className={`${layoutClasses[layout]} ${contentClassName}`}>
                {children}
            </div>

            {/* Clear Button */}
            {shouldShowClear && onClear && (
                <div className="mt-3 md:mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={onClear}
                        className="
                            inline-flex
                            items-center
                            gap-2
                            px-3 
                            md:px-4 
                            py-1.5 
                            md:py-2 
                            text-xs 
                            md:text-sm 
                            font-medium 
                            text-gray-700 
                            bg-gray-100 
                            rounded-lg 
                            hover:bg-gray-200 
                            transition-colors
                        "
                    >
                        <X className="w-4 h-4" />
                        {clearLabel}
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * FilterBarSection Component
 * 
 * Helper component for creating sections within a FilterBar.
 */
export function FilterBarSection({ title, children, className = '' }) {
    return (
        <div className={`col-span-full ${className}`}>
            {title && (
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {title}
                </h4>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {children}
            </div>
        </div>
    );
}

/**
 * FilterBarActions Component
 * 
 * Helper component for action buttons in FilterBar.
 */
export function FilterBarActions({ children, className = '' }) {
    return (
        <div className={`col-span-full flex items-center justify-end gap-3 ${className}`}>
            {children}
        </div>
    );
}

