import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * ExpandableCard Component
 * 
 * Expandable card with smooth animations and chevron rotation.
 * Used inside SwipeableListItem for detail views.
 * Extracted from common patterns in mobile list items.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.header - Always visible header content
 * @param {React.ReactNode} props.children - Expandable content (shown when expanded)
 * @param {boolean} props.defaultExpanded - Initial expanded state (default: false)
 * @param {Function} props.onToggle - Callback when toggled (receives new state)
 * @param {boolean} props.showChevron - Show chevron icon (default: true)
 * @param {string} props.chevronPosition - Chevron position: 'right', 'left' (default: 'right')
 * @param {string} props.headerClassName - Additional CSS classes for header
 * @param {string} props.contentClassName - Additional CSS classes for expanded content
 * @param {string} props.className - Additional CSS classes for container
 * @param {boolean} props.disabled - Disable expand/collapse (default: false)
 * @param {boolean} props.preventSwipeToggle - Prevent toggle when swiping (default: false)
 * 
 * @example
 * <ExpandableCard
 *   header={
 *     <div className="flex items-center gap-3">
 *       <h3>Student Name</h3>
 *       <Badge variant="status" value="active" />
 *     </div>
 *   }
 * >
 *   <div className="space-y-2">
 *     <p>Additional details here</p>
 *   </div>
 * </ExpandableCard>
 */
export default function ExpandableCard({
    header,
    children,
    defaultExpanded = false,
    onToggle,
    showChevron = true,
    chevronPosition = 'right',
    headerClassName = '',
    contentClassName = '',
    className = '',
    disabled = false,
    preventSwipeToggle = false,
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const handleToggle = (e) => {
        if (disabled) return;
        
        // Prevent toggle if parent is being swiped
        if (preventSwipeToggle && e.target.closest('[data-swiping="true"]')) {
            return;
        }

        const newState = !isExpanded;
        setIsExpanded(newState);
        onToggle?.(newState);
    };

    const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

    return (
        <div className={className}>
            {/* Header - Always Visible */}
            <div
                className={`cursor-pointer p-4 active:bg-gray-50/50 transition-colors ${headerClassName}`}
                onClick={handleToggle}
            >
                <div className="flex items-start justify-between gap-3">
                    {/* Left Chevron */}
                    {showChevron && chevronPosition === 'left' && (
                        <div className="flex-shrink-0 pt-0.5">
                            <ChevronIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    )}

                    {/* Header Content */}
                    <div className="flex-1 min-w-0">
                        {header}
                    </div>

                    {/* Right Chevron */}
                    {showChevron && chevronPosition === 'right' && (
                        <div className="flex-shrink-0 pt-0.5">
                            <ChevronIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded Content with smooth animation */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className={`border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white ${contentClassName}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}

/**
 * ExpandableCardHeader Component
 *
 * Pre-styled header for ExpandableCard with common layout.
 */
export function ExpandableCardHeader({
    title,
    subtitle,
    badge,
    meta,
    className = ''
}) {
    return (
        <div className={`flex-1 min-w-0 ${className}`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                    {title}
                </h3>
                {badge && (
                    <div className="flex-shrink-0">
                        {badge}
                    </div>
                )}
            </div>
            {subtitle && (
                <p className="text-sm text-gray-600 truncate mb-1">
                    {subtitle}
                </p>
            )}
            {meta && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {meta}
                </div>
            )}
        </div>
    );
}

/**
 * ExpandableCardContent Component
 *
 * Pre-styled content area for ExpandableCard.
 */
export function ExpandableCardContent({ children, className = '' }) {
    return (
        <div className={`px-4 pb-4 pt-4 space-y-3 ${className}`}>
            {children}
        </div>
    );
}

