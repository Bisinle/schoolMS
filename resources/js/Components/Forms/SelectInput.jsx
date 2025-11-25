import React from 'react';

/**
 * SelectInput Component
 * 
 * Enhanced select dropdown with label, error display, and flexible options format.
 * Matches the navy/orange theme used across the application.
 * 
 * @param {Object} props
 * @param {string} props.label - Select label text
 * @param {string} props.name - Select name attribute
 * @param {string|number} props.value - Selected value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message to display
 * @param {boolean} props.required - Whether field is required (shows asterisk)
 * @param {boolean} props.disabled - Whether select is disabled
 * @param {Array} props.options - Options array (format: [{ value, label }] or simple array)
 * @param {string} props.placeholder - Placeholder option text (default: "Select...")
 * @param {boolean} props.showPlaceholder - Show placeholder option (default: true)
 * @param {string} props.helperText - Helper text below select
 * @param {string} props.className - Additional CSS classes for select
 * @param {string} props.containerClassName - Additional CSS classes for container
 * @param {Function} props.optionRenderer - Custom option renderer function
 * 
 * @example
 * // With object options
 * <SelectInput
 *   label="Grade"
 *   name="grade_id"
 *   value={data.grade_id}
 *   onChange={(e) => setData('grade_id', e.target.value)}
 *   options={grades.map(g => ({ value: g.id, label: g.name }))}
 *   error={errors.grade_id}
 *   required
 * />
 * 
 * @example
 * // With simple array
 * <SelectInput
 *   label="Status"
 *   name="status"
 *   value={data.status}
 *   onChange={(e) => setData('status', e.target.value)}
 *   options={['active', 'inactive']}
 * />
 * 
 * @example
 * // With custom option renderer
 * <SelectInput
 *   label="Guardian"
 *   name="guardian_id"
 *   value={data.guardian_id}
 *   onChange={(e) => setData('guardian_id', e.target.value)}
 *   options={guardians}
 *   optionRenderer={(guardian) => (
 *     <option key={guardian.id} value={guardian.id}>
 *       {guardian.guardian_number} - {guardian.name} ({guardian.relationship})
 *     </option>
 *   )}
 * />
 */
export default function SelectInput({
    label,
    name,
    value,
    onChange,
    error,
    required = false,
    disabled = false,
    options = [],
    placeholder = 'Select...',
    showPlaceholder = true,
    helperText,
    className = '',
    containerClassName = '',
    optionRenderer,
    ...props
}) {
    const selectClasses = `
        w-full 
        px-4 
        py-2.5 
        border 
        rounded-lg 
        focus:ring-2 
        focus:ring-orange 
        focus:border-transparent 
        transition-all
        disabled:bg-gray-50
        disabled:text-gray-500
        disabled:cursor-not-allowed
        ${error ? 'border-red-500' : 'border-gray-300'}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    // Normalize options to { value, label } format
    const normalizedOptions = options.map(option => {
        if (typeof option === 'object' && option !== null) {
            return option;
        }
        return { value: option, label: String(option).charAt(0).toUpperCase() + String(option).slice(1) };
    });

    return (
        <div className={containerClassName}>
            {/* Label */}
            {label && (
                <label 
                    htmlFor={name} 
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Select */}
            <select
                {...props}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={selectClasses}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={
                    error ? `${name}-error` : helperText ? `${name}-helper` : undefined
                }
            >
                {/* Placeholder Option */}
                {showPlaceholder && (
                    <option value="">{placeholder}</option>
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

            {/* Error Message */}
            {error && (
                <p 
                    id={`${name}-error`}
                    className="mt-1 text-sm text-red-600"
                >
                    {error}
                </p>
            )}

            {/* Helper Text */}
            {!error && helperText && (
                <p 
                    id={`${name}-helper`}
                    className="mt-1 text-xs text-gray-500"
                >
                    {helperText}
                </p>
            )}
        </div>
    );
}

