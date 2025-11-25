import React from 'react';
import { Link } from '@inertiajs/react';
import { Save, X, Loader2 } from 'lucide-react';

/**
 * FormActions Component
 * 
 * Consistent submit/cancel button layout with loading state handling.
 * Matches the navy/orange theme used across the application.
 * 
 * @param {Object} props
 * @param {string} props.submitLabel - Submit button text (default: "Save")
 * @param {string} props.cancelLabel - Cancel button text (default: "Cancel")
 * @param {string} props.cancelHref - Cancel button URL (required)
 * @param {boolean} props.processing - Whether form is processing (shows loading state)
 * @param {boolean} props.canSubmit - Whether submit is allowed (default: true)
 * @param {Function} props.onCancel - Optional cancel handler (overrides cancelHref)
 * @param {boolean} props.showSubmitIcon - Show save icon on submit button (default: true)
 * @param {boolean} props.showCancelIcon - Show X icon on cancel button (default: false)
 * @param {string} props.submitVariant - Submit button color: 'orange', 'blue', 'green' (default: 'orange')
 * @param {string} props.className - Additional CSS classes for container
 * @param {string} props.alignment - Button alignment: 'left', 'center', 'right', 'between' (default: 'right')
 * @param {boolean} props.showBorder - Show top border (default: true)
 * 
 * @example
 * <FormActions
 *   submitLabel="Register Student"
 *   cancelHref="/students"
 *   processing={processing}
 * />
 * 
 * @example
 * // Custom variant and alignment
 * <FormActions
 *   submitLabel="Create"
 *   cancelHref="/teachers"
 *   processing={processing}
 *   submitVariant="blue"
 *   alignment="between"
 * />
 * 
 * @example
 * // With custom cancel handler
 * <FormActions
 *   submitLabel="Save Changes"
 *   onCancel={() => router.visit('/dashboard')}
 *   processing={processing}
 *   canSubmit={!hasErrors}
 * />
 */
export default function FormActions({
    submitLabel = 'Save',
    cancelLabel = 'Cancel',
    cancelHref,
    processing = false,
    canSubmit = true,
    onCancel,
    showSubmitIcon = true,
    showCancelIcon = false,
    submitVariant = 'orange',
    className = '',
    alignment = 'right',
    showBorder = true,
}) {
    const alignmentClasses = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
        between: 'justify-between',
    };

    const submitVariants = {
        orange: 'bg-orange hover:bg-orange-dark',
        blue: 'bg-blue-600 hover:bg-blue-700',
        green: 'bg-green-600 hover:bg-green-700',
        navy: 'bg-navy hover:bg-navy-dark',
    };

    const containerClasses = `
        flex 
        items-center 
        gap-3 
        pt-4 
        ${showBorder ? 'border-t border-gray-200' : ''}
        ${alignmentClasses[alignment] || alignmentClasses.right}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    const submitClasses = `
        inline-flex 
        items-center 
        px-6 
        py-2.5 
        text-sm 
        font-medium 
        text-white 
        rounded-lg 
        transition-colors
        disabled:opacity-50 
        disabled:cursor-not-allowed
        ${submitVariants[submitVariant] || submitVariants.orange}
    `.trim().replace(/\s+/g, ' ');

    const cancelClasses = `
        px-6 
        py-2.5 
        text-sm 
        font-medium 
        text-gray-700 
        bg-white 
        border 
        border-gray-300 
        rounded-lg 
        hover:bg-gray-50 
        transition-colors
    `.trim().replace(/\s+/g, ' ');

    const isDisabled = processing || !canSubmit;

    return (
        <div className={containerClasses}>
            {/* Cancel Button */}
            {onCancel ? (
                <button
                    type="button"
                    onClick={onCancel}
                    className={cancelClasses}
                    disabled={processing}
                >
                    {showCancelIcon && <X className="w-4 h-4 mr-2" />}
                    {cancelLabel}
                </button>
            ) : cancelHref ? (
                <Link
                    href={cancelHref}
                    className={cancelClasses}
                >
                    {showCancelIcon && <X className="w-4 h-4 mr-2" />}
                    {cancelLabel}
                </Link>
            ) : null}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isDisabled}
                className={submitClasses}
            >
                {processing ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        {showSubmitIcon && <Save className="w-4 h-4 mr-2" />}
                        {submitLabel}
                    </>
                )}
            </button>
        </div>
    );
}

/**
 * FormActionsGroup Component
 * 
 * Helper component for custom action button groups.
 */
export function FormActionsGroup({ children, className = '', alignment = 'right' }) {
    const alignmentClasses = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
        between: 'justify-between',
    };

    return (
        <div className={`flex items-center gap-3 pt-4 border-t border-gray-200 ${alignmentClasses[alignment]} ${className}`}>
            {children}
        </div>
    );
}

