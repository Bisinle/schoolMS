import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import UserStatsCards from "@/Components/Users/UserStatsCards";
import UserPasswordModal from "@/Components/Users/UserPasswordModal";
import ConfirmationModal from "@/Components/ConfirmationModal";
import ImpersonateButton from "@/Components/ImpersonateButton";
import { useState, useEffect, useRef } from "react";
import {
    UserPlus,
    MoreVertical,
    Edit,
    Trash2,
    Key,
    Eye,
    Power,
    CheckCircle,
    XCircle,
    Mail,
    Phone,
    User,
} from "lucide-react";
import useFilters from '@/Hooks/useFilters';
import { SearchInput, FilterSelect, FilterBar } from '@/Components/Filters';
import { SwipeableListItem, ExpandableCard, MobileListContainer } from '@/Components/Mobile';
import { Badge } from '@/Components/UI';

// Helper to get role badge variant
function getRoleBadgeVariant(role) {
    const variants = {
        admin: 'primary',
        teacher: 'info',
        guardian: 'success',
    };
    return variants[role] || 'secondary';
}

// Mobile List Item Component - Refactored with new components
function MobileUserItem({ user, auth, roles, onDelete, onResetPassword, onToggleStatus, onImpersonate }) {
    if (user.id === auth.user.id) {
        return null; // Don't show current user in mobile list
    }

    // Check if user can be impersonated (not an admin)
    const canImpersonate = !user.roles?.some(role => role.name === 'admin');

    // Define swipe actions
    const primaryActions = [
        { icon: Eye, label: 'View', color: 'blue', href: `/users/${user.id}` },
        { icon: Edit, label: 'Edit', color: 'indigo', href: `/users/${user.id}/edit` },
        { icon: Trash2, label: 'Delete', color: 'red', onClick: () => onDelete(user) },
    ];

    // Custom impersonate icon component
    const ImpersonateIcon = ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
    );

    const secondaryActions = [
        ...(canImpersonate ? [{
            icon: ImpersonateIcon,
            label: 'Impersonate',
            color: 'purple',
            onClick: () => onImpersonate(user)
        }] : []),
        { icon: Key, label: 'Reset Password', color: 'yellow', onClick: () => onResetPassword(user) },
        { icon: Power, label: user.is_active ? 'Deactivate' : 'Activate', color: user.is_active ? 'orange' : 'green', onClick: () => onToggleStatus(user) },
    ];

    // Get role color scheme
    const getRoleColors = (role) => {
        const colors = {
            admin: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', icon: 'bg-blue-100', iconColor: 'text-blue-600', border: 'border-blue-200' },
            teacher: { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', icon: 'bg-purple-100', iconColor: 'text-purple-600', border: 'border-purple-200' },
            guardian: { bg: 'bg-gradient-to-br from-green-500 to-green-600', icon: 'bg-green-100', iconColor: 'text-green-600', border: 'border-green-200' },
        };
        return colors[role] || { bg: 'bg-gradient-to-br from-gray-500 to-gray-600', icon: 'bg-gray-100', iconColor: 'text-gray-600', border: 'border-gray-200' };
    };

    const roleColors = getRoleColors(user.role);

    // Header content with Badge component
    const header = (
        <div className="flex gap-3">
            {/* Left: Avatar with Role Color */}
            <div className="flex-shrink-0">
              
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
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                        {user.is_active ? (
                            <CheckCircle className="w-3 h-3" />
                        ) : (
                            <XCircle className="w-3 h-3" />
                        )}
                        {user.is_active ? 'Active' : 'Inactive'}
                    </div>
                </div>

                {/* Role Badge */}
                <div className="mb-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors.icon} ${roleColors.iconColor} border ${roleColors.border}`}>
                        <User className="w-3 h-3" />
                        {roles.find((r) => r.value === user.role)?.label || user.role}
                    </span>
                </div>

                {/* Email */}
                <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-3 h-3 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-700 truncate font-medium">{user.email}</p>
                </div>

                {/* Phone & Employee Number */}
                <div className="flex items-center gap-3 flex-wrap">
                    {user.phone && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded bg-green-50 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-xs text-gray-700 font-medium">{user.phone}</span>
                        </div>
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
            {user.creator && (
                <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Created By</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{user.creator.name}</p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                    href={route("users.show", user.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow active:scale-95"
                >
                    <Eye className="w-3.5 h-3.5" />
                    View
                </Link>
                <Link
                    href={route("users.edit", user.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg text-xs font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow active:scale-95"
                >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                </Link>

                {canImpersonate && (
                    <button
                        onClick={() => onImpersonate(user)}
                        className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-xs font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm hover:shadow active:scale-95"
                    >
                        <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                        </svg>
                        Login As User
                    </button>
                )}

                <button
                    onClick={() => onResetPassword(user)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg text-xs font-semibold hover:from-yellow-700 hover:to-yellow-800 transition-all shadow-sm hover:shadow active:scale-95"
                >
                    <Key className="w-3.5 h-3.5" />
                    Reset
                </button>

                <button
                    onClick={() => onToggleStatus(user)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow active:scale-95 ${
                        user.is_active
                            ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800'
                            : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                    }`}
                >
                    <Power className="w-3.5 h-3.5" />
                    {user.is_active ? 'Deactivate' : 'Activate'}
                </button>

                <button
                    onClick={() => onDelete(user)}
                    className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-xs font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-sm hover:shadow active:scale-95"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete User
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

export default function Index({ auth, users, stats, filters: initialFilters = {}, roles, flash }) {
    // Use the new useFilters hook
    const { filters, updateFilter, clearFilters } = useFilters({
        route: '/users',
        initialFilters: {
            search: initialFilters.search || '',
            role: initialFilters.role || '',
            status: initialFilters.status || '',
        },
    });

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState("");
    const [passwordUserName, setPasswordUserName] = useState("");
    const [openMenuId, setOpenMenuId] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({});
    const buttonRefs = useRef({});

    // Confirmation modal state
    const [confirmAction, setConfirmAction] = useState({
        show: false,
        title: "",
        message: "",
        confirmText: "",
        type: "danger",
        onConfirm: () => {},
    });

    // Show password modal if password was generated
    useEffect(() => {
        if (flash?.generated_password) {
            setGeneratedPassword(flash.generated_password);
            setPasswordUserName(flash.user_name || "the user");
            setShowPasswordModal(true);
        }
    }, [flash]);

    const closeConfirmation = () => {
        setConfirmAction({
            show: false,
            title: "",
            message: "",
            confirmText: "",
            type: "danger",
            onConfirm: () => {},
        });
    };

    const handleDeleteClick = (user) => {
        setConfirmAction({
            show: true,
            title: "Delete User",
            message: `Are you sure you want to delete ${user.name}? This action cannot be undone and will permanently remove all associated data.`,
            confirmText: "Delete User",
            type: "danger",
            onConfirm: () => {
                router.delete(route("users.destroy", user.id), {
                    preserveScroll: true,
                    onSuccess: () => closeConfirmation(),
                });
            },
        });
    };

    const handleResetPasswordClick = (user) => {
        setConfirmAction({
            show: true,
            title: "Reset Password",
            message: `Reset password for ${user.name}? A new temporary password will be generated and the user will be required to change it on their next login.`,
            confirmText: "Reset Password",
            type: "warning",
            onConfirm: () => {
                router.post(
                    route("users.reset-password", user.id),
                    {},
                    {
                        preserveScroll: true,
                        onSuccess: (page) => {
                            closeConfirmation();
                            if (page.props.flash?.generated_password) {
                                setGeneratedPassword(
                                    page.props.flash.generated_password
                                );
                                setPasswordUserName(user.name);
                                setShowPasswordModal(true);
                            }
                        },
                    }
                );
            },
        });
    };

    const handleToggleStatusClick = (user) => {
        const action = user.is_active ? "deactivate" : "activate";
        const actionCapitalized =
            action.charAt(0).toUpperCase() + action.slice(1);

        setConfirmAction({
            show: true,
            title: `${actionCapitalized} User`,
            message: user.is_active
                ? `Are you sure you want to deactivate ${user.name}? They will not be able to log in to the system until reactivated.`
                : `Are you sure you want to activate ${user.name}? They will be able to log in to the system.`,
            confirmText: `${actionCapitalized} User`,
            type: user.is_active ? "warning" : "info",
            onConfirm: () => {
                router.post(
                    route("users.toggle-status", user.id),
                    {},
                    {
                        preserveScroll: true,
                        onSuccess: () => closeConfirmation(),
                    }
                );
            },
        });
    };

    const handleImpersonateClick = (user) => {
        setConfirmAction({
            show: true,
            title: "Confirm User Impersonation",
            message: (
                <div className="space-y-3">
                    <p>You are about to login as:</p>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="font-semibold text-purple-900">{user.name}</p>
                        <p className="text-sm text-purple-700 mt-1">
                            Role: <span className="font-medium">{user.role}</span>
                        </p>
                        <p className="text-sm text-purple-600 mt-1">{user.email}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                            ⚠️ You will see the system exactly as this user sees it.
                            A purple banner will appear at the top allowing you to exit back to admin mode.
                        </p>
                    </div>
                </div>
            ),
            confirmText: "Yes, Login As User",
            type: "info",
            confirmButtonClass: "bg-purple-600 hover:bg-purple-700",
            onConfirm: () => {
                router.get(
                    route('impersonate', user.id),
                    {},
                    {
                        preserveState: false,
                        preserveScroll: false,
                        onSuccess: () => closeConfirmation(),
                    }
                );
            },
        });
    };

    return (
        <AuthenticatedLayout header="User Management">
            <Head title="Users" />

            {/* Success/Error Messages */}
            {flash?.success && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <p className="text-sm font-medium text-green-800">
                        {flash.success}
                    </p>
                </div>
            )}

            {flash?.error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <p className="text-sm font-medium text-red-800">
                        {flash.error}
                    </p>
                </div>
            )}

            {/* Stats Cards */}
            <UserStatsCards stats={stats} />

            {/* Filters - Refactored with FilterBar */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <FilterBar onClear={clearFilters} gridCols="3">
                    <SearchInput
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        placeholder="Search by name, email..."
                        label="Search"
                    />
                    <FilterSelect
                        value={filters.role}
                        onChange={(e) => updateFilter('role', e.target.value)}
                        options={roles.map(role => ({ value: role.value, label: role.label }))}
                        allLabel="All Roles"
                        label="Role"
                    />
                    <FilterSelect
                        value={filters.status}
                        onChange={(e) => updateFilter('status', e.target.value)}
                        options={[
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' }
                        ]}
                        allLabel="All Status"
                        label="Status"
                    />
                </FilterBar>
            </div>

            {/* Mobile List View - Refactored with MobileListContainer */}
            <div className=" block md:hidden mb-6">
                <MobileListContainer
                    emptyState={{
                        icon: UserPlus,
                        title: 'No users found',
                        message: filters.search || filters.role || filters.status ? 'Try adjusting your filters' : 'Add your first user',
                        action: {
                            label: 'Add User',
                            href: route("users.create"),
                            icon: UserPlus,
                        }
                    }}
                >
                    {users.data.filter(u => u.id !== auth.user.id).length > 0 && users.data.map((user) => (
                        <MobileUserItem
                            key={user.id}
                            user={user}
                            auth={auth}
                            roles={roles}
                            onDelete={handleDeleteClick}
                            onResetPassword={handleResetPasswordClick}
                            onToggleStatus={handleToggleStatusClick}
                            onImpersonate={handleImpersonateClick}
                        />
                    ))}
                </MobileListContainer>
            </div>

            {/* Desktop Table View - UNCHANGED */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-navy">
                            All Users
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage system users and their access levels
                        </p>
                    </div>
                    <Link
                        href={route("users.create")}
                        className="inline-flex items-center px-4 py-2.5 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Add User
                    </Link>
                </div>

                {/* Table Container - Rest of your existing desktop table code stays exactly the same */}
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Created By
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-12 text-center"
                                        >
                                            <p className="text-gray-500">
                                                No users found
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user, index) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.employee_number || user.teacher?.employee_number || user.guardian?.guardian_number ? (
                                                    <Badge
                                                        variant="primary"
                                                        value={user.employee_number || user.teacher?.employee_number || user.guardian?.guardian_number}
                                                        size="sm"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-orange flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                        {user.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-semibold text-navy">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant={getRoleBadgeVariant(user.role)}
                                                    value={roles.find((r) => r.value === user.role)?.label || user.role}
                                                    size="sm"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm text-gray-700">
                                                    {user.phone || "N/A"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant="status"
                                                    value={
                                                        <span className="inline-flex items-center gap-1">
                                                            {user.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                            {user.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    }
                                                    size="sm"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm text-gray-700">
                                                    {user.creator?.name ||
                                                        "System"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        ref={(el) => buttonRefs.current[user.id] = el}
                                                        onClick={() => {
                                                            if (openMenuId === user.id) {
                                                                setOpenMenuId(null);
                                                            } else {
                                                                setOpenMenuId(user.id);
                                                                // Calculate position
                                                                const buttonEl = buttonRefs.current[user.id];
                                                                if (buttonEl) {
                                                                    const rect = buttonEl.getBoundingClientRect();
                                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                                    const spaceAbove = rect.top;
                                                                    // If less than 300px below, show above
                                                                    setDropdownPosition({
                                                                        [user.id]: spaceBelow < 300 && spaceAbove > 300 ? 'top' : 'bottom'
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        disabled={
                                                            user.id ===
                                                            auth.user.id
                                                        }
                                                    >
                                                        <MoreVertical className="w-5 h-5 text-gray-600" />
                                                    </button>

                                                    {openMenuId === user.id &&
                                                        user.id !==
                                                            auth.user.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() =>
                                                                        setOpenMenuId(
                                                                            null
                                                                        )
                                                                    }
                                                                ></div>

                                                                <div
                                                                    className={`absolute right-0 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20 ${
                                                                        dropdownPosition[user.id] === 'top'
                                                                            ? "bottom-full mb-2"
                                                                            : "mt-2"
                                                                    }`}
                                                                    style={{
                                                                        maxHeight: '400px',
                                                                        overflowY: 'auto'
                                                                    }}
                                                                >
                                                                    <div className="py-1">
                                                                        <Link
                                                                            href={route(
                                                                                "users.show",
                                                                                user.id
                                                                            )}
                                                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                                            onClick={() =>
                                                                                setOpenMenuId(
                                                                                    null
                                                                                )
                                                                            }
                                                                        >
                                                                            <Eye className="w-4 h-4 mr-3 text-gray-500" />
                                                                            View
                                                                            Details
                                                                        </Link>
                                                                        <Link
                                                                            href={route(
                                                                                "users.edit",
                                                                                user.id
                                                                            )}
                                                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                                            onClick={() =>
                                                                                setOpenMenuId(
                                                                                    null
                                                                                )
                                                                            }
                                                                        >
                                                                            <Edit className="w-4 h-4 mr-3 text-gray-500" />
                                                                            Edit
                                                                            User
                                                                        </Link>
                                                                        <button
                                                                            onClick={() => {
                                                                                setOpenMenuId(
                                                                                    null
                                                                                );
                                                                                handleResetPasswordClick(
                                                                                    user
                                                                                );
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                                        >
                                                                            <Key className="w-4 h-4 mr-3 text-gray-500" />
                                                                            Reset
                                                                            Password
                                                                        </button>

                                                                        {!user.roles?.some(role => role.name === 'admin') && (
                                                                            <ImpersonateButton
                                                                                user={user}
                                                                            />
                                                                        )}

                                                                        <hr className="my-1" />
                                                                        <button
                                                                            onClick={() => {
                                                                                setOpenMenuId(
                                                                                    null
                                                                                );
                                                                                handleToggleStatusClick(
                                                                                    user
                                                                                );
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                                        >
                                                                            <Power className="w-4 h-4 mr-3 text-gray-500" />
                                                                            {user.is_active
                                                                                ? "Deactivate"
                                                                                : "Activate"}
                                                                        </button>
                                                                        <hr className="my-1" />
                                                                        <button
                                                                            onClick={() => {
                                                                                setOpenMenuId(
                                                                                    null
                                                                                );
                                                                                handleDeleteClick(
                                                                                    user
                                                                                );
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                                        >
                                                                            <Trash2 className="w-4 h-4 mr-3" />
                                                                            Delete
                                                                            User
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {users.links.length > 3 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                            Showing {users.from} to {users.to} of {users.total}{" "}
                            users
                        </div>
                        <div className="flex gap-2">
                            {users.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || "#"}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        link.active
                                            ? "bg-orange text-white"
                                            : link.url
                                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
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

            {/* Confirmation Modal */}
            <ConfirmationModal
                show={confirmAction.show}
                onClose={closeConfirmation}
                onConfirm={confirmAction.onConfirm}
                title={confirmAction.title}
                message={confirmAction.message}
                confirmText={confirmAction.confirmText}
                type={confirmAction.type}
            />

            {/* Password Modal */}
            <UserPasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                password={generatedPassword}
                userName={passwordUserName}
            />
        </AuthenticatedLayout>
    );
}