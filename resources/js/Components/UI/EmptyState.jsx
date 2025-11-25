import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * EmptyState Component
 * 
 * A reusable empty state component for tables, lists, and search results.
 * Displays an icon, title, message, and optional action button.
 * Matches the navy/orange theme of the application.
 * 
 * @param {Object} props
 * @param {React.Component} props.icon - Lucide icon component
 * @param {string} props.title - Main heading text
 * @param {string} props.message - Descriptive message text
 * @param {Object} props.action - Optional action button configuration
 * @param {string} props.action.label - Button label
 * @param {string} props.action.href - Button link URL
 * @param {Function} props.action.onClick - Button click handler (alternative to href)
 * @param {string} props.action.variant - Button variant: 'primary', 'secondary' (default: 'primary')
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.iconColor - Icon background color (default: 'gray')
 * 
 * @example
 * <EmptyState
 *   icon={Users}
 *   title="No students found"
 *   message="Try adjusting your filters to see more students"
 *   action={{
 *     label: "Add Student",
 *     href: "/students/create"
 *   }}
 * />
 */
export default function EmptyState({
    icon: Icon,
    title,
    message,
    action,
    size = 'md',
    className = '',
    iconColor = 'gray',
}) {
    // Get size classes
    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return {
                    container: 'py-8',
                    icon: 'w-12 h-12',
                    iconWrapper: 'w-16 h-16 mb-3',
                    title: 'text-base',
                    message: 'text-sm',
                };
            case 'md':
                return {
                    container: 'py-12',
                    icon: 'w-16 h-16',
                    iconWrapper: 'w-20 h-20 mb-4',
                    title: 'text-lg',
                    message: 'text-sm',
                };
            case 'lg':
                return {
                    container: 'py-16',
                    icon: 'w-20 h-20',
                    iconWrapper: 'w-24 h-24 mb-6',
                    title: 'text-xl',
                    message: 'text-base',
                };
            default:
                return {
                    container: 'py-12',
                    icon: 'w-16 h-16',
                    iconWrapper: 'w-20 h-20 mb-4',
                    title: 'text-lg',
                    message: 'text-sm',
                };
        }
    };

    const sizeClasses = getSizeClasses();

    // Get icon color classes
    const getIconColorClasses = () => {
        const colorMap = {
            gray: 'bg-gray-100 text-gray-300',
            orange: 'bg-orange-100 text-orange-300',
            navy: 'bg-navy-100 text-navy-300',
            blue: 'bg-blue-100 text-blue-300',
            green: 'bg-green-100 text-green-300',
            red: 'bg-red-100 text-red-300',
            purple: 'bg-purple-100 text-purple-300',
        };
        return colorMap[iconColor] || colorMap.gray;
    };

    // Get button classes
    const getButtonClasses = () => {
        if (!action) return '';
        
        const variant = action.variant || 'primary';
        
        if (variant === 'primary') {
            return 'bg-orange hover:bg-orange-600 text-white shadow-md hover:shadow-lg';
        }
        return 'bg-white hover:bg-gray-50 text-navy border border-gray-300';
    };

    const ActionButton = () => {
        if (!action) return null;

        const buttonContent = (
            <button
                onClick={action.onClick}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${getButtonClasses()}`}
            >
                {action.label}
            </button>
        );

        if (action.href) {
            return <Link href={action.href}>{buttonContent}</Link>;
        }

        return buttonContent;
    };

    return (
        <div className={`text-center ${sizeClasses.container} ${className}`}>
            {/* Icon */}
            <div className={`${sizeClasses.iconWrapper} ${getIconColorClasses()} rounded-2xl flex items-center justify-center mx-auto`}>
                <Icon className={sizeClasses.icon} />
            </div>

            {/* Title */}
            <h3 className={`${sizeClasses.title} font-bold text-gray-900 mb-2`}>
                {title}
            </h3>

            {/* Message */}
            <p className={`${sizeClasses.message} text-gray-600 mb-6 max-w-md mx-auto`}>
                {message}
            </p>

            {/* Action Button */}
            <ActionButton />
        </div>
    );
}

