import React from 'react';
import { Link } from '@inertiajs/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StatCard Component
 * 
 * A reusable statistics card component extracted from Dashboard.jsx.
 * Displays a metric with an icon, value, optional trend, and optional link.
 * 
 * @param {Object} props
 * @param {React.Component} props.icon - Lucide icon component
 * @param {string} props.title - Card title/label
 * @param {string|number} props.value - The main value to display
 * @param {string} props.gradient - Tailwind gradient classes (e.g., 'from-orange-500 to-red-600')
 * @param {string} props.trend - Optional trend text to display
 * @param {string} props.trendDirection - Trend direction: 'up' or 'down' (default: 'up')
 * @param {string} props.color - Alternative to gradient, single color name
 * @param {string} props.href - Optional link URL (makes card clickable)
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * <StatCard
 *   icon={Users}
 *   title="Total Students"
 *   value={150}
 *   gradient="from-orange-500 to-red-600"
 *   trend="12% increase"
 *   href="/students"
 * />
 */
export default function StatCard({
    icon: Icon,
    title,
    label, // Support both 'label' and 'title' for backwards compatibility
    value,
    gradient = 'from-orange-500 to-red-600',
    trend,
    trendDirection = 'up',
    color,
    href,
    link, // Support both 'link' and 'href' for backwards compatibility
    className = '',
}) {
    // Use label or title (label takes precedence for backwards compatibility)
    const displayTitle = label || title;

    // Use link or href (link takes precedence for backwards compatibility)
    const displayHref = link || href;

    // Use color prop to generate gradient if provided
    const gradientClasses = color
        ? `from-${color}-500 to-${color}-600`
        : gradient;

    const CardContent = (
        <div className={`group relative bg-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden ${displayHref ? 'active:scale-95 cursor-pointer' : ''} ${className}`}>
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

            <div className="relative">
                {/* Icon - Mobile First */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradientClasses} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg mb-3 sm:mb-4`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>

                {/* Text Content */}
                <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2 leading-tight">
                        {displayTitle}
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
                        {value}
                    </p>
                    {trend && (
                        <p className="text-xs text-gray-500 flex items-center mt-2">
                            {trendDirection === 'up' ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {trend}
                        </p>
                    )}
                </div>
            </div>

            {/* Decorative corner */}
            <div className={`absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br ${gradientClasses} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
        </div>
    );

    return displayHref ? <Link href={displayHref}>{CardContent}</Link> : CardContent;
}

