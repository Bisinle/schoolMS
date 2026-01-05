import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Clock, Coffee, AlertCircle, Sparkles, User } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import BulkDeletePeriodsModal from '@/Components/Blueprints/BulkDeletePeriodsModal';
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { Badge } from '@/Components/UI';

export default function TimetablePeriodsIndex({ periods, filters: initialFilters = {}, gradeLevels = [], auth }) {
    const { errors } = usePage().props;
    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/timetables/periods',
        initialFilters: {
            search: initialFilters.search || '',
            period_type: initialFilters.period_type || '',
            grade_level: initialFilters.grade_level || '',
            is_active: initialFilters.is_active || '',
            source: initialFilters.source || '',
        },
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    const confirmDelete = (period) => {
        setSelectedPeriod(period);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedPeriod) {
            router.delete(route('timetables.periods.destroy', selectedPeriod.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedPeriod(null);
                },
            });
        }
    };

    const getPeriodTypeColor = (type) => {
        const colors = {
            'lesson': 'bg-blue-100 text-blue-800',
            'break': 'bg-green-100 text-green-800',
            'lunch': 'bg-orange-100 text-orange-800',
            'assembly': 'bg-purple-100 text-purple-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AuthenticatedLayout header="Time Blocks">
            <Head title="Time Blocks" />

            <div className="space-y-6">
                {/* Error Messages */}
                {errors?.error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                        <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-red-800 mb-2">
                                    {errors.error}
                                </p>
                                {errors.templates && (
                                    <p className="text-sm text-red-700 mb-2">
                                        {errors.templates}
                                    </p>
                                )}
                                {errors.instruction && (
                                    <div className="mt-3 p-3 bg-red-100 rounded-md">
                                        <p className="text-sm font-medium text-red-900 mb-1">How to fix:</p>
                                        <p className="text-sm text-red-800">{errors.instruction}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <Clock className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Time Blocks</h2>
                            <p className="text-sm text-gray-600">
                                Manage atomic time blocks - lessons, breaks, prayers, and activities
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {auth.user.role === 'admin' && (
                            <>
                                <Link
                                    href="/blueprints"
                                    className="inline-flex items-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                                >
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Generate from Blueprint
                                </Link>
                                <Link
                                    href={route('timetables.periods.create')}
                                    className="inline-flex items-center px-4 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md hover:shadow-lg"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add Manually
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-purple-900">Auto-Generate Periods from Blueprints</h3>
                            <div className="mt-2 text-sm text-purple-800">
                                <p>
                                    You can now auto-generate time blocks from your <Link href="/blueprints" className="font-medium underline hover:text-purple-900">Day Blueprints</Link>.
                                    This saves time and ensures consistency across your timetables. Auto-generated periods are marked with a <Sparkles className="w-3 h-3 inline" /> badge.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <FilterBar onClear={clearFilters} gridCols="5">
                    <SearchInput
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        placeholder="Search periods..."
                    />
                    <FilterSelect
                        value={filters.grade_level}
                        onChange={(e) => updateFilter('grade_level', e.target.value)}
                        options={gradeLevels.map(level => ({ value: level, label: level }))}
                        allLabel="All Grade Levels"
                        hideLabel
                    />
                    <FilterSelect
                        value={filters.period_type}
                        onChange={(e) => updateFilter('period_type', e.target.value)}
                        options={[
                            { value: 'lesson', label: 'Lesson' },
                            { value: 'break', label: 'Break' },
                            { value: 'lunch', label: 'Lunch' },
                            { value: 'assembly', label: 'Assembly' },
                            { value: 'activity', label: 'Activity' }
                        ]}
                        allLabel="All Types"
                        hideLabel
                    />
                    <FilterSelect
                        value={filters.source}
                        onChange={(e) => updateFilter('source', e.target.value)}
                        options={[
                            { value: 'generated', label: 'Auto-Generated' },
                            { value: 'manual', label: 'Manual' }
                        ]}
                        allLabel="All Sources"
                        hideLabel
                    />
                    <FilterSelect
                        value={filters.is_active}
                        onChange={(e) => updateFilter('is_active', e.target.value)}
                        options={[
                            { value: '1', label: 'Active' },
                            { value: '0', label: 'Inactive' }
                        ]}
                        allLabel="All Statuses"
                        hideLabel
                    />
                </FilterBar>

                {/* Periods Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Grade Level
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Period Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Source
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {periods.data && periods.data.length > 0 ? (
                                    periods.data.map((period) => (
                                        <tr key={period.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    {period.grade_level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange text-white text-sm font-bold">
                                                        {period.order}
                                                    </span>
                                                    {period.lesson_number && (
                                                        <span className="ml-2 text-xs text-gray-500">
                                                            (L{period.lesson_number})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {period.is_break ? (
                                                        <Coffee className="w-5 h-5 text-green-600 mr-2" />
                                                    ) : (
                                                        <Clock className="w-5 h-5 text-blue-600 mr-2" />
                                                    )}
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {period.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPeriodTypeColor(period.period_type)}`}>
                                                    {period.period_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {period.generated_from_blueprint ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                            <Sparkles className="w-3 h-3 mr-1" />
                                                            Auto-Generated
                                                        </span>
                                                        {period.generated_from_blueprint && (
                                                            <Link
                                                                href={`/blueprints/${period.generated_from_blueprint.id}`}
                                                                className="text-xs text-purple-600 hover:text-purple-800 hover:underline"
                                                                title="View source blueprint"
                                                            >
                                                                From: {period.generated_from_blueprint.name}
                                                            </Link>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        <User className="w-3 h-3 mr-1" />
                                                        Manual
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {period.start_time} - {period.end_time}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {period.duration_minutes} min
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant="status"
                                                    value={period.is_active ? 'active' : 'inactive'}
                                                    size="sm"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={route('timetables.periods.show', period.id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    {auth.user.role === 'admin' && (
                                                        <>
                                                            <Link
                                                                href={route('timetables.periods.edit', period.id)}
                                                                className="text-orange hover:text-orange-dark"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Link>
                                                            <button
                                                                onClick={() => confirmDelete(period)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-12 text-center">
                                            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No periods found</h3>
                                            <p className="text-gray-600 mb-6">
                                                {filters.search || filters.period_type || filters.is_active ? 'Try adjusting your filters' : 'Create atomic time blocks for your school day - lessons, breaks, prayers, and activities'}
                                            </p>
                                            {auth.user.role === 'admin' && !filters.search && !filters.period_type && !filters.is_active && (
                                                <Link
                                                    href={route('timetables.periods.create')}
                                                    className="inline-flex items-center px-6 py-3 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors"
                                                >
                                                    <Plus className="w-5 h-5 mr-2" />
                                                    Add First Time Block
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Period"
                message={
                    <div className="space-y-3">
                        <p>Are you sure you want to delete <strong>{selectedPeriod?.name}</strong>?</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                            <p className="text-xs md:text-sm text-red-800">
                                ⚠️ This action cannot be undone. This period will be removed from all timetables.
                            </p>
                        </div>
                    </div>
                }
                confirmText="Delete Period"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}


