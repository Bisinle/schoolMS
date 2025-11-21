import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import UserStatsCards from "@/Components/Users/UserStatsCards";
import UserFilters from "@/Components/Users/UserFilters";
import UserPasswordModal from "@/Components/Users/UserPasswordModal";
import ConfirmationModal from "@/Components/ConfirmationModal";
import ImpersonateButton from "@/Components/ImpersonateButton";
import { useState, useEffect } from "react";
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

// Mobile List Item Component
function MobileUserItem({ user, auth, roles, getRoleBadgeColor, onDelete, onResetPassword, onToggleStatus }) {
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

    return (
        <div className="relative bg-white border-b border-gray-200 overflow-hidden">
            {/* Swipe Actions Background */}
            {swipeAction === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-l from-blue-500 to-indigo-600 flex items-center justify-end px-4 gap-2 z-10">
                    <Link
                        href={route("users.show", user.id)}
                        className="p-3 bg-white/20 rounded-xl backdrop-blur-sm active:scale-95 transition-transform"
                        onClick={() => setSwipeAction(null)}
                    >
                        <Eye className="w-5 h-5 text-white" />
                    </Link>
                    <Link
                        href={route("users.edit", user.id)}
                        className="p-3 bg-white/20 rounded-xl backdrop-blur-sm active:scale-95 transition-transform"
                        onClick={() => setSwipeAction(null)}
                    >
                        <Edit className="w-5 h-5 text-white" />
                    </Link>
                    <button
                        onClick={() => {
                            onDelete(user);
                            setSwipeAction(null);
                        }}
                        className="p-3 bg-white/20 rounded-xl backdrop-blur-sm active:scale-95 transition-transform"
                    >
                        <Trash2 className="w-5 h-5 text-white" />
                    </button>
                </div>
            )}
            {swipeAction === 'secondary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-start px-4 gap-2 z-10">
                    <button
                        onClick={() => {
                            onResetPassword(user);
                            setSwipeAction(null);
                        }}
                        className="p-3 bg-white/20 rounded-xl backdrop-blur-sm active:scale-95 transition-transform"
                    >
                        <Key className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={() => {
                            onToggleStatus(user);
                            setSwipeAction(null);
                        }}
                        className="p-3 bg-white/20 rounded-xl backdrop-blur-sm active:scale-95 transition-transform"
                    >
                        <Power className="w-5 h-5 text-white" />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div
                {...handlers}
                className={`relative bg-white transition-transform duration-300 z-20 ${
                    swipeAction === 'primary' ? '-translate-x-36' :
                    swipeAction === 'secondary' ? 'translate-x-28' : ''
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
                            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg text-xl">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-gray-900 truncate leading-tight">
                                    {user.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                        {roles.find((r) => r.value === user.role)?.label || user.role}
                                    </span>
                                    {user.is_active ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Inactive
                                        </span>
                                    )}
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
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email / Username</p>
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
                                <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Created By</p>
                                    <p className="text-sm font-bold text-gray-900">{user.creator?.name || "System"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href={route("users.show", user.id)}
                                    className="flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                >
                                    <Eye className="w-5 h-5" />
                                    View
                                </Link>
                                <Link
                                    href={route("users.edit", user.id)}
                                    className="flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                                >
                                    <Edit className="w-5 h-5" />
                                    Edit
                                </Link>
                            </div>
                            
                            <button
                                onClick={() => onResetPassword(user)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
                            >
                                <Key className="w-5 h-5" />
                                Reset Password
                            </button>
                            
                            <button
                                onClick={() => onToggleStatus(user)}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform ${
                                    user.is_active
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                }`}
                            >
                                <Power className="w-5 h-5" />
                                {user.is_active ? 'Deactivate User' : 'Activate User'}
                            </button>
                            
                            <button
                                onClick={() => onDelete(user)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform"
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

export default function Index({ auth, users, stats, filters, roles, flash }) {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState("");
    const [passwordUserName, setPasswordUserName] = useState("");
    const [openMenuId, setOpenMenuId] = useState(null);

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
                                                        onClick={() =>
                                                            setOpenMenuId(
                                                                openMenuId ===
                                                                    user.id
                                                                    ? null
                                                                    : user.id
                                                            )
                                                        }
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
                                                                        index >
                                                                        users
                                                                            .data
                                                                            .length -
                                                                            4
                                                                            ? "bottom-full mb-2"
                                                                            : "mt-2"
                                                                    }`}
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