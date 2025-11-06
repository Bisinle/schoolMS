import { Search, Filter } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

export default function UserFilters({ filters, roles }) {
    const [values, setValues] = useState({
        search: filters.search || '',
        role: filters.role || 'all',
        status: filters.status || 'all',
    });

    const isFirstRender = useRef(true);

    // Debounce search only
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            handleFilter();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [values.search]);

    // Immediate filter for role and status changes
    useEffect(() => {
        if (isFirstRender.current) {
            return;
        }

        handleFilter();
    }, [values.role, values.status]);

    const handleFilter = () => {
        router.get(route('users.index'), values, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleReset = () => {
        const resetValues = {
            search: '',
            role: 'all',
            status: 'all',
        };
        setValues(resetValues);
        router.get(route('users.index'), resetValues, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-navy">Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={values.search}
                            onChange={(e) => setValues({ ...values, search: e.target.value })}
                            placeholder="Search by name, email, phone..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Role Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                    </label>
                    <select
                        value={values.role}
                        onChange={(e) => setValues({ ...values, role: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                    >
                        <option value="all">All Roles</option>
                        {roles.map((role) => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                    </label>
                    <select
                        value={values.status}
                        onChange={(e) => setValues({ ...values, status: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Reset Button */}
            {(values.search || values.role !== 'all' || values.status !== 'all') && (
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
    );
}