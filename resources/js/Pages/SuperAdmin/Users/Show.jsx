import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Mail, Phone, School, Shield, Calendar, Power, RefreshCw, Trash2, User, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Show({ user }) {
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleToggleActive = () => {
        router.post(route('super-admin.users.toggle-active', user.id), {}, {
            onSuccess: () => setShowActivateModal(false),
        });
    };

    const handleResetPassword = () => {
        router.post(route('super-admin.users.reset-password', user.id), {}, {
            onSuccess: () => setShowResetPasswordModal(false),
        });
    };

    const handleDelete = () => {
        router.delete(route('super-admin.users.destroy', user.id), {
            onSuccess: () => setShowDeleteModal(false),
        });
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
        <AuthenticatedLayout header={
            <h2 className="text-xl sm:text-2xl font-bold leading-tight text-gray-800">
                User Details
            </h2>
        }>
            <Head title={`User: ${user.name}`} />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        {/* Back Button */}
                        <Link
                            href={route('super-admin.users.index')}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Users
                        </Link>

                        {/* Main Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Header with gradient */}
                            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-4 sm:px-6 py-6 sm:py-8 relative overflow-hidden">
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                        backgroundSize: '30px 30px'
                                    }}></div>
                                </div>

                                <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                                        <span className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{user.name}</h2>
                                        <p className="text-purple-100 mb-3 break-all">{user.email}</p>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRoleBadgeColor(user.role)} text-white shadow-lg`}>
                                                {user.role.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                                user.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {user.is_active ? 'Active' : 'Suspended'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 lg:p-8">
                                {/* User Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                    {/* Personal Information */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                            <User className="w-5 h-5 text-indigo-600" />
                                            Personal Information
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Full Name</dt>
                                                <dd className="text-base font-bold text-gray-900">{user.name}</dd>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    Email Address
                                                </dt>
                                                <dd className="text-base font-bold text-gray-900 break-all">{user.email}</dd>
                                            </div>
                                            {user.phone && (
                                                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                                                    <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        Phone Number
                                                    </dt>
                                                    <dd className="text-base font-bold text-gray-900">{user.phone}</dd>
                                                </div>
                                            )}
                                            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                    <Shield className="w-3 h-3" />
                                                    User Role
                                                </dt>
                                                <dd>
                                                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${getRoleBadgeColor(user.role)} text-white shadow-sm`}>
                                                        {user.role.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </dd>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Account Status</dt>
                                                <dd>
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full ${
                                                        user.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {user.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                        {user.is_active ? 'Active' : 'Suspended'}
                                                    </span>
                                                </dd>
                                            </div>
                                        </div>
                                    </div>

                                    {/* School & System Information */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                            <School className="w-5 h-5 text-indigo-600" />
                                            School & System Info
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                    <School className="w-3 h-3" />
                                                    School
                                                </dt>
                                                <dd className="text-base font-bold text-gray-900">
                                                    {user.school ? (
                                                        <Link
                                                            href={route('super-admin.schools.show', user.school.id)}
                                                            className="text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
                                                        >
                                                            {user.school.name}
                                                            <ArrowLeft className="w-3 h-3 rotate-180" />
                                                        </Link>
                                                    ) : (
                                                        <span className="text-gray-500">N/A</span>
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Account Created
                                                </dt>
                                                <dd className="text-sm font-bold text-gray-900">
                                                    {new Date(user.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </dd>
                                                <dd className="text-xs text-gray-600 mt-1">
                                                    {new Date(user.created_at).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </dd>
                                            </div>
                                            {user.last_login_at && (
                                                <div className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl border border-cyan-200">
                                                    <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Last Login
                                                    </dt>
                                                    <dd className="text-sm font-bold text-gray-900">
                                                        {new Date(user.last_login_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </dd>
                                                    <dd className="text-xs text-gray-600 mt-1">
                                                        {new Date(user.last_login_at).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </dd>
                                                </div>
                                            )}
                                            {user.email_verified_at && (
                                                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                                                    <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Email Verified
                                                    </dt>
                                                    <dd className="text-sm font-bold text-gray-900">
                                                        {new Date(user.email_verified_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </dd>
                                                </div>
                                            )}
                                            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Password Change Required</dt>
                                                <dd>
                                                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                                                        user.must_change_password
                                                            ? 'bg-yellow-200 text-yellow-800'
                                                            : 'bg-gray-200 text-gray-800'
                                                    }`}>
                                                        {user.must_change_password ? 'Yes' : 'No'}
                                                    </span>
                                                </dd>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Info for Teachers */}
                                {user.teacher && (
                                    <div className="mt-8 pt-8 border-t-2 border-gray-200">
                                        <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                            <User className="w-5 h-5 text-blue-600" />
                                            Teacher Information
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Employee Number</dt>
                                                <dd className="text-base font-bold text-gray-900">{user.teacher.employee_number || 'N/A'}</dd>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Qualification</dt>
                                                <dd className="text-base font-bold text-gray-900">{user.teacher.qualification || 'N/A'}</dd>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Subject Specialization</dt>
                                                <dd className="text-base font-bold text-gray-900">{user.teacher.subject_specialization || 'N/A'}</dd>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Date of Joining</dt>
                                                <dd className="text-base font-bold text-gray-900">
                                                    {user.teacher.date_of_joining ? new Date(user.teacher.date_of_joining).toLocaleDateString() : 'N/A'}
                                                </dd>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Additional Info for Guardians */}
                                {user.guardian && (
                                    <div className="mt-8 pt-8 border-t-2 border-gray-200">
                                        <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                            <User className="w-5 h-5 text-green-600" />
                                            Guardian Information
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Relationship</dt>
                                                <dd className="text-base font-bold text-gray-900 capitalize">{user.guardian.relationship || 'N/A'}</dd>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Occupation</dt>
                                                <dd className="text-base font-bold text-gray-900">{user.guardian.occupation || 'N/A'}</dd>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 sm:col-span-2 lg:col-span-1">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    Address
                                                </dt>
                                                <dd className="text-sm font-bold text-gray-900">{user.guardian.address || 'N/A'}</dd>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer with Action Buttons */}
                            <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                                <div className="flex flex-col sm:flex-row justify-end gap-3">
                                    <button
                                        onClick={() => setShowActivateModal(true)}
                                        className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-sm font-bold text-white rounded-xl transition-all duration-300 shadow-lg hover:scale-105 ${
                                            user.is_active
                                                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:shadow-red-500/50'
                                                : 'bg-gradient-to-r from-green-600 to-green-700 hover:shadow-green-500/50'
                                        }`}
                                    >
                                        <Power className="w-4 h-4" />
                                        {user.is_active ? 'Suspend User' : 'Activate User'}
                                    </button>
                                    <button
                                        onClick={() => setShowResetPasswordModal(true)}
                                        className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Reset Password
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 hover:scale-105"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete User
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ConfirmationModal
                show={showActivateModal}
                onClose={() => setShowActivateModal(false)}
                onConfirm={handleToggleActive}
                title={user.is_active ? 'Suspend User' : 'Activate User'}
                message={`Are you sure you want to ${user.is_active ? 'suspend' : 'activate'} ${user.name}?`}
                confirmText={user.is_active ? 'Suspend' : 'Activate'}
                type={user.is_active ? 'danger' : 'info'}
            />

            <ConfirmationModal
                show={showResetPasswordModal}
                onClose={() => setShowResetPasswordModal(false)}
                onConfirm={handleResetPassword}
                title="Reset Password"
                message={`Are you sure you want to reset the password for ${user.name}? A new password will be generated and sent to their email.`}
                confirmText="Reset Password"
                type="warning"
            />

            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete User"
                message={`Are you sure you want to delete ${user.name}? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </AuthenticatedLayout>
    );
}