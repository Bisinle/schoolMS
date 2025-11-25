import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import SwipeActionButton from '@/Components/SwipeActionButton';

/**
 * SwipeableListItem Component
 * 
 * CRITICAL COMPONENT - Used in 8+ index pages for mobile list items.
 * Provides swipe-to-reveal actions with smooth animations.
 * Extracted from common patterns in Students, Teachers, Documents, etc.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The main card content (always visible)
 * @param {Object} props.primaryAction - Left swipe action configuration
 * @param {React.Component} props.primaryAction.icon - Icon component
 * @param {string} props.primaryAction.label - Action label (for accessibility)
 * @param {string} props.primaryAction.color - Gradient color: 'blue', 'red', 'green', 'orange', 'purple'
 * @param {Function|string} props.primaryAction.onClick - Click handler or href
 * @param {Array} props.primaryAction.buttons - Array of action buttons (alternative to single onClick)
 * @param {Object} props.secondaryAction - Right swipe action configuration (same structure as primaryAction)
 * @param {Function} props.onSwipeLeft - Callback when swiped left
 * @param {Function} props.onSwipeRight - Callback when swiped right
 * @param {boolean} props.disabled - Disable swipe actions
 * @param {number} props.swipeDelta - Swipe sensitivity (default: 60)
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * <SwipeableListItem
 *   primaryAction={{
 *     color: 'blue',
 *     buttons: [
 *       { icon: Eye, href: `/students/${id}` },
 *       { icon: Edit, href: `/students/${id}/edit` },
 *       { icon: Trash2, onClick: () => handleDelete() }
 *     ]
 *   }}
 *   secondaryAction={{
 *     color: 'green',
 *     buttons: [
 *       { icon: FileText, onClick: () => generateReport() }
 *     ]
 *   }}
 * >
 *   <div>Your card content here</div>
 * </SwipeableListItem>
 */
export default function SwipeableListItem({
    children,
    primaryAction,
    secondaryAction,
    primaryActions, // Support plural format (array of buttons)
    secondaryActions, // Support plural format (array of buttons)
    onSwipeLeft,
    onSwipeRight,
    disabled = false,
    swipeDelta = 60,
    className = '',
}) {
    const [swipeAction, setSwipeAction] = useState(null);

    // Normalize actions - support both singular and plural formats
    const normalizedPrimaryAction = primaryAction || (primaryActions ? {
        buttons: primaryActions,
        color: primaryActions[0]?.color || 'blue'
    } : null);

    const normalizedSecondaryAction = secondaryAction || (secondaryActions ? {
        buttons: secondaryActions,
        color: secondaryActions[0]?.color || 'green'
    } : null);

    const handlers = useSwipeable({
        onSwipedLeft: () => {
            if (!disabled && normalizedPrimaryAction) {
                setSwipeAction('primary');
                onSwipeLeft?.();
            }
        },
        onSwipedRight: () => {
            if (!disabled && normalizedSecondaryAction) {
                setSwipeAction('secondary');
                onSwipeRight?.();
            }
        },
        onSwiping: () => {},
        trackMouse: false,
        preventScrollOnSwipe: false,
        delta: swipeDelta,
    });

    // Get gradient color classes
    const getGradientClasses = (color) => {
        const gradients = {
            blue: 'bg-gradient-to-l from-blue-500 to-indigo-600',
            red: 'bg-gradient-to-r from-red-500 to-orange-500',
            green: 'bg-gradient-to-r from-green-500 to-emerald-500',
            orange: 'bg-gradient-to-r from-orange-500 to-red-500',
            purple: 'bg-gradient-to-l from-purple-500 to-indigo-600',
            indigo: 'bg-gradient-to-l from-indigo-500 to-blue-600',
        };
        return gradients[color] || gradients.blue;
    };

    // Calculate translation distance based on number of buttons
    const getTranslateDistance = (action, direction) => {
        if (!action?.buttons) return 0;
        const buttonCount = action.buttons.length;
        const baseDistance = 20; // Base distance per button
        const distance = baseDistance * buttonCount + (buttonCount - 1) * 8; // 8px gap between buttons
        return direction === 'left' ? `-${distance + 24}` : distance + 24; // 24px for padding
    };

    const primaryTranslate = getTranslateDistance(normalizedPrimaryAction, 'left');
    const secondaryTranslate = getTranslateDistance(normalizedSecondaryAction, 'right');

    return (
        <div className={`relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 mb-3 ${className}`}>
            {/* Primary Action Background (Left Swipe) */}
            {swipeAction === 'primary' && normalizedPrimaryAction && (
                <div className={`absolute inset-0 ${getGradientClasses(normalizedPrimaryAction.color)} flex items-center justify-end px-4 gap-2 z-10`}>
                    {normalizedPrimaryAction.buttons?.map((button, index) => (
                        <SwipeActionButton
                            key={index}
                            icon={button.icon}
                            href={button.href}
                            onClick={() => {
                                button.onClick?.();
                                setSwipeAction(null);
                            }}
                            size={button.size || 'medium'}
                        />
                    ))}
                </div>
            )}

            {/* Secondary Action Background (Right Swipe) */}
            {swipeAction === 'secondary' && normalizedSecondaryAction && (
                <div className={`absolute inset-0 ${getGradientClasses(normalizedSecondaryAction.color)} flex items-center justify-start px-4 gap-2 z-10`}>
                    {normalizedSecondaryAction.buttons?.map((button, index) => (
                        <SwipeActionButton
                            key={index}
                            icon={button.icon}
                            href={button.href}
                            onClick={() => {
                                button.onClick?.();
                                setSwipeAction(null);
                            }}
                            size={button.size || 'medium'}
                        />
                    ))}
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? `translate-x-[${primaryTranslate}px]` :
                    swipeAction === 'secondary' ? `translate-x-[${secondaryTranslate}px]` : ''
                }`}
                style={{
                    transform: swipeAction === 'primary' 
                        ? `translateX(${primaryTranslate}px)` 
                        : swipeAction === 'secondary' 
                        ? `translateX(${secondaryTranslate}px)` 
                        : 'translateX(0)',
                }}
                onClick={() => {
                    if (swipeAction) {
                        setSwipeAction(null);
                    }
                }}
            >
                {children}
            </div>
        </div>
    );
}

