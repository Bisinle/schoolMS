import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchInput Component
 * 
 * Enhanced search input with icon, clear button, and enter-to-submit functionality.
 * Matches the navy/orange theme used across the application.
 * 
 * @param {Object} props
 * @param {string} props.value - Search input value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onSubmit - Optional submit handler (called on Enter key)
 * @param {Function} props.onClear - Optional clear handler (overrides default)
 * @param {string} props.placeholder - Placeholder text (default: "Search...")
 * @param {boolean} props.showClearButton - Show clear button when has value (default: true)
 * @param {string} props.className - Additional CSS classes for container
 * @param {string} props.inputClassName - Additional CSS classes for input
 * @param {boolean} props.autoFocus - Auto-focus on mount (default: false)
 * @param {string} props.size - Input size: 'sm', 'md', 'lg' (default: 'md')
 * 
 * @example
 * <SearchInput
 *   value={search}
 *   onChange={(e) => setSearch(e.target.value)}
 *   placeholder="Search students..."
 * />
 * 
 * @example
 * // With submit handler
 * <SearchInput
 *   value={search}
 *   onChange={(e) => setSearch(e.target.value)}
 *   onSubmit={() => applyFilters()}
 *   placeholder="Search by name, email..."
 * />
 */
export default function SearchInput({
    value,
    onChange,
    onSubmit,
    onClear,
    placeholder = 'Search...',
    showClearButton = true,
    className = '',
    inputClassName = '',
    autoFocus = false,
    size = 'md',
}) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && onSubmit) {
            e.preventDefault();
            onSubmit();
        }
    };

    const handleClear = () => {
        if (onClear) {
            onClear();
        } else {
            onChange({ target: { value: '' } });
        }
    };

    const sizeClasses = {
        sm: 'pl-8 pr-3 py-1.5 text-sm',
        md: 'pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 text-sm',
        lg: 'pl-11 pr-4 py-3 text-base',
    };

    const iconSizeClasses = {
        sm: 'w-4 h-4 left-2.5',
        md: 'w-4 h-4 md:w-5 md:h-5 left-3',
        lg: 'w-5 h-5 left-3.5',
    };

    const clearButtonSizeClasses = {
        sm: 'w-4 h-4 right-2',
        md: 'w-4 h-4 md:w-5 md:h-5 right-3',
        lg: 'w-5 h-5 right-3.5',
    };

    return (
        <div className={`relative ${className}`}>
            {/* Search Icon */}
            <Search 
                className={`
                    absolute 
                    top-1/2 
                    transform 
                    -translate-y-1/2 
                    text-gray-400
                    ${iconSizeClasses[size]}
                `}
            />

            {/* Input */}
            <input
                type="text"
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus={autoFocus}
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
                    ${value && showClearButton ? 'pr-10' : ''}
                    ${inputClassName}
                `.trim().replace(/\s+/g, ' ')}
            />

            {/* Clear Button */}
            {value && showClearButton && (
                <button
                    type="button"
                    onClick={handleClear}
                    className={`
                        absolute 
                        top-1/2 
                        transform 
                        -translate-y-1/2 
                        text-gray-400 
                        hover:text-gray-600 
                        transition-colors
                        ${clearButtonSizeClasses[size]}
                    `}
                    aria-label="Clear search"
                >
                    <X className="w-full h-full" />
                </button>
            )}
        </div>
    );
}

