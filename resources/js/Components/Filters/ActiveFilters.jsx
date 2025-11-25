import React from 'react';
import { X } from 'lucide-react';

/**
 * ActiveFilters Component
 * 
 * Displays active filter pills with remove functionality.
 * Only shows when filters are active.
 * Matches the navy/orange theme used across the application.
 * 
 * @param {Object} props
 * @param {Object} props.filters - Active filters object { key: value }
 * @param {Function} props.onRemove - Remove filter handler (key) => void
 * @param {Object} props.labels - Filter labels mapping { key: label }
 * @param {Object} props.valueLabels - Value labels mapping { key: { value: label } }
 * @param {Function} props.formatValue - Custom value formatter (key, value) => string
 * @param {string} props.className - Additional CSS classes for container
 * @param {string} props.pillClassName - Additional CSS classes for pills
 * @param {string} props.title - Optional title (default: "Active Filters:")
 * @param {boolean} props.showTitle - Show title (default: true)
 * @param {Array<string>} props.excludeKeys - Keys to exclude from display
 * 
 * @example
 * <ActiveFilters
 *   filters={{ search: 'John', grade_id: '1', status: 'active' }}
 *   onRemove={(key) => updateFilter(key, '')}
 *   labels={{
 *     search: 'Search',
 *     grade_id: 'Grade',
 *     status: 'Status'
 *   }}
 *   valueLabels={{
 *     grade_id: { '1': 'Grade 1', '2': 'Grade 2' },
 *     status: { 'active': 'Active', 'inactive': 'Inactive' }
 *   }}
 * />
 * 
 * @example
 * // With custom formatter
 * <ActiveFilters
 *   filters={filters}
 *   onRemove={removeFilter}
 *   formatValue={(key, value) => {
 *     if (key === 'date_range') return `${value.from} - ${value.to}`;
 *     return value;
 *   }}
 * />
 */
export default function ActiveFilters({
    filters,
    onRemove,
    labels = {},
    valueLabels = {},
    formatValue,
    className = '',
    pillClassName = '',
    title = 'Active Filters:',
    showTitle = true,
    excludeKeys = [],
}) {
    // Filter out empty values and excluded keys
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
        if (excludeKeys.includes(key)) return false;
        if (value === '' || value === null || value === undefined) return false;
        if (value === 'all' || value === 'All') return false;
        return true;
    });

    // Don't render if no active filters
    if (activeFilters.length === 0) return null;

    /**
     * Get display label for a filter key
     */
    const getLabel = (key) => {
        return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    /**
     * Get display value for a filter
     */
    const getValue = (key, value) => {
        // Custom formatter
        if (formatValue) {
            return formatValue(key, value);
        }

        // Value labels mapping
        if (valueLabels[key] && valueLabels[key][value]) {
            return valueLabels[key][value];
        }

        // Default: capitalize first letter
        if (typeof value === 'string') {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }

        return String(value);
    };

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            {/* Title */}
            {showTitle && (
                <span className="text-sm font-medium text-gray-700">
                    {title}
                </span>
            )}

            {/* Filter Pills */}
            {activeFilters.map(([key, value]) => (
                <FilterPill
                    key={key}
                    label={getLabel(key)}
                    value={getValue(key, value)}
                    onRemove={() => onRemove(key)}
                    className={pillClassName}
                />
            ))}
        </div>
    );
}

/**
 * FilterPill Component
 * 
 * Individual filter pill with remove button.
 */
export function FilterPill({ label, value, onRemove, className = '' }) {
    return (
        <div
            className={`
                inline-flex 
                items-center 
                gap-1.5 
                px-3 
                py-1.5 
                text-xs 
                font-medium 
                text-navy 
                bg-orange/10 
                border 
                border-orange/20 
                rounded-full
                ${className}
            `.trim().replace(/\s+/g, ' ')}
        >
            <span className="text-gray-600">{label}:</span>
            <span className="text-navy font-semibold">{value}</span>
            <button
                type="button"
                onClick={onRemove}
                className="
                    ml-1
                    text-gray-500 
                    hover:text-orange 
                    transition-colors
                "
                aria-label={`Remove ${label} filter`}
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

/**
 * ActiveFiltersBar Component
 * 
 * Full-width bar for displaying active filters with clear all button.
 */
export function ActiveFiltersBar({
    filters,
    onRemove,
    onClearAll,
    labels,
    valueLabels,
    formatValue,
    className = '',
}) {
    // Filter out empty values
    const activeFilters = Object.entries(filters).filter(([_, value]) => {
        if (value === '' || value === null || value === undefined) return false;
        if (value === 'all' || value === 'All') return false;
        return true;
    });

    // Don't render if no active filters
    if (activeFilters.length === 0) return null;

    return (
        <div className={`
            bg-orange/5 
            border 
            border-orange/20 
            rounded-lg 
            p-3 
            md:p-4 
            mb-4 
            md:mb-6
            ${className}
        `.trim().replace(/\s+/g, ' ')}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <ActiveFilters
                    filters={filters}
                    onRemove={onRemove}
                    labels={labels}
                    valueLabels={valueLabels}
                    formatValue={formatValue}
                    showTitle={true}
                />

                {onClearAll && (
                    <button
                        type="button"
                        onClick={onClearAll}
                        className="
                            text-xs 
                            font-medium 
                            text-orange 
                            hover:text-orange-dark 
                            transition-colors
                            whitespace-nowrap
                        "
                    >
                        Clear All
                    </button>
                )}
            </div>
        </div>
    );
}

