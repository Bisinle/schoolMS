import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import UserStatsCards from "@/Components/Users/UserStatsCards";
import UserFilters from "@/Components/Users/UserFilters";
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
    ChevronDown,
    ChevronUp,
    Mail,
    Phone,
    User,
} from "lucide-react";
import { useSwipeable } from 'react-swipeable';
import SwipeActionButton from '@/Components/SwipeActionButton';

// Mobile List Item Component
function MobileUserItem({ user, auth, roles, getRoleBadgeColor, onDelete, onResetPassword, onToggleStatus, onImpersonate }) {
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

    if (user.id === auth.user.id) {
        return null; // Don't show current user in mobile list
    }

    // Check if user can be impersonated (not an admin)
    const canImpersonate = !user.roles?.some(role => role.name === 'admin');

    return (
        <div className="relative bg-white border-b border-gray-200 overflow-hidden">
            {/* Swipe Actions Background */}
            {swipeAction === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500 to-indigo-600 flex items-center justify-end px-4 gap-2 z-10">
                    <SwipeActionButton
                        icon={<Eye className="w-5 h-5 text-white" />}
                        href={route("users.show", user.id)}
                        onClick={() => setSwipeAction(null)}
                    />
                    <SwipeActionButton
                        icon={<Edit className="w-5 h-5 text-white" />}
                        href={route("users.edit", user.id)}
                        onClick={() => setSwipeAction(null)}
                    />
                    <SwipeActionButton
                        icon={<Trash2 className="w-5 h-5 text-white" />}
                        onClick={() => {
                            onDelete(user);
                            setSwipeAction(null);
                        }}
                    />
                </div>
            )}
            {swipeAction === 'secondary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-start px-4 gap-2 z-10">
                    {canImpersonate && (
                        <SwipeActionButton
                            icon={
                                <svg
                                    className="w-5 h-5 text-white"
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
                            }
                            onClick={() => {
                                onImpersonate(user);
                                setSwipeAction(null);
                            }}
                        />
                    )}
                    <SwipeActionButton
                        icon={<Key className="w-5 h-5 text-white" />}
                        onClick={() => {
                            onResetPassword(user);
                            setSwipeAction(null);
                        }}
                    />
                    <SwipeActionButton
                        icon={<Power className="w-5 h-5 text-white" />}
                        onClick={() => {
                            onToggleStatus(user);
                            setSwipeAction(null);
                        }}
                    />
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? '-translate-x-44' :
                    swipeAction === 'secondary' ? (canImpersonate ? 'translate-x-44' : 'translate-x-32') : ''
                }`}
                onClick={() => {
                    if (swipeAction) {
                        setSwipeAction(null);
                    }
                }}
            >
                {/* Summary Row - Compact Design */}
                <div
                    className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => {
                        if (!swipeAction) {
                            setIsExpanded(!isExpanded);
                        }
                    }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-bold text-gray-900 truncate">
                                    {user.name}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
                                    user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <p className="text-xs text-gray-600 truncate mb-2">{user.email}</p>

                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${getRoleBadgeColor(user.role)}`}>
                                    {roles.find((r) => r.value === user.role)?.label || user.role}
                                </span>
                                {user.phone && (
                                    <>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-xs text-gray-500">{user.phone}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Expanded Details - Compact Design */}
                {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3 bg-gray-50">
                        <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                            {user.creator && (
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-600">Created by: {user.creator.name}</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                href={route("users.show", user.id)}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                View
                            </Link>
                            <Link
                                href={route("users.edit", user.id)}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                            >
                                <Edit className="w-3.5 h-3.5" />
                                Edit
                            </Link>

                            {canImpersonate && (
                                <button
                                    onClick={() => onImpersonate(user)}
                                    className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
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
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-600 text-white rounded-lg text-xs font-medium hover:bg-yellow-700 transition-colors"
                            >
                                <Key className="w-3.5 h-3.5" />
                                Reset
                            </button>

                            <button
                                onClick={() => onToggleStatus(user)}
                                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    user.is_active
                                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                            >
                                <Power className="w-3.5 h-3.5" />
                                {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>

                            <button
                                onClick={() => onDelete(user)}
                                className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete User
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Index({ auth, users, stats, filters, roles, flash }) {
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

    const getRoleBadgeColor = (role) => {
        const colors = {
            admin: "bg-purple-100 text-purple-800",
            teacher: "bg-blue-100 text-blue-800",
            guardian: "bg-green-100 text-green-800",
            accountant: "bg-yellow-100 text-yellow-800",
            receptionist: "bg-pink-100 text-pink-800",
            nurse: "bg-red-100 text-red-800",
            it_staff: "bg-indigo-100 text-indigo-800",
            maid: "bg-gray-100 text-gray-800",
            cook: "bg-orange-100 text-orange-800",
        };
        return colors[role] || "bg-gray-100 text-gray-800";
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

            {/* Filters */}
            <UserFilters filters={filters} roles={roles} />

            {/* Mobile List View */}
            <div className="block md:hidden bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                {users.data.filter(u => u.id !== auth.user.id).length > 0 ? (
                    users.data.map((user) => (
                        <MobileUserItem
                            key={user.id}
                            user={user}
                            auth={auth}
                            roles={roles}
                            getRoleBadgeColor={getRoleBadgeColor}
                            onDelete={handleDeleteClick}
                            onResetPassword={handleResetPasswordClick}
                            onToggleStatus={handleToggleStatusClick}
                            onImpersonate={handleImpersonateClick}
                        />
                    ))
                ) : (
                    <div className="px-6 py-16 text-center">
                        <UserPlus className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-bold text-lg">No users found</p>
                        <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
                    </div>
                )}
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
                                            colSpan="6"
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
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                                                        user.role
                                                    )}`}
                                                >
                                                    {roles.find(
                                                        (r) =>
                                                            r.value ===
                                                            user.role
                                                    )?.label || user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm text-gray-700">
                                                    {user.phone || "N/A"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.is_active ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        Inactive
                                                    </span>
                                                )}
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