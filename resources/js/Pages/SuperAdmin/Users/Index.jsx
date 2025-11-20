import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Eye, Power, Trash2, RefreshCw, Filter } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

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
                    {/* Filters Card */}
                    <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 text-lg font-bold text-gray-900 w-full justify-between sm:w-auto"
                            >
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-indigo-600" />
                                    <span>Search & Filters</span>
                                </div>
                                <span className="text-sm text-gray-500 sm:hidden">{showFilters ? 'Hide' : 'Show'}</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSearch} className={`p-4 sm:p-6 ${showFilters ? 'block' : 'hidden'} sm:block`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Search */}
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name or email..."
                                        className="block w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                    />
                                </div>

                                {/* School Filter */}
                                <div>
                                    <select
                                        value={schoolFilter}
                                        onChange={(e) => setSchoolFilter(e.target.value)}
                                        className="block w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
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
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="block w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
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

                                {/* Active Filter */}
                                <div>
                                    <select
                                        value={activeFilter}
                                        onChange={(e) => setActiveFilter(e.target.value)}
                                        className="block w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                    >
                                        <option value="">All Status</option>
                                        <option value="1">Active</option>
                                        <option value="0">Suspended</option>
                                    </select>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all duration-300"
                                    >
                                        <Search className="w-4 h-4" />
                                        <span className="hidden sm:inline">Search</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClearFilters}
                                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all duration-300"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        <span className="hidden sm:inline">Clear</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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