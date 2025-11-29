import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

/**
 * StatusBadge Component
 * 
 * Specialized badge for attendance and other status displays.
 * Provides consistent styling for status indicators across the app.
 * 
 * @param {Object} props
 * @param {string} props.status - Status value: 'present', 'absent', 'late', 'excused', 'active', 'inactive', 'suspended'
 * @param {string} props.size - Size variant: 'xs', 'sm', 'md', 'lg' (default: 'md')
 * @param {boolean} props.showIcon - Show icon (default: true)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Variant: 'default', 'solid' (default: 'default')
 * 
 * @example
 * <StatusBadge status="present" />
 * <StatusBadge status="absent" size="sm" />
 * <StatusBadge status="active" showIcon={false} />
 */
export default function StatusBadge({
    status,
    size = 'md',
    showIcon = true,
    className = '',
    variant = 'default',
}) {
    const statusConfig = {
        present: {
            bg: 'bg-green-100',
            text: 'text-green-800',
            border: 'border-green-300',
            solidBg: 'bg-green-500',
            solidText: 'text-white',
            icon: CheckCircle,
            emoji: '✓',
            label: 'Present',
        },
        absent: {
            bg: 'bg-red-100',
            text: 'text-red-800',
            border: 'border-red-300',
            solidBg: 'bg-red-500',
            solidText: 'text-white',
            icon: XCircle,
            emoji: '✗',
            label: 'Absent',
        },
        late: {
            bg: 'bg-yellow-100',
            text: 'text-yellow-800',
            border: 'border-yellow-300',
            solidBg: 'bg-yellow-500',
            solidText: 'text-white',
            icon: Clock,
            emoji: '⏰',
            label: 'Late',
        },
        excused: {
            bg: 'bg-blue-100',
            text: 'text-blue-800',
            border: 'border-blue-300',
            solidBg: 'bg-blue-500',
            solidText: 'text-white',
            icon: AlertCircle,
            emoji: '📝',
            label: 'Excused',
        },
        active: {
            bg: 'bg-green-100',
            text: 'text-green-700',
            border: 'border-green-200',
            solidBg: 'bg-green-500',
            solidText: 'text-white',
            icon: CheckCircle,
            emoji: null,
            label: 'Active',
        },
        inactive: {
            bg: 'bg-red-100',
            text: 'text-red-700',
            border: 'border-red-200',
            solidBg: 'bg-red-500',
            solidText: 'text-white',
            icon: XCircle,
            emoji: null,
            label: 'Inactive',
        },
        suspended: {
            bg: 'bg-red-100',
            text: 'text-red-700',
            border: 'border-red-200',
            solidBg: 'bg-red-500',
            solidText: 'text-white',
            icon: XCircle,
            emoji: null,
            label: 'Suspended',
        },
    };

    const sizeClasses = {
        xs: 'px-2 py-0.5 text-xs',
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
    };

    const iconSizes = {
        xs: 'w-3 h-3',
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    const config = statusConfig[status] || {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-300',
        solidBg: 'bg-gray-500',
        solidText: 'text-white',
        icon: AlertCircle,
        emoji: '?',
        label: status,
    };

    const Icon = config.icon;

    // Determine background and text based on variant
    const bgClass = variant === 'solid' ? config.solidBg : config.bg;
    const textClass = variant === 'solid' ? config.solidText : config.text;
    const borderClass = variant === 'solid' ? '' : `border-2 ${config.border}`;

    return (
        <span className={`
            inline-flex items-center rounded-full font-semibold
            ${bgClass} ${textClass} ${borderClass}
            ${sizeClasses[size]}
            ${className}
        `}>
            {showIcon && config.emoji && (
                <span className="mr-1">{config.emoji}</span>
            )}
            {showIcon && !config.emoji && Icon && (
                <Icon className={`${iconSizes[size]} mr-1`} />
            )}
            {config.label}
        </span>
    );
}

