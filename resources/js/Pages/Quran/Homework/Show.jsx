import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, BookOpen, Calendar, User, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';

export default function Show({ homework, auth }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const isGuardian = auth.user.role === 'guardian';
    const canEdit = auth.user.role === 'admin' || auth.user.id === homework.teacher_id;

    const handleDelete = () => {
        router.delete(`/quran-homework/${homework.id}`, {
            onSuccess: () => {
                router.visit('/quran-homework');
            },
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            'completed': 'bg-green-100 text-green-800',
            'overdue': 'bg-red-100 text-red-800',
            'pending': 'bg-yellow-100 text-yellow-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        if (status === 'completed') return CheckCircle;
        if (status === 'overdue') return AlertCircle;
        return Clock;
    };

    const getTypeBadge = (type) => {
        const badges = {
            'memorize': 'bg-purple-100 text-purple-800',
            'revise': 'bg-blue-100 text-blue-800',
            'read': 'bg-green-100 text-green-800',
        };
        return badges[type] || 'bg-gray-100 text-gray-800';
    };

    const StatusIcon = getStatusIcon(homework.status_badge);

    return (
        <AuthenticatedLayout header="Homework Details">
            <Head title="Homework Details" />

            <div className="py-6 sm:py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <Link
                            href={isGuardian ? "/guardian/quran-homework" : "/quran-homework"}
                            className="inline-flex items-center text-sm text-gray-600 hover:text-orange transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Homework
                        </Link>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <BookOpen className="w-8 h-8 text-orange" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Homework Details</h2>
                                    <p className="text-sm text-gray-600">
                                        {homework.student.first_name} {homework.student.last_name}
                                    </p>
                                </div>
                            </div>

                            {canEdit && (
                                <div className="flex gap-2">
                                    <Link
                                        href={`/quran-homework/${homework.id}/edit`}
                                        className="inline-flex items-center px-4 py-2 bg-orange text-white text-sm font-medium rounded-lg hover:bg-orange-dark transition-colors"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Status</h3>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(homework.status_badge)}`}>
                                            <StatusIcon className="w-4 h-4" />
                                            {homework.status_badge}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeBadge(homework.homework_type)}`}>
                                            {homework.homework_type_label}
                                        </span>
                                    </div>
                                </div>
                                {homework.completed && homework.completion_date && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 mb-1">Completed on</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date(homework.completion_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Student Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Student Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center">
                                        <User className="w-5 h-5 text-orange" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Student Name</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {homework.student.first_name} {homework.student.last_name}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {homework.student.admission_number} • {homework.student.grade?.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Assigned By</p>
                                        <p className="text-sm font-semibold text-gray-900">{homework.teacher.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Assignment Details */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Assignment Details</h3>

                            {/* Surah & Verse Range */}
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200/50 mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-orange" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-600 mb-1">Surah Range</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            Surah {homework.surah_from} - {homework.surah_to}
                                        </p>
                                        <p className="text-sm text-gray-700 mt-1">
                                            Verses {homework.verse_from} - {homework.verse_to}
                                        </p>
                                        {homework.page_from && homework.page_to && (
                                            <p className="text-xs text-gray-600 mt-2">
                                                Pages {homework.page_from} - {homework.page_to}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Assigned Date</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date(homework.assigned_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Due Date</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date(homework.due_date).toLocaleDateString()}
                                        </p>
                                        {homework.days_until_due !== null && !homework.completed && (
                                            <p className={`text-xs mt-1 ${homework.is_overdue ? 'text-red-600' : 'text-gray-600'}`}>
                                                {homework.is_overdue
                                                    ? `Overdue by ${Math.abs(homework.days_until_due)} days`
                                                    : `${homework.days_until_due} days remaining`
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        {homework.teacher_instructions && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Teacher Instructions</h3>
                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {homework.teacher_instructions}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Completion Notes */}
                        {homework.completed && homework.completion_notes && (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-green-900 mb-2">Completion Notes</h3>
                                        <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">
                                            {homework.completion_notes}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Homework"
                message="Are you sure you want to delete this homework assignment? This action cannot be undone."
            />
        </AuthenticatedLayout>
    );
}

