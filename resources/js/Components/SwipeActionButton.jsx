import React from 'react';
import { Link } from '@inertiajs/react';
import { getActionColor } from '@/Utils/swipeActions';

/**
 * SwipeActionButton Component
 * 
 * Centralized swipe action button for mobile list items across all School Admin pages.
 * Supports both Link (navigation) and button (onClick) variants with consistent styling.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon component to display (e.g., <Eye />, <Edit />)
 * @param {string} [props.href] - Navigation URL (for Link variant)
 * @param {Function} [props.onClick] - Click handler (for button variant)
 * @param {'small'|'medium'|'large'} [props.size='medium'] - Button size variant
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.preserveScroll] - Preserve scroll position on navigation (Link only)
 * 
 * @example
 * // Link variant
 * <SwipeActionButton 
 *   icon={Eye}
 *   href={`/students/${student.id}`}
 *   onClick={() => setSwipeAction(null)}
 * />
 * 
 * @example
 * // Button variant
 * <SwipeActionButton 
 *   icon={Trash2}
 *   onClick={() => {
 *     onDelete(item);
 *     setSwipeAction(null);
 *   }}
 *   size="large"
 * />
 * 
 * @example
 * <SwipeActionButton 
 *   icon={Phone}
 *   href={`tel:${phone}`}
 *   onClick={() => setSwipeAction(null)}
 * />
 */
export default function SwipeActionButton({
    icon: Icon,
    label,
    href,
    onClick,
    size = 'medium',
    color, // Optional: can override auto-determined color
    className = '',
    preserveScroll = false,
    ...props
}) {
    // Size variants with padding and border radius
    const sizeConfig = {
        small: {
            padding: 'p-2',
            radius: 'rounded-lg',
            iconSize: 'w-4 h-4',
            iconSizePx: 16,
            shadow: '',
        },
        medium: {
            padding: 'p-3',
            radius: 'rounded-xl',
            iconSize: 'w-5 h-5',
            iconSizePx: 20,
            shadow: '',
        },
        large: {
            padding: 'p-4',
            radius: 'rounded-2xl',
            iconSize: 'w-6 h-6',
            iconSizePx: 24,
            shadow: 'shadow-lg',
        },
    };

    const config = sizeConfig[size];

    // Auto-determine color from label, or use provided color as override
    const buttonColor = color || getActionColor(label);

    // Color variants for buttons
    const colorConfig = {
        blue: {
            bg: 'bg-blue-500 hover:bg-blue-600',
            icon: 'text-white',
        },
        indigo: {
            bg: 'bg-indigo-500 hover:bg-indigo-600',
            icon: 'text-white',
        },
        green: {
            bg: 'bg-green-500 hover:bg-green-600',
            icon: 'text-white',
        },
        red: {
            bg: 'bg-red-500 hover:bg-red-600',
            icon: 'text-white',
        },
        yellow: {
            bg: 'bg-yellow-500 hover:bg-yellow-600',
            icon: 'text-gray-800', // Dark text for yellow background
        },
        orange: {
            bg: 'bg-orange-500 hover:bg-orange-600',
            icon: 'text-white',
        },
        purple: {
            bg: 'bg-purple-500 hover:bg-purple-600',
            icon: 'text-white',
        },
    };

    const colors = colorConfig[buttonColor] || colorConfig.blue;

    // Base classes (consistent across all buttons)
    const baseClasses = `
        ${config.padding}
        ${config.radius}
        ${config.shadow}
        ${colors.bg}
        active:scale-95
        transition-all
        inline-flex
        items-center
        justify-center
        shadow-md
    `.trim().replace(/\s+/g, ' ');

    // Combine classes
    const buttonClasses = `${baseClasses} ${className}`.trim();

    // Icon with proper sizing and color
    // Handle both component (function/forwardRef) and element (JSX) formats
    const isComponent = Icon && (
        typeof Icon === 'function' ||
        (typeof Icon === 'object' && Icon.$$typeof === Symbol.for('react.forward_ref'))
    );

    const iconElement = Icon ? (
        isComponent ? (
            <Icon
                size={config.iconSizePx}
                className={colors.icon}
                strokeWidth={2.5}
                aria-hidden="true"
            />
        ) : (
            // If Icon is already a JSX element, clone it with proper classes
            React.isValidElement(Icon) ? (
                React.cloneElement(Icon, {
                    size: config.iconSizePx,
                    className: `${colors.icon} ${Icon.props?.className || ''}`,
                    strokeWidth: 2.5,
                    'aria-hidden': true
                })
            ) : null
        )
    ) : null;

    // If href starts with 'tel:', 'mailto:', or 'http', use native anchor
    const isExternalLink = href && (
        href.startsWith('tel:') || 
        href.startsWith('mailto:') || 
        href.startsWith('http://') || 
        href.startsWith('https://')
    );

    // Render as native anchor for tel/mailto/external links
    if (isExternalLink) {
        return (
            <a
                href={href}
                onClick={onClick}
                className={buttonClasses}
                {...props}
            >
                {iconElement}
            </a>
        );
    }

    // Render as Inertia Link for internal navigation
    if (href) {
        return (
            <Link
                href={href}
                onClick={onClick}
                className={buttonClasses}
                preserveScroll={preserveScroll}
                {...props}
            >
                {iconElement}
            </Link>
        );
    }

    // Render as button for onClick-only actions
    return (
        <button
            onClick={onClick}
            className={buttonClasses}
            type="button"
            {...props}
        >
            {iconElement}
        </button>
    );
}