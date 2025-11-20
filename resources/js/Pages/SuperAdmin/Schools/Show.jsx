import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, Power, UserCircle, Users, GraduationCap, BookOpen, School, Mail, Phone, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Show({ school }) {
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showImpersonateModal, setShowImpersonateModal] = useState(false);

    const handleToggleActive = () => {
        router.post(
            route('super-admin.schools.toggle-active', school.id),
            {},
            {
                onSuccess: () => setShowActivateModal(false),
            }
        );
    };

    const handleDelete = () => {
        router.delete(route('super-admin.schools.destroy', school.id), {
            onSuccess: () => setShowDeleteModal(false),
        });
    };

    const handleImpersonate = () => {
        router.post(route('super-admin.schools.impersonate', school.id), {
            onSuccess: () => setShowImpersonateModal(false),
        });
    };

    return (
        <AuthenticatedLayout header={
            <h2 className="text-xl sm:text-2xl font-bold leading-tight text-gray-800">
                School Details
            </h2>
        }>
            <Head title={`School: ${school.name}`} />

            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        {/* Back Button */}
                        <Link
                            href={route('super-admin.schools.index')}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Schools
                        </Link>

                        {/* Main Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Header with gradient */}
                            <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 px-4 sm:px-6 py-6 sm:py-8 relative overflow-hidden">
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                        backgroundSize: '30px 30px'
                                    }}></div>
                                </div>

                                <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                                        <span className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                            {school.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{school.name}</h2>
                                        <p className="text-blue-100 mb-3 break-all">{school.domain}</p>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                school.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {school.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                school.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                                school.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {school.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 lg:p-8">
                                {/* School Information Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
                                    {/* School Details */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg sm:text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                            <School className="w-5 h-5 text-blue-600" />
                                            School Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">School Slug</dt>
                                                <dd className="text-base font-bold text-gray-900">{school.slug}</dd>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    Address
                                                </dt>
                                                <dd className="text-sm font-bold text-gray-900">{school.address || 'N/A'}</dd>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Trial Ends At
                                                </dt>
                                                <dd className="text-sm font-bold text-gray-900">
                                                    {school.trial_ends_at ? new Date(school.trial_ends_at).toLocaleDateString() : 'N/A'}
                                                </dd>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admin Details */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg sm:text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                            <UserCircle className="w-5 h-5 text-blue-600" />
                                            Admin Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Admin Name</dt>
                                                <dd className="text-base font-bold text-gray-900">{school.admin_name}</dd>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl border border-cyan-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    Admin Email
                                                </dt>
                                                <dd className="text-sm font-bold text-gray-900 break-all">{school.admin_email}</dd>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                                                <dt className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    Admin Phone
                                                </dt>
                                                <dd className="text-sm font-bold text-gray-900">{school.admin_phone || 'N/A'}</dd>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Statistics Section */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                                    <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                        School Statistics
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                <Users className="w-6 h-6 text-white" />
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">{school.users_count || 0}</p>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Total Users</p>
                                        </div>
                                        <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                <Users className="w-6 h-6 text-white" />
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">{school.students_count || 0}</p>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Students</p>
                                        </div>
                                        <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                <GraduationCap className="w-6 h-6 text-white" />
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">{school.teachers_count || 0}</p>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Teachers</p>
                                        </div>
                                        <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                <BookOpen className="w-6 h-6 text-white" />
                                            </div>
                                            <p className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">{school.grades_count || 0}</p>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Grades</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer with Action Buttons */}
                            <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                                <div className="flex flex-col sm:flex-row flex-wrap justify-end gap-3">
                                    <button
                                        onClick={() => setShowImpersonateModal(true)}
                                        className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                                    >
                                        <UserCircle className="w-4 h-4" />
                                        Impersonate Admin
                                    </button>
                                    <button
                                        onClick={() => setShowActivateModal(true)}
                                        className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-sm font-bold text-white rounded-xl transition-all duration-300 hover:scale-105 ${
                                            school.is_active
                                                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-500/50'
                                                : 'bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg hover:shadow-green-500/50'
                                        }`}
                                    >
                                        <Power className="w-4 h-4" />
                                        {school.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <Link
                                        href={route('super-admin.schools.edit', school.id)}
                                        className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit School
                                    </Link>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 hover:scale-105"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
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
                title={school.is_active ? 'Deactivate School' : 'Activate School'}
                message={`Are you sure you want to ${school.is_active ? 'deactivate' : 'activate'} ${school.name}?`}
                confirmText={school.is_active ? 'Deactivate' : 'Activate'}
                type={school.is_active ? 'danger' : 'info'}
            />

            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete School"
                message={`Are you sure you want to delete ${school.name}? This action cannot be undone and will permanently delete all students, teachers, grades, and other data associated with this school.`}
                confirmText="Delete School"
                type="danger"
            />

            <ConfirmationModal
                show={showImpersonateModal}
                onClose={() => setShowImpersonateModal(false)}
                onConfirm={handleImpersonate}
                title="Impersonate School Admin"
                message={`You are about to impersonate the admin of ${school.name}. You will be logged in as the school admin and can perform actions on their behalf.`}
                confirmText="Impersonate"
                type="warning"
            />
        </AuthenticatedLayout>
    );
}