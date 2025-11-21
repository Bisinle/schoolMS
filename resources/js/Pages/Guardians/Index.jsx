import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Users, ChevronDown, ChevronUp, Mail, Phone, MapPin, UserCircle } from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { useSwipeable } from 'react-swipeable';

// Mobile List Item Component
function MobileGuardianItem({ guardian, auth, onDelete }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [swipeAction, setSwipeAction] = useState(null);

    const handlers = useSwipeable({
        onSwipedLeft: () => setSwipeAction('primary'),
        onSwipedRight: () => setSwipeAction('secondary'),
        onSwiping: () => {},
        trackMouse: false,
        preventScrollOnSwipe: false,
        delta: 60,
    });

    return (
        <div className="relative bg-white border-b border-gray-200 overflow-hidden">
            {/* Swipe Actions Background */}
            {swipeAction === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500 to-indigo-600 flex items-center justify-end px-6 gap-3 z-10">
                    <Link
                        href={`/guardians/${guardian.id}`}
                        className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm active:scale-95 transition-transform"
                        onClick={() => setSwipeAction(null)}
                    >
                        <Eye className="w-6 h-6 text-white" />
                    </Link>
                    {auth.user.role === 'admin' && (
                        <>
                            <Link
                                href={`/guardians/${guardian.id}/edit`}
                                className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm active:scale-95 transition-transform"
                                onClick={() => setSwipeAction(null)}
                            >
                                <Edit className="w-6 h-6 text-white" />
                            </Link>
                            <button
                                onClick={() => {
                                    onDelete(guardian);
                                    setSwipeAction(null);
                                }}
                                className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm active:scale-95 transition-transform"
                            >
                                <Trash2 className="w-6 h-6 text-white" />
                            </button>
                        </>
                    )}
                </div>
            )}
            {swipeAction === 'secondary' && guardian.phone_number && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-start px-6 gap-3 z-10">
                    <a
                        href={`tel:${guardian.phone_number}`}
                        className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm active:scale-95 transition-transform"
                        onClick={() => setSwipeAction(null)}
                    >
                        <Phone className="w-6 h-6 text-white" />
                    </a>
                    {guardian.user?.email && (
                        <a
                            href={`mailto:${guardian.user.email}`}
                            className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm active:scale-95 transition-transform"
                            onClick={() => setSwipeAction(null)}
                        >
                            <Mail className="w-6 h-6 text-white" />
                        </a>
                    )}
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? '-translate-x-44' :
                    swipeAction === 'secondary' ? 'translate-x-44' : ''
                }`}
                onClick={() => {
                    if (swipeAction) {
                        setSwipeAction(null);
                    }
                }}
            >
                {/* Summary Row */}
                <div
                    className="p-5 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => {
                        if (!swipeAction) {
                            setIsExpanded(!isExpanded);
                        }
                    }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-xl">
                                {guardian.user?.name.charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-gray-900 truncate leading-tight">
                                    {guardian.user?.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                        <Users className="w-3 h-3 mr-1" />
                                        {guardian.students?.length || 0} Student{guardian.students?.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <button className="flex-shrink-0 p-2 -mr-2 active:bg-gray-100 rounded-lg transition-colors">
                            {isExpanded ? (
                                <ChevronUp className="w-6 h-6 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-6 h-6 text-gray-500" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4 bg-gray-50">
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                                    <p className="text-sm font-bold text-gray-900 break-words">{guardian.user?.email}</p>
                                </div>
                            </div>
                            
                            {guardian.phone_number && (
                                <>
                                    <div className="border-t border-gray-100"></div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Phone</p>
                                            <p className="text-sm font-bold text-gray-900">{guardian.phone_number}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            <div className="border-t border-gray-100"></div>
                            
                            <div className="flex items-start gap-3">
                                <UserCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Relationship</p>
                                    <p className="text-sm font-bold text-gray-900 capitalize">{guardian.relationship}</p>
                                </div>
                            </div>
                            
                            {guardian.address && (
                                <>
                                    <div className="border-t border-gray-100"></div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Address</p>
                                            <p className="text-sm font-bold text-gray-900">{guardian.address}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {guardian.students && guardian.students.length > 0 && (
                                <>
                                    <div className="border-t border-gray-100"></div>
                                    <div className="flex items-start gap-3">
                                        <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Linked Students</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {guardian.students.map((student) => (
                                                    <span key={student.id} className="inline-flex px-2 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">
                                                        {student.first_name} {student.last_name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href={`/guardians/${guardian.id}`}
                                    className="flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                >
                                    <Eye className="w-5 h-5" />
                                    View
                                </Link>
                                {auth.user.role === 'admin' && (
                                    <Link
                                        href={`/guardians/${guardian.id}/edit`}
                                        className="flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                    >
                                        <Edit className="w-5 h-5" />
                                        Edit
                                    </Link>
                                )}
                            </div>
                            
                            {guardian.phone_number && (
                                <a
                                    href={`tel:${guardian.phone_number}`}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                >
                                    <Phone className="w-5 h-5" />
                                    Call Guardian
                                </a>
                            )}
                            
                            {auth.user.role === 'admin' && (
                                <button
                                    onClick={() => onDelete(guardian)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    Delete Guardian
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function GuardiansIndex({ guardians, filters, auth }) {
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedGuardian, setSelectedGuardian] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/guardians', { search }, { preserveState: true });
    };

    const confirmDelete = (guardian) => {
        setSelectedGuardian(guardian);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (selectedGuardian) {
            router.delete(`/guardians/${selectedGuardian.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedGuardian(null);
                },
            });
        }
    };

    return (
        <AuthenticatedLayout header="Guardians Management">
            <Head title="Guardians" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <form onSubmit={handleSearch} className="flex-1 w-full sm:max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search guardians..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                            />
                        </div>
                    </form>

                    {auth.user.role === 'admin' && (
                        <Link
                            href="/guardians/create"
                            className="inline-flex items-center px-4 py-2.5 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Guardian
                        </Link>
                    )}
                </div>

                {/* Mobile List View */}
                <div className="block md:hidden bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {guardians.data && guardians.data.length > 0 ? (
                        guardians.data.map((guardian) => (
                            <MobileGuardianItem
                                key={guardian.id}
                                guardian={guardian}
                                auth={auth}
                                onDelete={confirmDelete}
                            />
                        ))
                    ) : (
                        <div className="px-6 py-16 text-center">
                            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold text-lg">No guardians found</p>
                            <p className="text-sm text-gray-400 mt-2">Try adjusting your search</p>
                        </div>
                    )}
                </div>

                {/* Desktop Table View - UNCHANGED */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
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