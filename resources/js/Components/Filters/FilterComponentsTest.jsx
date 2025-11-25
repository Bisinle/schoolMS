import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useFilters from '@/Hooks/useFilters';
import {
    SearchInput,
    FilterSelect,
    FilterSelectGroup,
    FilterBar,
    FilterBarSection,
    ActiveFilters,
    ActiveFiltersBar,
} from '@/Components/Filters';

/**
 * Filter Components Test Page
 * 
 * Visual testing page for all filter components and useFilters hook.
 * This file can be deleted after verification.
 * 
 * To test: Add a route to this component and view in browser.
 */
export default function FilterComponentsTest({ auth }) {
    // Sample data
    const sampleGrades = [
        { id: 1, name: 'Grade 1' },
        { id: 2, name: 'Grade 2' },
        { id: 3, name: 'Grade 3' },
    ];

    // Using the useFilters hook
    const { filters, updateFilter, clearFilters, hasActiveFilters, getActiveFilters } = useFilters({
        route: '/test-filters',
        initialFilters: {
            search: '',
            grade_id: '',
            gender: '',
            status: '',
        },
    });

    const handleRemoveFilter = (key) => {
        updateFilter(key, '');
    };

    const activeFiltersArray = getActiveFilters({
        search: 'Search',
        grade_id: 'Grade',
        gender: 'Gender',
        status: 'Status',
    });

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Filter Components Test" />

            <div className="py-6 max-w-6xl mx-auto space-y-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Filter Components Test
                    </h1>
                    <p className="text-sm text-gray-600">
                        Test all filter components and the useFilters hook.
                    </p>
                </div>

                {/* Active Filters Bar */}
                {hasActiveFilters && (
                    <ActiveFiltersBar
                        filters={filters}
                        onRemove={handleRemoveFilter}
                        onClearAll={clearFilters}
                        labels={{
                            search: 'Search',
                            grade_id: 'Grade',
                            gender: 'Gender',
                            status: 'Status',
                        }}
                        valueLabels={{
                            grade_id: {
                                '1': 'Grade 1',
                                '2': 'Grade 2',
                                '3': 'Grade 3',
                            },
                            gender: {
                                'male': 'Male',
                                'female': 'Female',
                            },
                            status: {
                                'active': 'Active',
                                'inactive': 'Inactive',
                            },
                        }}
                    />
                )}

                {/* Filter Bar - Grid Layout */}
                <FilterBar
                    title="Student Filters"
                    onClear={clearFilters}
                    gridCols="4"
                >
                    <SearchInput
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        placeholder="Search students..."
                    />

                    <FilterSelect
                        label="Grade"
                        name="grade_id"
                        value={filters.grade_id}
                        onChange={(e) => updateFilter('grade_id', e.target.value)}
                        options={sampleGrades.map(g => ({ value: g.id, label: g.name }))}
                        allLabel="All Grades"
                    />

                    <FilterSelect
                        label="Gender"
                        name="gender"
                        value={filters.gender}
                        onChange={(e) => updateFilter('gender', e.target.value)}
                        options={['male', 'female']}
                        allLabel="All Genders"
                    />

                    <FilterSelect
                        label="Status"
                        name="status"
                        value={filters.status}
                        onChange={(e) => updateFilter('status', e.target.value)}
                        options={[
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                        ]}
                        allLabel="All Status"
                    />
                </FilterBar>

                {/* Filter Bar - Horizontal Layout */}
                <FilterBar
                    title="Horizontal Layout"
                    layout="horizontal"
                    onClear={clearFilters}
                >
                    <div className="flex-1 min-w-[200px]">
                        <SearchInput
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder="Search..."
                        />
                    </div>

                    <FilterSelect
                        label="Grade"
                        name="grade_id"
                        value={filters.grade_id}
                        onChange={(e) => updateFilter('grade_id', e.target.value)}
                        options={sampleGrades.map(g => ({ value: g.id, label: g.name }))}
                        allLabel="All Grades"
                    />

                    <FilterSelect
                        label="Status"
                        name="status"
                        value={filters.status}
                        onChange={(e) => updateFilter('status', e.target.value)}
                        options={['active', 'inactive']}
                        allLabel="All"
                    />
                </FilterBar>

                {/* Active Filters (Inline) */}
                {hasActiveFilters && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                        <ActiveFilters
                            filters={filters}
                            onRemove={handleRemoveFilter}
                            labels={{
                                search: 'Search',
                                grade_id: 'Grade',
                                gender: 'Gender',
                                status: 'Status',
                            }}
                            valueLabels={{
                                grade_id: {
                                    '1': 'Grade 1',
                                    '2': 'Grade 2',
                                    '3': 'Grade 3',
                                },
                            }}
                        />
                    </div>
                )}

                {/* Current Filter State */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-navy mb-4">
                        Current Filter State
                    </h3>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
                        {JSON.stringify(filters, null, 2)}
                    </pre>
                    <div className="mt-4">
                        <p className="text-sm text-gray-600">
                            <strong>Has Active Filters:</strong> {hasActiveFilters ? 'Yes' : 'No'}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            <strong>Active Filters Count:</strong> {activeFiltersArray.length}
                        </p>
                    </div>
                </div>

                {/* Testing Instructions */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">
                        Testing Instructions
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Test search input with debouncing (500ms delay)</li>
                        <li>Test filter selects with immediate updates</li>
                        <li>Test clear button in FilterBar</li>
                        <li>Test individual filter removal in ActiveFilters</li>
                        <li>Test "Clear All" in ActiveFiltersBar</li>
                        <li>Verify focus ring color matches orange theme</li>
                        <li>Test responsive layouts (resize browser)</li>
                        <li>Check browser console for Inertia navigation</li>
                        <li>Delete this file after testing</li>
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

