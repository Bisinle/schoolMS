import React from 'react';

/**
 * FilterSelect Component
 * 
 * Compact select dropdown for filter bars with "All" option.
 * Matches the navy/orange theme used across the application.
 * 
 * @param {Object} props
 * @param {string} props.label - Optional label text (hidden on mobile if hideLabel=true)
 * @param {string} props.name - Select name attribute
 * @param {string|number} props.value - Selected value
 * @param {Function} props.onChange - Change handler
 * @param {Array} props.options - Options array (format: [{ value, label }] or simple array)
 * @param {string} props.allLabel - Label for "All" option (default: "All")
 * @param {string} props.allValue - Value for "All" option (default: "")
 * @param {boolean} props.showAllOption - Show "All" option (default: true)
 * @param {boolean} props.hideLabel - Hide label (default: false)
 * @param {boolean} props.hideLabelOnMobile - Hide label on mobile (default: true)
 * @param {string} props.placeholder - Placeholder when no label
 * @param {string} props.className - Additional CSS classes for container
 * @param {string} props.selectClassName - Additional CSS classes for select
 * @param {string} props.size - Select size: 'sm', 'md', 'lg' (default: 'md')
 * @param {Function} props.optionRenderer - Custom option renderer function
 * 
 * @example
 * <FilterSelect
 *   label="Grade"
 *   value={gradeId}
 *   onChange={(e) => updateFilter('grade_id', e.target.value)}
 *   options={grades.map(g => ({ value: g.id, label: g.name }))}
 *   allLabel="All Grades"
 * />
 * 
 * @example
 * // Simple array options
 * <FilterSelect
 *   label="Status"
 *   value={status}
 *   onChange={(e) => updateFilter('status', e.target.value)}
 *   options={['active', 'inactive']}
 *   allLabel="All Status"
 * />
 */
export default function FilterSelect({
    label,
    name,
    value,
    onChange,
    options = [],
    allLabel = 'All',
    allValue = '',
    showAllOption = true,
    hideLabel = false,
    hideLabelOnMobile = true,
    placeholder,
    className = '',
    selectClassName = '',
    size = 'md',
    optionRenderer,
}) {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-3 md:px-4 py-2 md:py-2.5 text-sm',
        lg: 'px-4 py-3 text-base',
    };

    // Normalize options to { value, label } format
    const normalizedOptions = options.map(option => {
        if (typeof option === 'object' && option !== null) {
            return option;
        }
        return { 
            value: option, 
            label: String(option).charAt(0).toUpperCase() + String(option).slice(1) 
        };
    });

    return (
        <div className={className}>
            {/* Label */}
            {label && !hideLabel && (
                <label 
                    htmlFor={name}
                    className={`
                        block 
                        text-xs md:text-sm 
                        font-medium 
                        text-gray-700 
                        mb-1.5 md:mb-2
                        ${hideLabelOnMobile ? 'hidden md:block' : ''}
                    `}
                >
                    {label}
                </label>
            )}

            {/* Select */}
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className={`
                    w-full 
                    border 
                    border-gray-300 
                    rounded-lg 
                    focus:ring-2 
                    focus:ring-orange 
                    focus:border-transparent 
                    transition-all
                    ${sizeClasses[size]}
                    ${selectClassName}
                `.trim().replace(/\s+/g, ' ')}
            >
                {/* All Option */}
                {showAllOption && (
                    <option value={allValue}>
                        {placeholder || allLabel}
                    </option>
                )}

                {/* Options */}
                {optionRenderer
                    ? options.map(optionRenderer)
                    : normalizedOptions.map((option, index) => (
                        <option key={option.value ?? index} value={option.value}>
                            {option.label}
                        </option>
                    ))
                }
            </select>
        </div>
    );
}

/**
 * FilterSelectGroup Component
 * 
 * Helper component for grouping multiple filter selects.
 */
export function FilterSelectGroup({ children, className = '', cols = 'auto' }) {
    const colClasses = {
        'auto': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4',
        '1': 'grid grid-cols-1 gap-3 md:gap-4',
        '2': 'grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4',
        '3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4',
        '4': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4',
    };

    return (
        <div className={`${colClasses[cols] || colClasses['auto']} ${className}`}>
            {children}
        </div>
    );
}

