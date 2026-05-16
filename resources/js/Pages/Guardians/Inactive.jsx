import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { ArrowLeft, Users, Eye, Edit, UserCheck, Phone, MapPin, UserX, Calendar } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import useFilters from '@/Hooks/useFilters';
import useCumulativeLoading from '@/Hooks/useCumulativeLoading';
import { SearchInput } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';
import LoadMoreButton from '@/Components/Pagination/LoadMoreButton';
import Pagination from '@/Components/Pagination/Pagination';

function MobileInactiveGuardianItem({ guardian, auth, onReactivate }) {
    const primaryActions = [
        { icon: Eye, label: 'View', href: `/guardians/${guardian.id}` },
    ];
    if (auth.user.role === 'admin') {
        primaryActions.push({ icon: UserCheck, label: 'Reactivate', onClick: () => onReactivate(guardian) });
    }
    const secondaryActions = guardian.phone_number
        ? [{ icon: Phone, label: 'Call', href: `tel:${guardian.phone_number}` }]
        : [];

    return (
        <SwipeableListItem primaryActions={primaryActions} secondaryActions={secondaryActions}>
            <ExpandableCard
                header={
                    <div className="flex items-start justify-between gap-3 opacity-75">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="primary" value={guardian.guardian_number} size="sm" />
                                <Badge variant="status" value="inactive" size="sm" />
                            </div>
                            <h3 className="text-base font-bold truncate mb-1 text-gray-500 line-through">
                                {guardian.user?.name}
                            </h3>
                            <p className="text-xs text-gray-500 truncate mb-2">{guardian.user?.email}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 capitalize">
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
                        {guardian.deactivated_at && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-500">
                                    Deactivated {new Date(guardian.deactivated_at).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {guardian.deactivation_reason && (
                            <p className="text-xs text-gray-500 italic">"{guardian.deactivation_reason}"</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <Link
                            href={`/guardians/${guardian.id}`}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Eye className="w-3 h-3" /> View
                        </Link>
                        {auth.user.role === 'admin' && (
                            <button
                                onClick={() => onReactivate(guardian)}
                                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors"
                            >
                                <UserCheck className="w-3 h-3" /> Reactivate
                            </button>
                        )}
                    </div>
                </div>
            </ExpandableCard>
        </SwipeableListItem>
    );
}


export default function InactiveGuardians({ guardians, filters: initialFilters = {}, auth, total }) {
    const { filters, updateFilter } = useFilters({
        route: '/guardians/inactive',
        initialFilters: { search: initialFilters.search || '' },
    });

    const { items: allGuardians, isLoadingMore, handleLoadMore } = useCumulativeLoading(
        guardians, filters, 'guardians.inactive', 'guardians'
    );

    const [showReactivateModal, setShowReactivateModal] = useState(false);
    const [selectedGuardian, setSelectedGuardian] = useState(null);

    const confirmReactivate = useCallback((guardian) => {
        setSelectedGuardian(guardian);
        setShowReactivateModal(true);
    }, []);

    const handleReactivate = useCallback(() => {
        if (selectedGuardian) {
            router.patch(`/guardians/${selectedGuardian.id}/reactivate`, {}, {
                onSuccess: () => { setShowReactivateModal(false); setSelectedGuardian(null); },
            });
        }
    }, [selectedGuardian]);

    return (
        <AuthenticatedLayout header="Inactive Guardians">
            <Head title="Inactive Guardians" />
            <div className="space-y-6">
                {/* Back link + summary pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <Link href="/guardians" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to All Guardians
                    </Link>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600">
                        <UserX className="w-4 h-4 text-slate-500" />
                        <span><strong className="text-slate-800">{total}</strong> inactive guardian{total !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* Search */}
                <div className="max-w-sm">
                    <SearchInput value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Search by name or email…" />
                </div>

                {/* Mobile list */}
                <div className="block md:hidden">
                    <MobileListContainer emptyState={{ icon: UserX, title: 'No inactive guardians', message: 'All guardians are currently active.' }}>
                        {allGuardians?.length > 0 && allGuardians.map((g) => (
                            <MobileInactiveGuardianItem key={g.id} guardian={g} auth={auth} onReactivate={confirmReactivate} />
                        ))}
                    </MobileListContainer>
                    {guardians.data?.length > 0 && (
                        <LoadMoreButton currentCount={allGuardians.length} totalCount={guardians.total} isLoading={isLoadingMore} onLoadMore={handleLoadMore} itemName="guardians" />
                    )}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    {['Guardian No','Name','Email','Phone','Relationship','Students','Deactivated On','Reason','Actions'].map(h => (
                                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {guardians.data.length === 0 ? (
                                    <tr><td colSpan={9} className="px-6 py-12 text-center">
                                        <UserX className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No inactive guardians found.</p>
                                    </td></tr>
                                ) : guardians.data.map((g) => (
                                    <tr key={g.id} className="hover:bg-slate-50 transition-colors bg-gray-50/40">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">{g.guardian_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 line-through">{g.user?.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{g.user?.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{g.phone_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 capitalize">{g.relationship}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                <Users className="w-3 h-3 mr-1" />{g.students?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {g.deactivated_at ? new Date(g.deactivated_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate italic">{g.deactivation_reason || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                            <Link href={`/guardians/${g.id}`} className="inline-flex items-center text-blue-500 hover:text-blue-700 transition-colors" title="View"><Eye className="w-4 h-4" /></Link>
                                            {auth.user.role === 'admin' && (<>
                                                <Link href={`/guardians/${g.id}/edit`} className="inline-flex items-center text-orange-400 hover:text-orange-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></Link>
                                                <button onClick={() => confirmReactivate(g)} className="inline-flex items-center text-emerald-500 hover:text-emerald-700 transition-colors" title="Reactivate"><UserCheck className="w-4 h-4" /></button>
                                            </>)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={guardians.links} currentPage={guardians.current_page} lastPage={guardians.last_page} total={guardians.total} from={guardians.from} to={guardians.to} />
                </div>
            </div>

            <ConfirmationModal
                show={showReactivateModal}
                onClose={() => setShowReactivateModal(false)}
                onConfirm={handleReactivate}
                title="Reactivate Guardian"
                message={`Reactivate ${selectedGuardian?.user?.name}? Their linked students will remain inactive — reactivate each student individually if needed.`}
                confirmText="Reactivate"
                type="success"
            />
        </AuthenticatedLayout>
    );
}
