import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * FormSection Component
 * 
 * Groups related form fields with consistent spacing and styling.
 * Supports optional collapsible functionality.
 * Matches the navy/orange theme used across the application.
 * 
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.description - Optional section description
 * @param {React.ReactNode} props.children - Form fields to group
 * @param {boolean} props.collapsible - Whether section can be collapsed (default: false)
 * @param {boolean} props.defaultExpanded - Initial expanded state for collapsible (default: true)
 * @param {string} props.className - Additional CSS classes for container
 * @param {string} props.titleClassName - Additional CSS classes for title
 * @param {boolean} props.showBorder - Show bottom border (default: true)
 * @param {string} props.gridCols - Grid columns for fields: '1', '2', '3' (default: '2')
 * 
 * @example
 * <FormSection
 *   title="Personal Information"
 *   description="Enter the student's personal details"
 * >
 *   <TextInput label="First Name" ... />
 *   <TextInput label="Last Name" ... />
 *   <SelectInput label="Gender" ... />
 * </FormSection>
 * 
 * @example
 * // Collapsible section
 * <FormSection
 *   title="Additional Information"
 *   collapsible
 *   defaultExpanded={false}
 * >
 *   <TextInput label="Notes" ... />
 * </FormSection>
 * 
 * @example
 * // Custom grid
 * <FormSection
 *   title="Contact Information"
 *   gridCols="3"
 * >
 *   <TextInput label="Email" ... />
 *   <TextInput label="Phone" ... />
 *   <TextInput label="Address" ... />
 * </FormSection>
 */
export default function FormSection({
    title,
    description,
    children,
    collapsible = false,
    defaultExpanded = true,
    className = '',
    titleClassName = '',
    showBorder = true,
    gridCols = '2',
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const gridClasses = {
        '1': 'grid grid-cols-1 gap-6',
        '2': 'grid grid-cols-1 md:grid-cols-2 gap-6',
        '3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    };

    const gridClassName = gridClasses[gridCols] || gridClasses['2'];

    const handleToggle = () => {
        if (collapsible) {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div className={className}>
            {/* Section Header */}
            <div 
                className={`
                    mb-4 
                    pb-2 
                    ${showBorder ? 'border-b border-gray-200' : ''}
                    ${collapsible ? 'cursor-pointer select-none' : ''}
                `}
                onClick={handleToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className={`text-md font-semibold text-gray-900 ${titleClassName}`}>
                            {title}
                        </h3>
                        {description && (
                            <p className="mt-1 text-sm text-gray-600">
                                {description}
                            </p>
                        )}
                    </div>
                    {collapsible && (
                        <div className="ml-4">
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Section Content */}
            {(!collapsible || isExpanded) && (
                <div className={gridClassName}>
                    {children}
                </div>
            )}
        </div>
    );
}

/**
 * FormRow Component
 * 
 * Helper component for custom row layouts within FormSection.
 */
export function FormRow({ children, className = '', cols = 'auto' }) {
    const colClasses = {
        'auto': 'grid grid-cols-1 md:grid-cols-2 gap-6',
        '1': 'grid grid-cols-1 gap-6',
        '2': 'grid grid-cols-1 md:grid-cols-2 gap-6',
        '3': 'grid grid-cols-1 md:grid-cols-3 gap-6',
        '4': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
    };

    return (
        <div className={`${colClasses[cols] || colClasses['auto']} ${className}`}>
            {children}
        </div>
    );
}

/**
 * FormField Component
 * 
 * Helper component for full-width fields within a grid.
 */
export function FormField({ children, className = '', span = 'full' }) {
    const spanClasses = {
        'full': 'md:col-span-2',
        'half': '',
        '2': 'md:col-span-2',
        '3': 'md:col-span-3',
    };

    return (
        <div className={`${spanClasses[span] || ''} ${className}`}>
            {children}
        </div>
    );
}

