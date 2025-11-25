import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/**
 * TextInput Component
 * 
 * Enhanced text input with label, error display, helper text, and auto-focus support.
 * Matches the navy/orange theme used across the application.
 * 
 * @param {Object} props
 * @param {string} props.label - Input label text
 * @param {string} props.name - Input name attribute
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message to display
 * @param {boolean} props.required - Whether field is required (shows asterisk)
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.type - Input type (default: 'text')
 * @param {string} props.helperText - Helper text below input
 * @param {boolean} props.isFocused - Auto-focus on mount
 * @param {string} props.className - Additional CSS classes for input
 * @param {string} props.containerClassName - Additional CSS classes for container
 * 
 * @example
 * <TextInput
 *   label="First Name"
 *   name="first_name"
 *   value={data.first_name}
 *   onChange={(e) => setData('first_name', e.target.value)}
 *   error={errors.first_name}
 *   required
 *   placeholder="e.g., John"
 * />
 */
const TextInput = forwardRef(function TextInput(
    {
        label,
        name,
        value,
        onChange,
        error,
        required = false,
        disabled = false,
        placeholder,
        type = 'text',
        helperText,
        isFocused = false,
        className = '',
        containerClassName = '',
        ...props
    },
    ref
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    const inputClasses = `
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

            {/* Input */}
            <input
                {...props}
                ref={localRef}
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                className={inputClasses}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={
                    error ? `${name}-error` : helperText ? `${name}-helper` : undefined
                }
            />

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
});

export default TextInput;

