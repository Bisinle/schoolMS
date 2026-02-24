import { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';

/**
 * Reusable Hook for Cumulative Loading (Infinite Scroll)
 * 
 * Manages cumulative loading of paginated data for mobile views.
 * Automatically handles:
 * - Accumulating items when loading more
 * - Resetting when filters change
 * - Loading state management
 * - Page tracking
 * 
 * @param {Object} paginatedData - Laravel paginated data object (with data, current_page, last_page, total, etc.)
 * @param {Object} filters - Current filter values
 * @param {string} routeName - Route name for loading more data
 * @param {string} onlyProp - Inertia 'only' prop name (e.g., 'students', 'invoices')
 * 
 * @returns {Object} {
 *   items: Array - Accumulated items to display
 *   isLoadingMore: boolean - Whether currently loading more items
 *   handleLoadMore: Function - Function to call when "Load More" is clicked
 *   hasMore: boolean - Whether there are more items to load
 * }
 * 
 * @example
 * // In your Index page component:
 * const { items, isLoadingMore, handleLoadMore, hasMore } = useCumulativeLoading(
 *     students,      // Paginated data from backend
 *     filters,       // Current filters
 *     'students.index',  // Route name
 *     'students'     // Prop name
 * );
 * 
 * // In your JSX:
 * {items.map(item => <ItemCard key={item.id} item={item} />)}
 * <LoadMoreButton 
 *     currentCount={items.length}
 *     totalCount={students.total}
 *     isLoading={isLoadingMore}
 *     onLoadMore={handleLoadMore}
 * />
 */
export default function useCumulativeLoading(paginatedData, filters, routeName, onlyProp) {
    // State for accumulated items
    const [items, setItems] = useState(paginatedData.data || []);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(paginatedData.current_page || 1);
    
    // Track previous filters to detect changes
    const prevFiltersRef = useRef(filters);

    // Reset items when filters change or when back to page 1
    useEffect(() => {
        const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
        
        if (filtersChanged || paginatedData.current_page === 1) {
            // Filters changed or back to page 1 - reset the list
            setItems(paginatedData.data || []);
            setCurrentPage(paginatedData.current_page || 1);
            prevFiltersRef.current = filters;
        }
    }, [filters, paginatedData.data, paginatedData.current_page]);

    // Handle "Load More" action
    const handleLoadMore = useCallback(() => {
        if (isLoadingMore || currentPage >= (paginatedData.last_page || 1)) {
            return;
        }

        setIsLoadingMore(true);

        router.get(
            route(routeName),
            { ...filters, page: currentPage + 1 },
            {
                preserveState: true,
                preserveScroll: true,
                only: [onlyProp],
                onSuccess: (page) => {
                    // Append new items to existing list
                    const newData = page.props[onlyProp]?.data || [];
                    setItems(prev => [...prev, ...newData]);
                    setCurrentPage(page.props[onlyProp]?.current_page || currentPage + 1);
                    setIsLoadingMore(false);
                },
                onError: () => {
                    setIsLoadingMore(false);
                }
            }
        );
    }, [filters, currentPage, paginatedData.last_page, isLoadingMore, routeName, onlyProp]);

    // Check if there are more items to load
    const hasMore = currentPage < (paginatedData.last_page || 1);

    return {
        items,
        isLoadingMore,
        handleLoadMore,
        hasMore,
        currentPage,
        totalPages: paginatedData.last_page || 1,
        totalItems: paginatedData.total || 0,
    };
}

