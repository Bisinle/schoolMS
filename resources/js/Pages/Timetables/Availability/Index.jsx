import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, UserCog, Calendar, Clock } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { Badge } from '@/Components/UI';

export default function TeacherAvailabilityIndex({ availabilities, teachers, filters: initialFilters = {}, auth }) {
    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/timetables/availability',
        initialFilters: {
            teacher_id: initialFilters.teacher_id || '',
            day_of_week: initialFilters.day_of_week || '',
            availability_type: initialFilters.availability_type || '',
        },
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAvailability, setSelectedAvailability] = useState(null);

    const confirmDelete = (availability) => {
        setSelectedAvailability(availability);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedAvailability) {
            router.delete(route('timetables.availability.destroy', selectedAvailability.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedAvailability(null);
                },
            });
        }
    };

    const getAvailabilityTypeColor = (type) => {
        const colors = {
            'available': 'bg-green-100 text-green-800',
            'unavailable': 'bg-red-100 text-red-800',
            'preferred': 'bg-blue-100 text-blue-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const daysOfWeek = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' },
    ];

    return (
        <AuthenticatedLayout header="Teacher Availability">
            <Head title="Teacher Availability" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <UserCog className="w-8 h-8 text-orange" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Teacher Availability</h2>
                            <p className="text-sm text-gray-600">
                                Manage teacher availability schedules
                            </p>
                        </div>
                    </div>

                    <Link
                        href={route('timetables.availability.create')}
                        className="inline-flex items-center px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange-dark transition-colors shadow-md hover:shadow-lg"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Availability
                    </Link>
                </div>

                {/* Filters */}
                <FilterBar onClear={clearFilters} gridCols="3">
                    {auth.user.role === 'admin' && (
                        <FilterSelect
                            value={filters.teacher_id}
                            onChange={(e) => updateFilter('teacher_id', e.target.value)}
                            options={teachers.map(teacher => ({ value: teacher.id, label: teacher.user?.name || 'Unknown' }))}
                            allLabel="All Teachers"
                            hideLabel
                        />
                    )}
                    <FilterSelect
                        value={filters.day_of_week}
                        onChange={(e) => updateFilter('day_of_week', e.target.value)}
                        options={daysOfWeek}
                        allLabel="All Days"
                        hideLabel
                    />
                    <FilterSelect
                        value={filters.availability_type}
                        onChange={(e) => updateFilter('availability_type', e.target.value)}
                        options={[
                            { value: 'available', label: 'Available' },
                            { value: 'unavailable', label: 'Unavailable' },
                            { value: 'preferred', label: 'Preferred' }
                        ]}
                        allLabel="All Types"
                        hideLabel
                    />
                </FilterBar>

                {/* Availability Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {auth.user.role === 'admin' && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Teacher
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Day
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Notes
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {availabilities.data && availabilities.data.length > 0 ? (
                                    availabilities.data.map((availability) => (
                                        <tr key={availability.id} className="hover:bg-gray-50 transition-colors">
                                            {auth.user.role === 'admin' && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {availability.teacher?.user?.name || 'Unknown'}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-900 capitalize">
                                                        {availability.day_of_week}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-900">
                                                        {availability.start_time} - {availability.end_time}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityTypeColor(availability.availability_type)}`}>
                                                    {availability.availability_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 max-w-xs truncate">
                                                    {availability.notes || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/timetables/availability/${availability.id}`}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/timetables/availability/${availability.id}/edit`}
                                                        className="text-orange hover:text-orange-dark"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => confirmDelete(availability)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={auth.user.role === 'admin' ? "6" : "5"} className="px-6 py-12 text-center">
                                            <UserCog className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No availability records found</h3>
                                            <p className="text-gray-600 mb-6">
                                                {filters.teacher_id || filters.day_of_week || filters.availability_type ? 'Try adjusting your filters' : 'Get started by adding your availability'}
                                            </p>
                                            {!filters.teacher_id && !filters.day_of_week && !filters.availability_type && (
                                                <Link
                                                    href={route('timetables.availability.create')}
                                                    className="inline-flex items-center px-6 py-3 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors"
                                                >
                                                    <Plus className="w-5 h-5 mr-2" />
                                                    Add First Availability
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
                title="Delete Availability"
                message={
                    <div className="space-y-3">
                        <p>Are you sure you want to delete this availability record?</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                            <p className="text-xs md:text-sm text-red-800">
                                ⚠️ This action cannot be undone.
                            </p>
                        </div>
                    </div>
                }
                confirmText="Delete Availability"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}


