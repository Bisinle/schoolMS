import React from 'react';

/**
 * Card Component
 * 
 * A reusable card wrapper component for consistent card styling across the application.
 * Supports header, body, and footer slots for flexible layouts.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} props.header - Optional header content
 * @param {React.ReactNode} props.footer - Optional footer content
 * @param {string} props.className - Additional CSS classes for the card container
 * @param {string} props.padding - Padding variant: 'none', 'sm', 'md', 'lg' (default: 'md')
 * @param {string} props.shadow - Shadow variant: 'none', 'sm', 'md', 'lg', 'xl' (default: 'sm')
 * @param {boolean} props.border - Whether to show border (default: true)
 * @param {boolean} props.rounded - Whether to round corners (default: true)
 * @param {string} props.hover - Hover effect: 'none', 'shadow', 'lift' (default: 'none')
 * 
 * @example
 * <Card>
 *   <p>Simple card content</p>
 * </Card>
 * 
 * <Card
 *   header={<h3>Card Title</h3>}
 *   footer={<button>Action</button>}
 *   padding="lg"
 *   shadow="md"
 * >
 *   <p>Card body content</p>
 * </Card>
 */
export default function Card({
    children,
    header,
    footer,
    className = '',
    padding = 'md',
    shadow = 'sm',
    border = true,
    rounded = true,
    hover = 'none',
}) {
    // Get padding classes
    const getPaddingClasses = () => {
        const paddingMap = {
            none: '',
            sm: 'p-3 sm:p-4',
            md: 'p-4 sm:p-6',
            lg: 'p-6 sm:p-8',
        };
        return paddingMap[padding] || paddingMap.md;
    };

    // Get shadow classes
    const getShadowClasses = () => {
        const shadowMap = {
            none: '',
            sm: 'shadow-sm',
            md: 'shadow-md',
            lg: 'shadow-lg',
            xl: 'shadow-xl',
        };
        return shadowMap[shadow] || shadowMap.sm;
    };

    // Get hover classes
    const getHoverClasses = () => {
        const hoverMap = {
            none: '',
            shadow: 'hover:shadow-lg transition-shadow duration-300',
            lift: 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
        };
        return hoverMap[hover] || hoverMap.none;
    };

    const borderClasses = border ? 'border border-gray-100' : '';
    const roundedClasses = rounded ? 'rounded-xl' : '';
    const paddingClasses = getPaddingClasses();
    const shadowClasses = getShadowClasses();
    const hoverClasses = getHoverClasses();

    return (
        <div className={`bg-white ${roundedClasses} ${shadowClasses} ${borderClasses} ${hoverClasses} overflow-hidden ${className}`}>
            {/* Header */}
            {header && (
                <div className={`border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white ${padding === 'none' ? 'px-4 sm:px-6 py-4' : paddingClasses}`}>
                    {header}
                </div>
            )}

            {/* Body */}
            <div className={padding === 'none' ? '' : paddingClasses}>
                {children}
            </div>

            {/* Footer */}
            {footer && (
                <div className={`border-t border-gray-100 bg-gray-50 ${padding === 'none' ? 'px-4 sm:px-6 py-4' : paddingClasses}`}>
                    {footer}
                </div>
            )}
        </div>
    );
}

/**
 * CardHeader Component
 * 
 * A pre-styled header component for use with Card.
 */
export function CardHeader({ children, className = '' }) {
    return (
        <h3 className={`text-lg font-semibold text-navy flex items-center ${className}`}>
            {children}
        </h3>
    );
}

/**
 * CardTitle Component
 * 
 * A pre-styled title component for card headers.
 */
export function CardTitle({ children, className = '' }) {
    return (
        <h2 className={`text-xl sm:text-2xl font-black text-gray-900 leading-tight ${className}`}>
            {children}
        </h2>
    );
}

/**
 * CardDescription Component
 * 
 * A pre-styled description component for cards.
 */
export function CardDescription({ children, className = '' }) {
    return (
        <p className={`text-sm text-gray-600 ${className}`}>
            {children}
        </p>
    );
}

