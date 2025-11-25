import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

/**
 * TextareaInput Component
 * 
 * Enhanced textarea with label, error display, auto-resize, and character count.
 * Matches the navy/orange theme used across the application.
 * 
 * @param {Object} props
 * @param {string} props.label - Textarea label text
 * @param {string} props.name - Textarea name attribute
 * @param {string} props.value - Textarea value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message to display
 * @param {boolean} props.required - Whether field is required (shows asterisk)
 * @param {boolean} props.disabled - Whether textarea is disabled
 * @param {string} props.placeholder - Placeholder text
 * @param {number} props.rows - Number of rows (default: 4)
 * @param {boolean} props.autoResize - Auto-resize based on content (default: false)
 * @param {number} props.maxLength - Maximum character count
 * @param {boolean} props.showCharCount - Show character counter (default: false if no maxLength)
 * @param {string} props.helperText - Helper text below textarea
 * @param {boolean} props.isFocused - Auto-focus on mount
 * @param {string} props.className - Additional CSS classes for textarea
 * @param {string} props.containerClassName - Additional CSS classes for container
 * 
 * @example
 * <TextareaInput
 *   label="Description"
 *   name="description"
 *   value={data.description}
 *   onChange={(e) => setData('description', e.target.value)}
 *   error={errors.description}
 *   rows={6}
 *   maxLength={500}
 *   showCharCount
 *   placeholder="Enter description..."
 * />
 * 
 * @example
 * // With auto-resize
 * <TextareaInput
 *   label="Notes"
 *   name="notes"
 *   value={data.notes}
 *   onChange={(e) => setData('notes', e.target.value)}
 *   autoResize
 *   rows={3}
 * />
 */
const TextareaInput = forwardRef(function TextareaInput(
    {
        label,
        name,
        value,
        onChange,
        error,
        required = false,
        disabled = false,
        placeholder,
        rows = 4,
        autoResize = false,
        maxLength,
        showCharCount,
        helperText,
        isFocused = false,
        className = '',
        containerClassName = '',
        ...props
    },
    ref
) {
    const localRef = useRef(null);
    const [charCount, setCharCount] = useState(value?.length || 0);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    // Auto-resize functionality
    useEffect(() => {
        if (autoResize && localRef.current) {
            localRef.current.style.height = 'auto';
            localRef.current.style.height = `${localRef.current.scrollHeight}px`;
        }
    }, [value, autoResize]);

    // Update character count
    useEffect(() => {
        setCharCount(value?.length || 0);
    }, [value]);

    const handleChange = (e) => {
        if (maxLength && e.target.value.length > maxLength) {
            return;
        }
        onChange?.(e);
    };

    const textareaClasses = `
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
        resize-${autoResize ? 'none' : 'vertical'}
        ${error ? 'border-red-500' : 'border-gray-300'}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    const shouldShowCharCount = showCharCount || maxLength;

    return (
        <div className={containerClassName}>
            {/* Label and Character Count */}
            <div className="flex items-center justify-between mb-2">
                {label && (
                    <label 
                        htmlFor={name} 
                        className="block text-sm font-medium text-gray-700"
                    >
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                {shouldShowCharCount && (
                    <span className={`text-xs ${charCount > (maxLength || Infinity) * 0.9 ? 'text-orange' : 'text-gray-500'}`}>
                        {charCount}{maxLength ? `/${maxLength}` : ''}
                    </span>
                )}
            </div>

            {/* Textarea */}
            <textarea
                {...props}
                ref={localRef}
                id={name}
                name={name}
                value={value}
                onChange={handleChange}
                disabled={disabled}
                placeholder={placeholder}
                rows={rows}
                maxLength={maxLength}
                className={textareaClasses}
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

export default TextareaInput;

