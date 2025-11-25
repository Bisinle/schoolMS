import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { Plus, Eye, Edit, Trash2, Users, Mail, Phone, MapPin, UserCircle } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import useFilters from '@/Hooks/useFilters';
import { SearchInput } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';

// Mobile List Item Component - Refactored with new components
function MobileGuardianItem({ guardian, auth, onDelete }) {
    // Build swipe actions
    const primaryActions = [
        { icon: Eye, label: 'View', color: 'blue', href: `/guardians/${guardian.id}` },
    ];

    if (auth.user.role === 'admin') {
        primaryActions.push(
            { icon: Edit, label: 'Edit', color: 'indigo', href: `/guardians/${guardian.id}/edit` },
            { icon: Trash2, label: 'Delete', color: 'red', onClick: () => onDelete(guardian) }
        );
    }

    const secondaryActions = guardian.phone_number ? [
        { icon: Phone, label: 'Call', color: 'green', href: `tel:${guardian.phone_number}` },
    ] : [];

    return (
        <SwipeableListItem
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
        >
            <ExpandableCard
                header={
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            {/* Guardian Number Badge */}
                            <div className="mb-2">
                                <Badge variant="primary" value={guardian.guardian_number} size="sm" />
                            </div>

                            <h3 className="text-base font-bold text-gray-900 truncate mb-2">
                                {guardian.user?.name}
                            </h3>

                            <p className="text-xs text-gray-600 truncate mb-2">{guardian.user?.email}</p>

                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-green-100 text-green-700 capitalize">
                                    {guardian.relationship}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                    <Users className="w-3 h-3 inline mr-1" />
                                    {guardian.students?.length || 0} student{guardian.students?.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                }
            >

                {/* Expanded Details */}
                <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                        {guardian.phone_number && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-600">{guardian.phone_number}</span>
                            </div>
                        )}

                        {guardian.address && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-600">{guardian.address}</span>
                            </div>
                        )}

                        {guardian.students && guardian.students.length > 0 && (
                            <div className="flex items-start gap-2 pt-1">
                                <Users className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex flex-wrap gap-1">
                                    {guardian.students.map((student) => (
                                        <span key={student.id} className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                            {student.first_name} {student.last_name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                        <Link
                            href={`/guardians/${guardian.id}`}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Eye className="w-3 h-3" />
                            View
                        </Link>
                        {auth.user.role === 'admin' && (
                            <Link
                                href={`/guardians/${guardian.id}/edit`}
                                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors"
                            >
                                <Edit className="w-3 h-3" />
                                Edit
                            </Link>
                        )}

                        {guardian.phone_number && (
                            <a
                                href={`tel:${guardian.phone_number}`}
                                className={`flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors ${
                                    auth.user.role === 'admin' ? '' : 'col-span-2'
                                }`}
                            >
                                <Phone className="w-3 h-3" />
                                Call
                            </a>
                        )}

                        {auth.user.role === 'admin' && (
                            <button
                                onClick={() => onDelete(guardian)}
                                className={`flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors ${
                                    guardian.phone_number ? '' : 'col-span-2'
                                }`}
                            >
                                <Trash2 className="w-3 h-3" />
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </ExpandableCard>
        </SwipeableListItem>
    );
}

export default function GuardiansIndex({ guardians, filters: initialFilters = {}, auth }) {
    // Use the new useFilters hook
    const { filters, updateFilter } = useFilters({
        route: '/guardians',
        initialFilters: {
            search: initialFilters.search || '',
        },
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedGuardian, setSelectedGuardian] = useState(null);

    // Memoize handlers passed to child components
    const confirmDelete = useCallback((guardian) => {
        setSelectedGuardian(guardian);
        setShowDeleteModal(true);
    }, []);

    const handleDelete = useCallback(() => {
        if (selectedGuardian) {
            router.delete(`/guardians/${selectedGuardian.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedGuardian(null);
                },
            });
        }
    }, [selectedGuardian]);

    return (
        <AuthenticatedLayout header="Guardians Management">
            <Head title="Guardians" />

            <div className="space-y-6">
                {/* Header Actions - Refactored with SearchInput */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1 w-full sm:max-w-md">
                        <SearchInput
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder="Search guardians..."
                        />
                    </div>

                    {auth.user.role === 'admin' && (
                        <Link
                            href={route('guardians.create')}
                            className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Guardian
                        </Link>
                    )}
                </div>

                {/* Mobile List View - Refactored with MobileListContainer */}
                <div className="block md:hidden">
                    <MobileListContainer
                        emptyState={{
                            icon: Users,
                            title: 'No guardians found',
                            message: 'Try adjusting your search',
                        }}
                    >
                        {guardians.data && guardians.data.length > 0 && guardians.data.map((guardian) => (
                            <MobileGuardianItem
                                key={guardian.id}
                                guardian={guardian}
                                auth={auth}
                                onDelete={confirmDelete}
                            />
                        ))}
                    </MobileListContainer>
                </div>

                {/* Desktop Table View - UNCHANGED */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Guardian No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Relationship
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Students
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {guardians.data.map((guardian) => (
                                    <tr key={guardian.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                                            {guardian.guardian_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {guardian.user?.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {guardian.user?.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {guardian.phone_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {guardian.relationship}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange bg-opacity-10 text-orange">
                                                <Users className="w-3 h-3 mr-1" />
                                                {guardian.students?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <Link
                                                href={`/guardians/${guardian.id}`}
                                                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            {auth.user.role === 'admin' && (
                                                <>
                                                    <Link
                                                        href={`/guardians/${guardian.id}/edit`}
                                                        className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => confirmDelete(guardian)}
                                                        className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{guardians.from}</span> to{' '}
                                <span className="font-medium">{guardians.to}</span> of{' '}
                                <span className="font-medium">{guardians.total}</span> results
                            </div>
                            <div className="flex gap-2">
                                {guardians.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                            link.active
                                                ? 'bg-orange text-white shadow-sm'
                                                : link.url
                                                ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveState
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Guardian"
                message={`Are you sure you want to delete ${selectedGuardian?.user?.name}? This action cannot be undone and will also delete all associated students.`}
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}