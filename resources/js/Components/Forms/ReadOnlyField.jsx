import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * ReadOnlyField Component
 * 
 * Display-only field for auto-generated or non-editable values.
 * Includes optional copy-to-clipboard functionality.
 * Used for fields like admission numbers, employee numbers, etc.
 * 
 * @param {Object} props
 * @param {string} props.label - Field label text
 * @param {string} props.value - Field value to display
 * @param {boolean} props.copyable - Enable copy-to-clipboard (default: false)
 * @param {string} props.badge - Optional badge text (e.g., "Auto-generated")
 * @param {string} props.badgeColor - Badge color: 'green', 'blue', 'orange', 'gray' (default: 'green')
 * @param {string} props.helperText - Helper text below field
 * @param {string} props.placeholder - Placeholder when no value
 * @param {string} props.className - Additional CSS classes for container
 * @param {string} props.valueClassName - Additional CSS classes for value display
 * 
 * @example
 * <ReadOnlyField
 *   label="Admission Number"
 *   value="Will be auto-generated (e.g., STU-25-001)"
 *   badge="Auto-generated"
 *   helperText="A unique admission number will be automatically assigned upon registration"
 * />
 * 
 * @example
 * // With copy functionality
 * <ReadOnlyField
 *   label="Student ID"
 *   value={student.admission_number}
 *   copyable
 *   badge="Read-only"
 *   badgeColor="blue"
 * />
 */
export default function ReadOnlyField({
    label,
    value,
    copyable = false,
    badge,
    badgeColor = 'green',
    helperText,
    placeholder = 'Not set',
    className = '',
    valueClassName = '',
}) {
    const [copied, setCopied] = useState(false);

    const badgeColors = {
        green: 'bg-green-100 text-green-700',
        blue: 'bg-blue-100 text-blue-700',
        orange: 'bg-orange-100 text-orange-700',
        gray: 'bg-gray-100 text-gray-700',
        navy: 'bg-navy/10 text-navy',
    };

    const handleCopy = async () => {
        if (!value || !copyable) return;

        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className={className}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}

            {/* Read-only Input */}
            <div className="relative">
                <div
                    className={`
                        w-full 
                        px-4 
                        py-2.5 
                        border 
                        border-gray-300 
                        rounded-lg 
                        bg-gray-50 
                        text-gray-600 
                        cursor-not-allowed
                        ${valueClassName}
                    `.trim().replace(/\s+/g, ' ')}
                >
                    {value || placeholder}
                </div>

                {/* Badge and Copy Button Container */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {/* Copy Button */}
                    {copyable && value && (
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                            title="Copy to clipboard"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-600" />
                            ) : (
                                <Copy className="w-4 h-4 text-gray-500" />
                            )}
                        </button>
                    )}

                    {/* Badge */}
                    {badge && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColors[badgeColor] || badgeColors.green}`}>
                            {badge}
                        </span>
                    )}
                </div>
            </div>

            {/* Helper Text */}
            {helperText && (
                <p className="mt-1 text-xs text-gray-500">
                    {helperText}
                </p>
            )}

            {/* Copy Success Message */}
            {copied && (
                <p className="mt-1 text-xs text-green-600">
                    ✓ Copied to clipboard
                </p>
            )}
        </div>
    );
}

/**
 * ReadOnlyFieldGroup Component
 * 
 * Helper component for displaying multiple read-only fields in a grid.
 */
export function ReadOnlyFieldGroup({ children, className = '', cols = '2' }) {
    const colClasses = {
        '1': 'grid grid-cols-1 gap-6',
        '2': 'grid grid-cols-1 md:grid-cols-2 gap-6',
        '3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    };

    return (
        <div className={`${colClasses[cols] || colClasses['2']} ${className}`}>
            {children}
        </div>
    );
}

/**
 * ReadOnlyInfo Component
 * 
 * Simple label-value pair for displaying information.
 */
export function ReadOnlyInfo({ label, value, className = '' }) {
    return (
        <div className={className}>
            <dt className="text-sm font-medium text-gray-500 mb-1">
                {label}
            </dt>
            <dd className="text-sm text-gray-900">
                {value || '—'}
            </dd>
        </div>
    );
}

