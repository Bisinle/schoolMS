import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import UserPasswordModal from '@/Components/Users/UserPasswordModal';
import { useState } from 'react';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Key,
    Power,
    Mail,
    Phone,
    Calendar,
    User,
    Shield,
    Clock,
    Activity,
    CheckCircle,
    XCircle,
} from 'lucide-react';

export default function Show({ auth, user, recentActivity, roles, flash }) {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');

    // Show password modal if password was generated
    useState(() => {
        if (flash?.generated_password) {
            setGeneratedPassword(flash.generated_password);
            setShowPasswordModal(true);
        }
    }, [flash]);

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
            router.delete(route('users.destroy', user.id));
        }
    };

    const handleResetPassword = () => {
        if (confirm(`Reset password for ${user.name}? A new temporary password will be generated.`)) {
            router.post(route('users.reset-password', user.id), {}, {
                preserveScroll: true,
                onSuccess: (page) => {
                    if (page.props.flash?.generated_password) {
                        setGeneratedPassword(page.props.flash.generated_password);
                        setShowPasswordModal(true);
                    }
                },
            });
        }
    };

    const handleToggleStatus = () => {
        const action = user.is_active ? 'deactivate' : 'activate';
        if (confirm(`Are you sure you want to ${action} ${user.name}?`)) {
            router.post(route('users.toggle-status', user.id), {}, {
                preserveScroll: true,
            });
        }
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            admin: 'bg-purple-100 text-purple-800',
            teacher: 'bg-blue-100 text-blue-800',
            guardian: 'bg-green-100 text-green-800',
            accountant: 'bg-yellow-100 text-yellow-800',
            receptionist: 'bg-pink-100 text-pink-800',
            nurse: 'bg-red-100 text-red-800',
            it_staff: 'bg-indigo-100 text-indigo-800',
            maid: 'bg-gray-100 text-gray-800',
            cook: 'bg-orange-100 text-orange-800',
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (date) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isOwnAccount = user.id === auth.user.id;

    return (
        <AuthenticatedLayout header="User Details">
            <Head title={user.name} />

            <div className="max-w-5xl mx-auto">
                {/* Success/Error Messages */}
                {flash?.success && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                        <p className="text-sm font-medium text-green-800">{flash.success}</p>
                    </div>
                )}

                {flash?.error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                        <p className="text-sm font-medium text-red-800">{flash.error}</p>
                    </div>
                )}

                {/* Back Button */}
                <Link
                    href={route('users.index')}
                    className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Users
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            {/* Avatar */}
                            <div className="flex justify-center mb-4">
                                <div className="w-24 h-24 bg-orange rounded-full flex items-center justify-center text-white font-bold text-3xl">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            {/* Name & Role */}
                            <div className="text-center mb-4">
                                <h2 className="text-xl font-bold text-navy mb-2">
                                    {user.name}
                                </h2>
                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadgeColor(user.role)}`}>
                                    {roles.find(r => r.value === user.role)?.label || user.role}
                                </span>
                            </div>

                            {/* Status */}
                            <div className="flex justify-center mb-6">
                                {user.is_active ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Inactive
                                    </span>
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                                <div className="flex items-center text-sm">
                                    <Mail className="w-4 h-4 text-gray-400 mr-3" />
                                    <span className="text-gray-700">{user.email}</span>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center text-sm">
                                        <Phone className="w-4 h-4 text-gray-400 mr-3" />
                                        <span className="text-gray-700">{user.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Last Login</span>
                                    <span className="font-medium text-navy">
                                        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Created By</span>
                                    <span className="font-medium text-navy">
                                        {user.creator?.name || 'System'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Joined</span>
                                    <span className="font-medium text-navy">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {!isOwnAccount && (
                                <div className="space-y-2">
                                    <Link
                                        href={route('users.edit', user.id)}
                                        className="w-full flex items-center justify-center px-4 py-2.5 bg-orange text-white font-semibold rounded-lg hover:bg-orange-dark transition-colors"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit User
                                    </Link>
                                    <button
                                        onClick={handleResetPassword}
                                        className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        <Key className="w-4 h-4 mr-2" />
                                        Reset Password
                                    </button>
                                    <button
                                        onClick={handleToggleStatus}
                                        className={`w-full flex items-center justify-center px-4 py-2.5 font-semibold rounded-lg transition-colors ${
                                            user.is_active
                                                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                                : 'bg-green-500 text-white hover:bg-green-600'
                                        }`}
                                    >
                                        <Power className="w-4 h-4 mr-2" />
                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full flex items-center justify-center px-4 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete User
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-orange" />
                                    Recent Activity
                                </h3>
                            </div>

                            <div className="p-6">
                                {recentActivity.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">
                                        No activity recorded yet
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {recentActivity.map((activity) => (
                                            <div
                                                key={activity.id}
                                                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 bg-orange rounded-full flex items-center justify-center">
                                                        <Clock className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-navy">
                                                        {activity.description}
                                                    </p>
                                                    {activity.causer && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            By {activity.causer.name}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatDate(activity.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Modal */}
            <UserPasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                password={generatedPassword}
                userName={user.name}
            />
        </AuthenticatedLayout>
    );
}