import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

/**
 * useFilters Hook
 * 
 * Custom hook for managing filter state with Inertia.js integration.
 * Handles search debouncing, immediate filter updates, and scroll preservation.
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.route - The route to navigate to (e.g., '/students')
 * @param {Object} config.initialFilters - Initial filter values from server
 * @param {boolean} config.preserveState - Preserve component state on navigation (default: true)
 * @param {boolean} config.preserveScroll - Preserve scroll position (default: true)
 * @param {boolean} config.replace - Replace history instead of push (default: true)
 * @param {number} config.debounceMs - Debounce delay for search in ms (default: 500)
 * @param {Array<string>} config.debounceFields - Fields to debounce (default: ['search'])
 * @param {Array<string>} config.immediateFields - Fields to apply immediately (default: all except debounced)
 * 
 * @returns {Object} Filter state and methods
 * 
 * @example
 * const { filters, updateFilter, clearFilters, hasActiveFilters } = useFilters({
 *   route: '/students',
 *   initialFilters: { search: '', grade_id: '', status: '' },
 * });
 * 
 * // Update a single filter
 * updateFilter('search', 'John');
 * 
 * // Update multiple filters
 * updateFilter({ grade_id: '1', status: 'active' });
 * 
 * // Clear all filters
 * clearFilters();
 */
export default function useFilters({
    route,
    initialFilters = {},
    preserveState = true,
    preserveScroll = true,
    replace = true,
    debounceMs = 500,
    debounceFields = ['search'],
    immediateFields = null,
}) {
    const [filters, setFilters] = useState(initialFilters);
    const isFirstRender = useRef(true);
    const debounceTimers = useRef({});

    // Determine which fields should be applied immediately
    const getImmediateFields = () => {
        if (immediateFields) return immediateFields;
        return Object.keys(initialFilters).filter(key => !debounceFields.includes(key));
    };

    /**
     * Apply filters to the route
     */
    const applyFilters = (filterValues = filters) => {
        // Remove empty values (but keep 'all' as it's a valid filter value)
        const cleanedFilters = Object.entries(filterValues).reduce((acc, [key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});

        router.get(route, cleanedFilters, {
            preserveState,
            preserveScroll,
            replace,
        });
    };

    /**
     * Update a single filter or multiple filters
     * @param {string|Object} keyOrObject - Filter key or object with multiple filters
     * @param {*} value - Filter value (only if first param is string)
     */
    const updateFilter = (keyOrObject, value) => {
        if (typeof keyOrObject === 'object') {
            // Update multiple filters
            setFilters(prev => ({ ...prev, ...keyOrObject }));
        } else {
            // Update single filter
            setFilters(prev => ({ ...prev, [keyOrObject]: value }));
        }
    };

    /**
     * Clear all filters
     */
    const clearFilters = () => {
        const resetFilters = Object.keys(initialFilters).reduce((acc, key) => {
            acc[key] = '';
            return acc;
        }, {});
        setFilters(resetFilters);
        applyFilters(resetFilters);
    };

    /**
     * Check if any filters are active
     */
    const hasActiveFilters = () => {
        return Object.values(filters).some(value => 
            value !== '' && value !== null && value !== undefined && value !== 'all'
        );
    };

    /**
     * Get active filters as an array of { key, value, label }
     */
    const getActiveFilters = (labels = {}) => {
        return Object.entries(filters)
            .filter(([_, value]) => value !== '' && value !== null && value !== undefined && value !== 'all')
            .map(([key, value]) => ({
                key,
                value,
                label: labels[key] || key,
            }));
    };

    // Effect for debounced fields (e.g., search)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Check if any debounced field changed
        const debouncedFieldsChanged = debounceFields.some(field => {
            const currentValue = filters[field];
            const initialValue = initialFilters[field];
            return currentValue !== initialValue;
        });

        if (!debouncedFieldsChanged) return;

        // Clear existing timers
        Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));

        // Set new timer
        const timerId = setTimeout(() => {
            applyFilters();
        }, debounceMs);

        debounceTimers.current.debounce = timerId;

        return () => clearTimeout(timerId);
    }, debounceFields.map(field => filters[field]));

    // Effect for immediate fields (e.g., dropdowns)
    useEffect(() => {
        if (isFirstRender.current) {
            return;
        }

        applyFilters();
    }, getImmediateFields().map(field => filters[field]));

    return {
        filters,
        updateFilter,
        clearFilters,
        hasActiveFilters: hasActiveFilters(),
        getActiveFilters,
        applyFilters,
    };
}

