import React from 'react';
import {
    getStatusBadge,
    getCategoryBadge,
    getDifficultyBadge,
    getReadingTypeBadge,
    getRoleBadge,
    getGenderBadge,
    getLevelBadge,
    getDocumentStatusBadge,
    getInvoiceStatusBadge,
} from '@/Utils/badges';

/**
 * Badge Component
 * 
 * A reusable badge component that uses the centralized badge utilities.
 * Supports multiple variants for different use cases.
 * 
 * @param {Object} props
 * @param {string} props.variant - Badge variant: 'status', 'category', 'difficulty', 'readingType', 'role', 'gender', 'level', 'documentStatus', 'invoiceStatus'
 * @param {string} props.value - The value to determine badge styling
 * @param {string} props.label - Optional custom label (defaults to value)
 * @param {string} props.className - Additional CSS classes to apply
 * @param {string} props.size - Size variant: 'xs', 'sm', 'md', 'lg' (default: 'sm')
 * 
 * @example
 * <Badge variant="status" value="active" />
 * <Badge variant="role" value="admin" label="Administrator" />
 * <Badge variant="category" value="academic" className="ml-2" />
 */
export default function Badge({ 
    variant = 'status', 
    value, 
    label, 
    className = '',
    size = 'sm'
}) {
    // Get badge classes based on variant
    const getBadgeClasses = () => {
        switch (variant) {
            case 'status':
                return getStatusBadge(value);
            case 'category':
                return getCategoryBadge(value);
            case 'difficulty':
                return getDifficultyBadge(value);
            case 'readingType':
                return getReadingTypeBadge(value);
            case 'role':
                return getRoleBadge(value);
            case 'gender':
                return getGenderBadge(value);
            case 'level':
                return getLevelBadge(value);
            case 'documentStatus':
                return getDocumentStatusBadge(value);
            case 'invoiceStatus':
                return getInvoiceStatusBadge(value);
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    // Get size classes
    const getSizeClasses = () => {
        switch (size) {
            case 'xs':
                return 'px-2 py-0.5 text-xs';
            case 'sm':
                return 'px-2.5 py-1 text-xs';
            case 'md':
                return 'px-3 py-1.5 text-sm';
            case 'lg':
                return 'px-4 py-2 text-base';
            default:
                return 'px-2.5 py-1 text-xs';
        }
    };

    // Format label
    const getLabel = () => {
        if (label) return label;
        
        // Auto-format common values
        if (value === 'active') return 'Active';
        if (value === 'inactive') return 'Inactive';
        if (value === 'new_learning') return 'New Learning';
        if (value === 'revision') return 'Revision';
        if (value === 'subac') return 'Subac';
        if (value === 'very_well') return 'Very Well';
        if (value === 'middle') return 'Middle';
        if (value === 'difficult') return 'Difficult';
        if (value === 'co-curricular') return 'Co-Curricular';

        // Capitalize first letter and replace underscores
        // Handle non-string values (numbers, booleans, etc.)
        const stringValue = value != null ? String(value) : '';
        return stringValue
            ? stringValue.charAt(0).toUpperCase() + stringValue.slice(1).replace(/_/g, ' ')
            : '';
    };

    return (
        <span 
            className={`inline-flex items-center justify-center rounded-full font-semibold ${getBadgeClasses()} ${getSizeClasses()} ${className}`}
        >
            {getLabel()}
        </span>
    );
}

