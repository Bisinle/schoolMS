import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    Eye,
    Power,
    Trash2,
    RefreshCw,
    Mail,
    Phone,
    School as SchoolIcon,
    User,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import ConfirmationModal from "@/Components/ConfirmationModal";
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from "@/Components/UI";

// Helper to get role badge variant
function getRoleBadgeVariant(role) {
    const variants = {
        admin: "primary",
        teacher: "info",
        guardian: "success",
        accountant: "warning",
        receptionist: "secondary",
        nurse: "danger",
        it_staff: "secondary",
    };
    return variants[role] || "secondary";
}

// Mobile List Item Component - Refactored with new components
function MobileUserItem({ user, onToggleActive, onResetPassword, onDelete }) {
    // Get role color scheme
    const getRoleColors = (role) => {
        const colors = {
            admin: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', icon: 'bg-blue-100', iconColor: 'text-blue-600', border: 'border-blue-200' },
            teacher: { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', icon: 'bg-purple-100', iconColor: 'text-purple-600', border: 'border-purple-200' },
            guardian: { bg: 'bg-gradient-to-br from-green-500 to-green-600', icon: 'bg-green-100', iconColor: 'text-green-600', border: 'border-green-200' },
            accountant: { bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', icon: 'bg-yellow-100', iconColor: 'text-yellow-600', border: 'border-yellow-200' },
            receptionist: { bg: 'bg-gradient-to-br from-pink-500 to-pink-600', icon: 'bg-pink-100', iconColor: 'text-pink-600', border: 'border-pink-200' },
            nurse: { bg: 'bg-gradient-to-br from-red-500 to-red-600', icon: 'bg-red-100', iconColor: 'text-red-600', border: 'border-red-200' },
            it_staff: { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600', icon: 'bg-indigo-100', iconColor: 'text-indigo-600', border: 'border-indigo-200' },
        };
        return colors[role] || { bg: 'bg-gradient-to-br from-gray-500 to-gray-600', icon: 'bg-gray-100', iconColor: 'text-gray-600', border: 'border-gray-200' };
    };

    const roleColors = getRoleColors(user.role);

    // Define swipe actions
    const primaryActions = [
        { icon: Eye, label: 'View', href: `/super-admin/users/${user.id}` },
        { icon: RefreshCw, label: 'Reset Password', onClick: () => onResetPassword(user) },
    ];

    const secondaryActions = [
        { icon: Power, label: user.is_active ? 'Suspend' : 'Activate', onClick: () => onToggleActive(user) },
        { icon: Trash2, label: 'Delete', onClick: () => onDelete(user) },
    ];

    // Header content
    const header = (
        <div className="flex gap-3">
            {/* Left: Avatar with Role Color */}
            <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full ${roleColors.bg} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                    {user.name.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* Right: User Info */}
            <div className="flex-1 min-w-0">
                {/* Top Row: Name & Status */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-base font-bold text-gray-900 truncate leading-tight">
                        {user.name}
                    </h3>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        user.is_active
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                        {user.is_active ? 'Active' : 'Suspended'}
                    </div>
                </div>

                {/* Role Badge */}
                <div className="mb-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors.icon} ${roleColors.iconColor} border ${roleColors.border}`}>
                        <User className="w-3 h-3" />
                        {user.role.replace("_", " ")}
                    </span>
                </div>

                {/* Email */}
                <p className="text-xs text-gray-700 truncate font-medium mb-1.5">{user.email}</p>

                {/* School & Employee Number */}
                <div className="flex items-center gap-3 flex-wrap">
                    {user.school && (
                        <span className="text-xs text-gray-600 truncate font-medium">
                            🏫 {user.school.name}
                        </span>
                    )}
                    {(user.employee_number || user.teacher?.employee_number || user.guardian?.guardian_number) && (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">ID:</span>
                            <span className="text-xs font-semibold text-gray-700">
                                {user.employee_number || user.teacher?.employee_number || user.guardian?.guardian_number}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Expanded content
    const expandedContent = (
        <div className="px-4 pb-4 pt-3 space-y-3">
            {/* Info Section */}
            <div className="grid grid-cols-1 gap-2">
                {user.phone && (
                    <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                            <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">User ID</p>
                        <p className="text-sm font-medium text-gray-900">#{user.id}</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                    href={`/super-admin/users/${user.id}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow active:scale-95"
                >
                    <Eye className="w-3.5 h-3.5" />
                    View
                </Link>
                <button
                    onClick={() => onResetPassword(user)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg text-xs font-semibold hover:from-yellow-700 hover:to-yellow-800 transition-all shadow-sm hover:shadow active:scale-95"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset
                </button>
                <button
                    onClick={() => onToggleActive(user)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow active:scale-95 ${
                        user.is_active
                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                            : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                    }`}
                >
                    <Power className="w-3.5 h-3.5" />
                    {user.is_active ? 'Suspend' : 'Activate'}
                </button>
                <button
                    onClick={() => onDelete(user)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-red-700 to-red-800 text-white rounded-lg text-xs font-semibold hover:from-red-800 hover:to-red-900 transition-all shadow-sm hover:shadow active:scale-95"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                </button>
            </div>
        </div>
    );

    return (
        <SwipeableListItem
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
        >
            <ExpandableCard header={header}>
                {expandedContent}
            </ExpandableCard>
        </SwipeableListItem>
    );
}

export default function Index({ users, schools, filters: initialFilters = {} }) {
    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/super-admin/users',
        initialFilters: {
            search: initialFilters.search || '',
            school_id: initialFilters.school_id || '',
            role: initialFilters.role || '',
            is_active: initialFilters.is_active || '',
        },
    });

    // Modal states
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Filter options with useMemo
    const schoolOptions = useMemo(() => [
        { value: '', label: 'All Schools' },
        ...schools.map(school => ({ value: school.id, label: school.name }))
    ], [schools]);

    const roleOptions = useMemo(() => [
        { value: '', label: 'All Roles' },
        { value: 'admin', label: 'Admin' },
        { value: 'teacher', label: 'Teacher' },
        { value: 'guardian', label: 'Guardian' },
        { value: 'accountant', label: 'Accountant' },
        { value: 'receptionist', label: 'Receptionist' },
        { value: 'nurse', label: 'Nurse' },
        { value: 'it_staff', label: 'IT Staff' },
    ], []);

    const statusOptions = useMemo(() => [
        { value: '', label: 'All Status' },
        { value: '1', label: 'Active' },
        { value: '0', label: 'Suspended' },
    ], []);

    // Event handlers with useCallback
    const handleToggleActive = useCallback((user) => {
        setSelectedUser(user);
        setShowActivateModal(true);
    }, []);

    const confirmToggleActive = useCallback(() => {
        if (selectedUser) {
            router.post(
                `/super-admin/users/${selectedUser.id}/toggle-active`,
                {},
                {
                    onSuccess: () => {
                        setShowActivateModal(false);
                        setSelectedUser(null);
                    },
                }
            );
        }
    }, [selectedUser]);

    const handleResetPassword = useCallback((user) => {
        setSelectedUser(user);
        setShowResetPasswordModal(true);
    }, []);

    const confirmResetPassword = useCallback(() => {
        if (selectedUser) {
            router.post(
                `/super-admin/users/${selectedUser.id}/reset-password`,
                {},
                {
                    onSuccess: () => {
                        setShowResetPasswordModal(false);
                        setSelectedUser(null);
                    },
                }
            );
        }
    }, [selectedUser]);

    const handleDelete = useCallback((user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    }, []);

    const confirmDelete = useCallback(() => {
        if (selectedUser) {
            router.delete(`/super-admin/users/${selectedUser.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                },
            });
        }
    }, [selectedUser]);

    const activeFiltersCount = [
        search,
        schoolFilter,
        roleFilter,
        activeFilter,
    ].filter(Boolean).length;

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
                                    <p className="text-lg font-black text-gray-900">
                                        Search & Filters
                                    </p>
                                    {activeFiltersCount > 0 && (
                                        <p className="text-xs text-indigo-600 font-semibold">
                                            {activeFiltersCount} active filter
                                            {activeFiltersCount > 1 ? "s" : ""}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <ChevronDown
                                className={`w-6 h-6 text-gray-400 transition-transform ${
                                    showFilters ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {/* Filter Form */}
                        <form
                            onSubmit={handleSearch}
                            className={`p-5 space-y-4 ${
                                showFilters ? "block" : "hidden"
                            }`}
                        >
                            {/* Search */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                                    Search
                                </label>
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
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                                    School
                                </label>
                                <select
                                    value={schoolFilter}
                                    onChange={(e) =>
                                        setSchoolFilter(e.target.value)
                                    }
                                    className="block w-full px-4 py-4 border-2 border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base font-medium"
                                >
                                    <option value="">All Schools</option>
                                    {schools.map((school) => (
                                        <option
                                            key={school.id}
                                            value={school.id}
                                        >
                                            {school.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Role Filter */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                                    Role
                                </label>
                                <select
                                    value={roleFilter}
                                    onChange={(e) =>
                                        setRoleFilter(e.target.value)
                                    }
                                    className="block w-full px-4 py-4 border-2 border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base font-medium"
                                >
                                    <option value="">All Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="guardian">Guardian</option>
                                    <option value="accountant">
                                        Accountant
                                    </option>
                                    <option value="receptionist">
                                        Receptionist
                                    </option>
                                    <option value="nurse">Nurse</option>
                                    <option value="it_staff">IT Staff</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                                    Status
                                </label>
                                <select
                                    value={activeFilter}
                                    onChange={(e) =>
                                        setActiveFilter(e.target.value)
                                    }
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
                                <p className="text-gray-500 font-bold text-lg">
                                    No users found
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Try adjusting your filters
                                </p>
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
                                            ID
                                        </th>
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
                                            <td
                                                colSpan="6"
                                                className="px-6 py-12 text-center"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                        <Search className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-500 font-medium">
                                                        No users found
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.data.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    {user.employee_number ||
                                                    user.teacher
                                                        ?.employee_number ||
                                                    user.guardian
                                                        ?.guardian_number ? (
                                                        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-md bg-navy text-white">
                                                            {user.employee_number ||
                                                                user.teacher
                                                                    ?.employee_number ||
                                                                user.guardian
                                                                    ?.guardian_number}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                            N/A
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                            {user.name
                                                                .charAt(0)
                                                                .toUpperCase()}
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
                                                        {user.school?.name ||
                                                            "N/A"}
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <Badge
                                                        variant={getRoleBadgeVariant(
                                                            user.role
                                                        )}
                                                        value={user.role
                                                            .replace("_", " ")
                                                            .toUpperCase()}
                                                        size="sm"
                                                    />
                                                </td>
                                                <td className="hidden sm:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <Badge
                                                        variant="status"
                                                        value={
                                                            user.is_active
                                                                ? "Active"
                                                                : "Inactive"
                                                        }
                                                        size="sm"
                                                    />
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={route(
                                                                "super-admin.users.show",
                                                                user.id
                                                            )}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() =>
                                                                handleToggleActive(
                                                                    user
                                                                )
                                                            }
                                                            className={`p-2 rounded-lg transition-colors ${
                                                                user.is_active
                                                                    ? "text-red-600 hover:bg-red-50"
                                                                    : "text-green-600 hover:bg-green-50"
                                                            }`}
                                                            title={
                                                                user.is_active
                                                                    ? "Suspend"
                                                                    : "Activate"
                                                            }
                                                        >
                                                            <Power className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleResetPassword(
                                                                    user
                                                                )
                                                            }
                                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                            title="Reset Password"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    user
                                                                )
                                                            }
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
                                            href={link.url || "#"}
                                            className={`px-3 py-2 text-sm border rounded-lg font-medium transition-all ${
                                                link.active
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                            } ${
                                                !link.url
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : ""
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
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
                        title={
                            selectedUser.is_active
                                ? "Suspend User"
                                : "Activate User"
                        }
                        message={`Are you sure you want to ${
                            selectedUser.is_active ? "suspend" : "activate"
                        } ${selectedUser.name}?`}
                        confirmText={
                            selectedUser.is_active ? "Suspend" : "Activate"
                        }
                        type={selectedUser.is_active ? "danger" : "info"}
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
