import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Clock,
    MapPin,
    AlertTriangle,
    User,
    Users,
    Heart,
    Phone,
    Calendar,
    FileText,
    CheckCircle,
    XCircle,
    Download,
    Image as ImageIcon
} from 'lucide-react';

export default function Show({ auth, report }) {
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const { data, setData, post, processing } = useForm({
        review_notes: '',
        status: 'under_review',
    });

    const handleReview = (e) => {
        e.preventDefault();
        post(route('accident-reports.review', report.id), {
            onSuccess: () => setShowReviewModal(false),
        });
    };

    const handleDelete = () => {
        router.delete(route('accident-reports.destroy', report.id), {
            onSuccess: () => router.visit(route('accident-reports.index')),
        });
    };

    const getSeverityColor = (severity) => {
        const colors = {
            minor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            severe: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
            critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return colors[severity] || colors.minor;
    };

    const getStatusColor = (status) => {
        const colors = {
            submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            under_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        };
        return colors[status] || colors.submitted;
    };

    const canEdit = (auth.user.id === report.reported_by || auth.user.role === 'admin') && report.status !== 'closed';
    const canReview = auth.user.role === 'admin';
    const canDelete = auth.user.role === 'admin';

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Accident Report - ${report.report_number}`} />

            <div className="py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <button
                            onClick={() => router.visit(route('accident-reports.index'))}
                            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Reports
                        </button>
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {report.title}
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Report #{report.report_number}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSeverityColor(report.severity)}`}>
                                        {report.severity}
                                    </span>
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(report.status)}`}>
                                        {report.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {canEdit && (
                                    <Link
                                        href={route('accident-reports.edit', report.id)}
                                        className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Link>
                                )}
                                {canReview && report.status !== 'closed' && (
                                    <button
                                        onClick={() => setShowReviewModal(true)}
                                        className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Review
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Incident Details */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Incident Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Date & Time</p>
                                    <p className="text-gray-900 dark:text-white">
                                        {new Date(report.incident_date).toLocaleDateString()} at {report.incident_time}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                                    <p className="text-gray-900 dark:text-white">{report.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Incident Type</p>
                                    <p className="text-gray-900 dark:text-white capitalize">{report.incident_type.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Reported By</p>
                                    <p className="text-gray-900 dark:text-white">{report.reporter?.name || 'Unknown'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</p>
                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{report.description}</p>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Immediate Action Taken</p>
                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{report.immediate_action_taken}</p>
                        </div>
                    </div>

                    {/* People Involved */}
                    {report.people_involved && report.people_involved.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                People Involved
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {report.people_involved.map((personId, index) => (
                                    <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full text-sm">
                                        Person ID: {personId}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Witnesses */}
                    {report.witnesses && report.witnesses.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Witnesses
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {report.witnesses.map((personId, index) => (
                                    <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full text-sm">
                                        Person ID: {personId}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Medical Information */}
                    {report.medical_attention_required && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Heart className="w-5 h-5 text-red-500" />
                                Medical Information
                            </h2>
                            <div className="space-y-3">
                                {report.medical_facility && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Medical Facility</p>
                                        <p className="text-gray-900 dark:text-white">{report.medical_facility}</p>
                                    </div>
                                )}
                                {report.medical_notes && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Medical Notes</p>
                                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{report.medical_notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Parent Notification */}
                    {report.parent_notified && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-blue-500" />
                                Parent/Guardian Notification
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Notification Method</p>
                                    <p className="text-gray-900 dark:text-white capitalize">{report.parent_notification_method?.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Notified At</p>
                                    <p className="text-gray-900 dark:text-white">
                                        {new Date(report.parent_notified_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Follow-up */}
                    {report.follow_up_required && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-500" />
                                Follow-up Required
                            </h2>
                            <div className="space-y-3">
                                {report.follow_up_date && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Follow-up Date</p>
                                        <p className="text-gray-900 dark:text-white">
                                            {new Date(report.follow_up_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                {report.follow_up_notes && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Follow-up Notes</p>
                                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{report.follow_up_notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    {report.attachments && report.attachments.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Attachments
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {report.attachments.map((attachment, index) => {
                                    // Handle both old format (string) and new format (object with path)
                                    const filePath = typeof attachment === 'string' ? attachment : attachment.path;
                                    const fileName = typeof attachment === 'string'
                                        ? attachment.split('/').pop()
                                        : (attachment.name || attachment.path.split('/').pop());
                                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filePath);

                                    return isImage ? (
                                        <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                                            <a
                                                href={`/storage/${filePath}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block group"
                                            >
                                                <div className="relative">
                                                    <img
                                                        src={`/storage/${filePath}`}
                                                        alt={fileName}
                                                        className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                                                        <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                                <div className="p-2">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                        {fileName}
                                                    </p>
                                                </div>
                                            </a>
                                        </div>
                                    ) : (
                                        <a
                                            key={index}
                                            href={`/storage/${filePath}`}
                                            download
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            <div className="flex items-center">
                                                <FileText className="w-5 h-5 text-gray-400 mr-3" />
                                                <span className="text-sm text-gray-900 dark:text-white">
                                                    {fileName}
                                                </span>
                                            </div>
                                            <Download className="w-4 h-4 text-gray-400" />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Review Information */}
                    {report.reviewed_at && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Review Information
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Reviewed By</p>
                                    <p className="text-gray-900 dark:text-white">{report.reviewer?.name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Reviewed At</p>
                                    <p className="text-gray-900 dark:text-white">
                                        {new Date(report.reviewed_at).toLocaleString()}
                                    </p>
                                </div>
                                {report.review_notes && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Review Notes</p>
                                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{report.review_notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Review Accident Report
                        </h3>
                        <form onSubmit={handleReview}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Status
                                </label>
                                <select
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="under_review">Under Review</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Review Notes
                                </label>
                                <textarea
                                    value={data.review_notes}
                                    onChange={e => setData('review_notes', e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    required
                                    placeholder="Enter your review notes..."
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewModal(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    {processing ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Delete Accident Report
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to delete this accident report? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
