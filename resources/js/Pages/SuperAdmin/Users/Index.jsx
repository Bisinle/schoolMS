import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Eye, Power, Trash2, RefreshCw, Filter, ChevronDown, ChevronUp, Mail, Phone, School as SchoolIcon, User, X } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { useSwipeable } from 'react-swipeable';
import SwipeActionButton from '@/Components/SwipeActionButton';

// Mobile List Item Component - Redesigned
function MobileUserItem({ user, onToggleActive, onResetPassword, onDelete, getRoleBadgeColor }) {
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
                    <SwipeActionButton
                        icon={<Eye className="w-6 h-6 text-white" />}
                        href={route('super-admin.users.show', user.id)}
                        onClick={() => setSwipeAction(null)}
                        size="large"
                    />
                    <SwipeActionButton
                        icon={<RefreshCw className="w-6 h-6 text-white" />}
                        onClick={() => {
                            onResetPassword(user);
                            setSwipeAction(null);
                        }}
                        size="large"
                    />
                </div>
            )}
            {swipeAction === 'secondary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-start px-6 gap-3 z-10">
                    <SwipeActionButton
                        icon={<Power className="w-6 h-6 text-white" />}
                        onClick={() => {
                            onToggleActive(user);
                            setSwipeAction(null);
                        }}
                        size="large"
                    />
                    <SwipeActionButton
                        icon={<Trash2 className="w-6 h-6 text-white" />}
                        onClick={() => {
                            onDelete(user);
                            setSwipeAction(null);
                        }}
                        size="large"
                    />
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
                {/* Summary Row - Touch Optimized */}
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
                            {/* Avatar - Larger */}
                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-xl">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-gray-900 truncate leading-tight">{user.name}</h3>
                                <p className="text-sm text-gray-600 truncate mt-1">{user.email}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className={`inline-flex px-3 py-1 text-xs font-black rounded-full bg-gradient-to-r ${getRoleBadgeColor(user.role)} text-white shadow-md`}>
                                        {user.role.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {user.is_active ? '● Active' : '● Suspended'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Expand Button - Larger Touch Target */}
                        <button className="flex-shrink-0 p-2 -mr-2 active:bg-gray-100 rounded-lg transition-colors">
                            {isExpanded ? (
                                <ChevronUp className="w-6 h-6 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-6 h-6 text-gray-500" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Expanded Details - Redesigned */}
                {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4 bg-gray-50">
                        {/* Info Card */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                                    <p className="text-sm font-bold text-gray-900 break-words">{user.email}</p>
                                </div>
                            </div>
                            
                            {user.phone && (
                                <>
                                    <div className="border-t border-gray-100"></div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Phone</p>
                                            <p className="text-sm font-bold text-gray-900">{user.phone}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            <div className="border-t border-gray-100"></div>
                            <div className="flex items-start gap-3">
                                <SchoolIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">School</p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{user.school?.name || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-100"></div>
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">User ID</p>
                                    <p className="text-sm font-bold text-gray-900">#{user.id}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Larger & More Spacing */}
                        <div className="space-y-3 pt-2">
                            {/* Primary Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href={route('super-admin.users.show', user.id)}
                                    className="flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                >
                                    <Eye className="w-5 h-5" />
                                    View
                                </Link>
                                <button
                                    onClick={() => onResetPassword(user)}
                                    className="flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Reset
                                </button>
                            </div>
                            
                            {/* Secondary Actions */}
                            <button
                                onClick={() => onToggleActive(user)}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform ${
                                    user.is_active
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                }`}
                            >
                                <Power className="w-5 h-5" />
                                {user.is_active ? 'Suspend User' : 'Activate User'}
                            </button>
                            
                            <button
                                onClick={() => onDelete(user)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                            >
                                <Trash2 className="w-5 h-5" />
                                Delete User
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Index({ users, schools, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [schoolFilter, setSchoolFilter] = useState(filters.school_id || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [activeFilter, setActiveFilter] = useState(filters.is_active || '');
    const [showFilters, setShowFilters] = useState(false);

    // Modal states
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('super-admin.users.index'), {
            search,
            school_id: schoolFilter,
            role: roleFilter,
            is_active: activeFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setSchoolFilter('');
        setRoleFilter('');
        setActiveFilter('');
        router.get(route('super-admin.users.index'));
    };

    const handleToggleActive = (user) => {
        setSelectedUser(user);
        setShowActivateModal(true);
    };

    const confirmToggleActive = () => {
        if (selectedUser) {
            router.post(route('super-admin.users.toggle-active', selectedUser.id), {}, {
                onSuccess: () => {
                    setShowActivateModal(false);
                    setSelectedUser(null);
                },
            });
        }
    };

    const handleResetPassword = (user) => {
        setSelectedUser(user);
        setShowResetPasswordModal(true);
    };

    const confirmResetPassword = () => {
        if (selectedUser) {
            router.post(route('super-admin.users.reset-password', selectedUser.id), {}, {
                onSuccess: () => {
                    setShowResetPasswordModal(false);
                    setSelectedUser(null);
                },
            });
        }
    };

    const handleDelete = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (selectedUser) {
            router.delete(route('super-admin.users.destroy', selectedUser.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                },
            });
        }
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            admin: 'from-purple-500 to-purple-600',
            teacher: 'from-blue-500 to-blue-600',
            guardian: 'from-green-500 to-green-600',
            accountant: 'from-yellow-500 to-yellow-600',
            receptionist: 'from-pink-500 to-pink-600',
            nurse: 'from-red-500 to-red-600',
            it_staff: 'from-gray-500 to-gray-600',
        };
        return colors[role] || 'from-gray-500 to-gray-600';
    };

    const activeFiltersCount = [search, schoolFilter, roleFilter, activeFilter].filter(Boolean).length;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl sm:text-2xl font-bold leading-tight text-gray-800">
                    All Users Management
                </h2>
            }
        >
            <Head title="All Users" />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Filters Card - Mobile Optimized */}
                    <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Filter Header */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="w-full p-5 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 active:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                    <Filter className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-lg font-black text-gray-900">Search & Filters</p>
                                    {activeFiltersCount > 0 && (
                                        <p className="text-xs text-indigo-600 font-semibold">{activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}</p>
                                    )}
                                </div>
                            </div>
                            <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Filter Form */}
                        <form onSubmit={handleSearch} className={`p-5 space-y-4 ${showFilters ? 'block' : 'hidden'}`}>
                            {/* Search */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Search</label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name or email..."
                                    className="block w-full px-4 py-4 border-2 border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base font-medium"
                                />
                            </div>

                            {/* School Filter */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">School</label>
                                <select
                                    value={schoolFilter}
                                    onChange={(e) => setSchoolFilter(e.target.value)}
                                    className="block w-full px-4 py-4 border-2 border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base font-medium"
                                >
                                    <option value="">All Schools</option>
                                    {schools.map((school) => (
                                        <option key={school.id} value={school.id}>
                                            {school.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Role Filter */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Role</label>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="block w-full px-4 py-4 border-2 border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base font-medium"
                                >
                                    <option value="">All Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="guardian">Guardian</option>
                                    <option value="accountant">Accountant</option>
                                    <option value="receptionist">Receptionist</option>
                                    <option value="nurse">Nurse</option>
                                    <option value="it_staff">IT Staff</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Status</label>
                                <select
                                    value={activeFilter}
                                    onChange={(e) => setActiveFilter(e.target.value)}
                                    className="block w-full px-4 py-4 border-2 border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base font-medium"
                                >
                                    <option value="">All Status</option>
                                    <option value="1">Active</option>
                                    <option value="0">Suspended</option>
                                </select>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-base font-black rounded-xl shadow-lg active:scale-95 transition-all"
                                >
                                    <Search className="w-5 h-5" />
                                    Search
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="inline-flex items-center justify-center px-5 py-4 bg-gray-100 text-gray-700 text-base font-bold rounded-xl active:bg-gray-200 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Mobile List View */}
                    <div className="block md:hidden bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {users.data.length === 0 ? (
                            <div className="px-6 py-16 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                                    <Search className="w-10 h-10 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-bold text-lg">No users found</p>
                                <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
                            </div>
                        ) : (
                            users.data.map((user) => (
                                <MobileUserItem
                                    key={user.id}
                                    user={user}
                                    onToggleActive={handleToggleActive}
                                    onResetPassword={handleResetPassword}
                                    onDelete={handleDelete}
                                    getRoleBadgeColor={getRoleBadgeColor}
                                />
                            ))
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            School
                                        </th>
                                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="hidden sm:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                        <Search className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-500 font-medium">No users found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.data.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 sm:px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold text-gray-900 truncate">
                                                                {user.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 font-medium">
                                                        {user.school?.name || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${getRoleBadgeColor(user.role)} text-white shadow-sm`}>
                                                        {user.role.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="hidden sm:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                                                        user.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {user.is_active ? 'Active' : 'Suspended'}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={route('super-admin.users.show', user.id)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleToggleActive(user)}
                                                            className={`p-2 rounded-lg transition-colors ${user.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                                            title={user.is_active ? 'Suspend' : 'Activate'}
                                                        >
                                                            <Power className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleResetPassword(user)}
                                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                            title="Reset Password"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.links.length > 3 && (
                            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <div className="flex flex-wrap gap-2">
                                    {users.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-2 text-sm border rounded-lg font-medium transition-all ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            preserveState
                                            preserveScroll
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modals */}
            {selectedUser && (
                <>
                    <ConfirmationModal
                        show={showActivateModal}
                        onClose={() => {
                            setShowActivateModal(false);
                            setSelectedUser(null);
                        }}
                        onConfirm={confirmToggleActive}
                        title={selectedUser.is_active ? 'Suspend User' : 'Activate User'}
                        message={`Are you sure you want to ${selectedUser.is_active ? 'suspend' : 'activate'} ${selectedUser.name}?`}
                        confirmText={selectedUser.is_active ? 'Suspend' : 'Activate'}
                        type={selectedUser.is_active ? 'danger' : 'info'}
                    />

                    <ConfirmationModal
                        show={showResetPasswordModal}
                        onClose={() => {
                            setShowResetPasswordModal(false);
                            setSelectedUser(null);
                        }}
                        onConfirm={confirmResetPassword}
                        title="Reset Password"
                        message={`Are you sure you want to reset the password for ${selectedUser.name}? A new password will be generated and sent to their email.`}
                        confirmText="Reset Password"
                        type="warning"
                    />

                    <ConfirmationModal
                        show={showDeleteModal}
                        onClose={() => {
                            setShowDeleteModal(false);
                            setSelectedUser(null);
                        }}
                        onConfirm={confirmDelete}
                        title="Delete User"
                        message={`Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`}
                        confirmText="Delete"
                        type="danger"
                    />
                </>
            )}
        </AuthenticatedLayout>
    );
}