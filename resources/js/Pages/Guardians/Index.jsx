import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { Plus, Upload, Eye, Edit, Trash2, Users, Mail, Phone, MapPin, UserCircle, CheckCircle, AlertCircle, XCircle, UserX, UserCheck } from 'lucide-react';
import { FilterSelect } from '@/Components/Filters';
import ConfirmationModal from '@/Components/ConfirmationModal';
import GuardianImportModal from '@/Components/Guardians/GuardianImportModal';
import useFilters from '@/Hooks/useFilters';
import useCumulativeLoading from '@/Hooks/useCumulativeLoading';
import { SearchInput } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';
import LoadMoreButton from '@/Components/Pagination/LoadMoreButton';
import Pagination from '@/Components/Pagination/Pagination';

// Mobile List Item Component - Refactored with new components
function MobileGuardianItem({ guardian, auth, onDelete, onDeactivate, onReactivate }) {
    const isInactive = guardian.status === 'inactive';

    // Build swipe actions
    const primaryActions = [
        { icon: Eye, label: 'View', href: `/guardians/${guardian.id}` },
    ];

    if (auth.user.role === 'admin') {
        primaryActions.push(
            { icon: Edit, label: 'Edit', href: `/guardians/${guardian.id}/edit` },
        );
        if (isInactive) {
            primaryActions.push({ icon: UserCheck, label: 'Reactivate', onClick: () => onReactivate(guardian) });
        } else {
            primaryActions.push({ icon: UserX, label: 'Deactivate', onClick: () => onDeactivate(guardian) });
        }
    }

    const secondaryActions = guardian.phone_number ? [
        { icon: Phone, label: 'Call', href: `tel:${guardian.phone_number}` },
    ] : [];

    return (
        <SwipeableListItem
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
        >
            <ExpandableCard
                header={
                    <div className={`flex items-start justify-between gap-3 ${isInactive ? 'opacity-70' : ''}`}>
                        <div className="flex-1 min-w-0">
                            {/* Guardian Number + Status */}
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="primary" value={guardian.guardian_number} size="sm" />
                                <Badge variant="status" value={guardian.status || 'active'} size="sm" />
                            </div>

                            <h3 className={`text-base font-bold truncate mb-2 ${isInactive ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
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

export default function GuardiansIndex({ guardians, filters: initialFilters = {}, auth, importResults }) {
    // Use the new useFilters hook
    const { filters, updateFilter } = useFilters({
        route: '/guardians',
        initialFilters: {
            search: initialFilters.search || '',
            status: initialFilters.status || '',
        },
    });

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    // Cumulative loading for mobile view
    const {
        items: allGuardians,
        isLoadingMore,
        handleLoadMore
    } = useCumulativeLoading(guardians, filters, 'guardians.index', 'guardians');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showReactivateModal, setShowReactivateModal] = useState(false);
    const [selectedGuardian, setSelectedGuardian] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showResultsBanner, setShowResultsBanner] = useState(!!importResults);

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

    const confirmDeactivate = useCallback((guardian) => {
        setSelectedGuardian(guardian);
        setShowDeactivateModal(true);
    }, []);

    const handleDeactivate = useCallback(() => {
        if (selectedGuardian) {
            router.patch(`/guardians/${selectedGuardian.id}/deactivate`, {}, {
                onSuccess: () => {
                    setShowDeactivateModal(false);
                    setSelectedGuardian(null);
                },
            });
        }
    }, [selectedGuardian]);

    const confirmReactivate = useCallback((guardian) => {
        setSelectedGuardian(guardian);
        setShowReactivateModal(true);
    }, []);

    const handleReactivate = useCallback(() => {
        if (selectedGuardian) {
            router.patch(`/guardians/${selectedGuardian.id}/reactivate`, {}, {
                onSuccess: () => {
                    setShowReactivateModal(false);
                    setSelectedGuardian(null);
                },
            });
        }
    }, [selectedGuardian]);

    return (
        <AuthenticatedLayout header="All Guardians">
            <Head title="Guardians" />

            <div className="space-y-6">
                {/* Import Results Banner */}
                {importResults && showResultsBanner && (
                    <div className={`rounded-xl border p-4 flex items-start gap-3 ${
                        importResults.failed === 0 && importResults.skipped === 0
                            ? 'bg-green-50 border-green-200'
                            : 'bg-yellow-50 border-yellow-200'
                    }`}>
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 text-sm">
                            <p className="font-semibold text-gray-800">
                                Import complete — {importResults.imported} guardian{importResults.imported !== 1 ? 's' : ''} imported
                                {importResults.skipped > 0 && `, ${importResults.skipped} skipped (duplicate)`}
                                {importResults.failed > 0 && `, ${importResults.failed} failed`}
                            </p>
                            {importResults.errors && importResults.errors.length > 0 && (
                                <ul className="mt-2 space-y-0.5">
                                    {importResults.errors.map((err, i) => (
                                        <li key={i} className="flex items-start gap-1 text-xs text-yellow-800">
                                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                            Row {err.row} ({err.email}): {err.reason}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button onClick={() => setShowResultsBanner(false)} className="text-gray-400 hover:text-gray-600">
                            <XCircle className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Header Actions - Refactored with SearchInput */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:max-w-xl">
                        <div className="flex-1">
                            <SearchInput
                                value={filters.search}
                                onChange={(e) => updateFilter('search', e.target.value)}
                                placeholder="Search guardians..."
                            />
                        </div>
                        <FilterSelect
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            options={statusOptions}
                            allLabel="All Status"
                            hideLabel
                        />
                    </div>

                    {auth.user.role === 'admin' && (
                        <div className="flex items-center gap-2">
                            <Link
                                href={route('guardians.inactive')}
                                className="inline-flex items-center px-4 py-2.5 bg-white border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm"
                            >
                                <UserX className="w-4 h-4 mr-2" />
                                Inactive
                            </Link>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Bulk Import
                            </button>
                            <Link
                                href={route('guardians.create')}
                                className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Guardian
                            </Link>
                        </div>
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
                        {allGuardians && allGuardians.length > 0 && allGuardians.map((guardian) => (
                            <MobileGuardianItem
                                key={guardian.id}
                                guardian={guardian}
                                auth={auth}
                                onDelete={confirmDelete}
                                onDeactivate={confirmDeactivate}
                                onReactivate={confirmReactivate}
                            />
                        ))}
                    </MobileListContainer>

                    {guardians.data && guardians.data.length > 0 && (
                        <LoadMoreButton
                            currentCount={allGuardians.length}
                            totalCount={guardians.total}
                            isLoading={isLoadingMore}
                            onLoadMore={handleLoadMore}
                            itemName="guardians"
                        />
                    )}
                </div>

                {/* Desktop Table View - UNCHANGED */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Guardian No</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Relationship</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Students</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {guardians.data.map((guardian) => {
                                    const inactive = guardian.status === 'inactive';
                                    return (
                                    <tr key={guardian.id} className={`hover:bg-gray-50 transition-colors ${inactive ? 'bg-gray-50/60' : ''}`}>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${inactive ? 'text-gray-400' : 'text-navy'}`}>
                                            {guardian.guardian_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className={inactive ? 'line-through text-gray-400' : ''}>{guardian.user?.name}</span>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${inactive ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {guardian.user?.email}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${inactive ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {guardian.phone_number}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${inactive ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {guardian.relationship}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange bg-opacity-10 text-orange">
                                                <Users className="w-3 h-3 mr-1" />
                                                {guardian.students?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant="status" value={guardian.status || 'active'} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <Link
                                                href={`/guardians/${guardian.id}`}
                                                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            {auth.user.role === 'admin' && (
                                                <>
                                                    <Link
                                                        href={`/guardians/${guardian.id}/edit`}
                                                        className="inline-flex items-center text-orange hover:text-orange-dark transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    {inactive ? (
                                                        <button
                                                            onClick={() => confirmReactivate(guardian)}
                                                            className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
                                                            title="Reactivate guardian"
                                                        >
                                                            <UserCheck className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => confirmDeactivate(guardian)}
                                                            className="inline-flex items-center text-amber-600 hover:text-amber-800 transition-colors"
                                                            title="Deactivate guardian"
                                                        >
                                                            <UserX className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Desktop Pagination */}
                    <Pagination
                        links={guardians.links}
                        currentPage={guardians.current_page}
                        lastPage={guardians.last_page}
                        total={guardians.total}
                        from={guardians.from}
                        to={guardians.to}
                    />
                </div>
            </div>

            {/* Delete (hard) */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Guardian"
                message={`Are you sure you want to permanently delete ${selectedGuardian?.user?.name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />

            {/* Deactivate */}
            <ConfirmationModal
                show={showDeactivateModal}
                onClose={() => setShowDeactivateModal(false)}
                onConfirm={handleDeactivate}
                title="Deactivate Guardian"
                message={`This will mark ${selectedGuardian?.user?.name} as inactive and also deactivate all their linked students. All records (attendance, invoices, reports) are preserved and can still be reviewed. You can reactivate them at any time.`}
                confirmText="Deactivate"
                type="warning"
            />

            {/* Reactivate */}
            <ConfirmationModal
                show={showReactivateModal}
                onClose={() => setShowReactivateModal(false)}
                onConfirm={handleReactivate}
                title="Reactivate Guardian"
                message={`Reactivate ${selectedGuardian?.user?.name}? Their linked students will remain inactive — reactivate each student individually if needed.`}
                confirmText="Reactivate"
                type="success"
            />

            <GuardianImportModal
                show={showImportModal}
                onClose={() => setShowImportModal(false)}
            />
        </AuthenticatedLayout>
    );
}