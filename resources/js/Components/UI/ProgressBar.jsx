import React from 'react';

/**
 * ProgressBar Component
 * 
 * A reusable progress bar component extracted from Dashboard.jsx.
 * Displays a horizontal progress indicator with customizable colors and labels.
 * 
 * @param {Object} props
 * @param {number} props.value - Current progress value
 * @param {number} props.max - Maximum value (default: 100)
 * @param {string} props.color - Color name for the progress bar (e.g., 'orange', 'green', 'blue')
 * @param {boolean} props.showLabel - Whether to show percentage label (default: false)
 * @param {string} props.labelPosition - Label position: 'inside', 'outside', 'top' (default: 'outside')
 * @param {string} props.size - Size variant: 'xs', 'sm', 'md', 'lg' (default: 'sm')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.animated - Whether to animate the progress (default: true)
 * @param {string} props.bgColor - Background color (default: 'gray-200')
 * 
 * @example
 * <ProgressBar value={75} max={100} color="orange" showLabel />
 * <ProgressBar value={45} color="green" size="md" />
 */
export default function ProgressBar({
    value = 0,
    max = 100,
    color = 'orange',
    showLabel = false,
    labelPosition = 'outside',
    size = 'sm',
    className = '',
    animated = true,
    bgColor = 'gray-200',
}) {
    // Calculate percentage
    const percentage = Math.min((value / max) * 100, 100);

    // Get size classes
    const getSizeClasses = () => {
        switch (size) {
            case 'xs':
                return 'h-1';
            case 'sm':
                return 'h-2';
            case 'md':
                return 'h-3';
            case 'lg':
                return 'h-4';
            default:
                return 'h-2';
        }
    };

    // Get color classes - using safe list approach
    const getColorClasses = () => {
        const colorMap = {
            orange: 'bg-orange',
            green: 'bg-green-500',
            blue: 'bg-blue-500',
            red: 'bg-red-500',
            purple: 'bg-purple-500',
            yellow: 'bg-yellow-500',
            indigo: 'bg-indigo-500',
            pink: 'bg-pink-500',
            emerald: 'bg-emerald-500',
            cyan: 'bg-cyan-500',
            teal: 'bg-teal-500',
            lime: 'bg-lime-500',
            amber: 'bg-amber-500',
            rose: 'bg-rose-500',
        };
        return colorMap[color] || 'bg-orange';
    };

    // Get background color classes
    const getBgColorClasses = () => {
        return `bg-${bgColor}`;
    };

    return (
        <div className={className}>
            {/* Top Label */}
            {showLabel && labelPosition === 'top' && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-700">
                        {Math.round(percentage)}%
                    </span>
                </div>
            )}

            {/* Progress Bar Container */}
            <div className="relative">
                <div className={`w-full ${getBgColorClasses()} rounded-full ${getSizeClasses()} overflow-hidden`}>
                    <div
                        className={`h-full ${getColorClasses()} ${animated ? 'transition-all duration-500' : ''} rounded-full relative`}
                        style={{ width: `${percentage}%` }}
                    >
                        {/* Inside Label */}
                        {showLabel && labelPosition === 'inside' && percentage > 15 && (
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                {Math.round(percentage)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Outside Label */}
                {showLabel && labelPosition === 'outside' && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 ml-2 text-xs font-semibold text-gray-600">
                        {Math.round(percentage)}%
                    </span>
                )}
            </div>
        </div>
    );
}

