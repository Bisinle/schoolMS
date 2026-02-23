import { Loader2 } from 'lucide-react';

/**
 * Load More Button Component for Mobile Infinite Scroll
 * Shows current count, total count, and handles loading state
 * 
 * @param {Object} props
 * @param {number} props.currentCount - Number of items currently displayed
 * @param {number} props.totalCount - Total number of items available
 * @param {boolean} props.isLoading - Whether data is currently being loaded
 * @param {Function} props.onLoadMore - Callback when "Load More" is clicked
 * @param {string} props.itemName - Name of items being loaded (e.g., "students", "invoices")
 */
export default function LoadMoreButton({ 
    currentCount, 
    totalCount, 
    isLoading = false, 
    onLoadMore,
    itemName = 'items'
}) {
    const hasMore = currentCount < totalCount;

    if (!hasMore) {
        return (
            <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    All {itemName} loaded ({totalCount} total)
                </div>
            </div>
        );
    }

    return (
        <div className="text-center py-6 space-y-3">
            {/* Count Display */}
            <p className="text-sm text-gray-600 font-medium">
                Showing <span className="text-gray-900 font-bold">{currentCount}</span> of{' '}
                <span className="text-gray-900 font-bold">{totalCount}</span> {itemName}
            </p>

            {/* Load More Button */}
            <button
                onClick={onLoadMore}
                disabled={isLoading}
                className="w-full max-w-xs mx-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span>Load More {itemName}</span>
                    </>
                )}
            </button>

            {/* Progress Indicator */}
            <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-500"
                    style={{ width: `${(currentCount / totalCount) * 100}%` }}
                />
            </div>
        </div>
    );
}

