import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Clock,
    MapPin,
    AlertOctagon,
    User,
    Users,
    Phone,
    Calendar,
    FileText,
    Download,
    Shield,
    AlertTriangle,
    Mail,
    Image as ImageIcon
} from 'lucide-react';

export default function Show({ auth, report, students = [], staff = [], guardians = [] }) {
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const { data, setData, post, processing } = useForm({
        status: report.status || 'open',
        resolution: report.resolution || '',
        resolved_date: report.resolved_date || '',
    });

    const handleStatusUpdate = (e) => {
        e.preventDefault();
        post(route('incident-reports.updateStatus', report.id), {
            onSuccess: () => setShowStatusModal(false),
        });
    };

    const handleDelete = () => {
        router.delete(route('incident-reports.destroy', report.id), {
            onSuccess: () => router.visit(route('incident-reports.index')),
        });
    };

    const getSeverityColor = (severity) => {
        const colors = {
            minor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            severe: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        return colors[severity] || colors.minor;
    };

    const getStatusColor = (status) => {
        const colors = {
            open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            investigating: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        };
        return colors[status] || colors.open;
    };

    const getIncidentTypeLabel = (type) => {
        const labels = {
            bullying: 'Bullying',
            fighting: 'Fighting',
            theft: 'Theft',
            vandalism: 'Vandalism',
            disrespect: 'Disrespect',
            cheating: 'Cheating',
            truancy: 'Truancy',
            substance_abuse: 'Substance Abuse',
            weapons: 'Weapons',
            harassment: 'Harassment',
            cut_laceration: 'Cut/Laceration',
            broken_bones: 'Broken Bones',
            head_injury: 'Head Injury',
            other: 'Other',
        };
        return labels[type] || type;
    };

    const canEdit = (auth.user.id === report.reported_by || auth.user.role === 'admin') && report.status !== 'closed';
    const canUpdateStatus = ['admin', 'teacher'].includes(auth.user.role);
    const canDelete = auth.user.role === 'admin';

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Incident Report - ${report.report_number}`} />

            <div className="py-6 sm:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <button
                            onClick={() => router.visit(route('incident-reports.index'))}
                            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Reports
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                    <AlertOctagon className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                        {report.title || report.report_number}
                                    </h1>
                                    {report.title && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {report.report_number}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(report.severity)}`}>
                                            {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                                            {report.status.charAt(0).toUpperCase() + report.status.slice(1).replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                                {canEdit && (
                                    <Link
                                        href={route('incident-reports.edit', report.id)}
                                        className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Link>
                                )}
                                {canUpdateStatus && (
                                    <button
                                        onClick={() => setShowStatusModal(true)}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Update Status
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Incident Details */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Incident Details
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Date & Time
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {new Date(report.incident_date + 'T' + report.incident_time).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        Location
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {report.location}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Incident Type
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {getIncidentTypeLabel(report.incident_type)}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        <User className="w-4 h-4 mr-2" />
                                        Reported By
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {report.reporter?.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Students Involved */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Students Involved
                            </h2>
                            {report.students_involved && report.students_involved.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {report.students_involved.map((studentId, index) => {
                                        const student = students?.find(s => s.id == studentId);
                                        return student ? (
                                            <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <User className="w-5 h-5 text-gray-400 mr-3" />
                                                <div>
                                                    <p className="text-gray-900 dark:text-white font-medium">
                                                        {student.first_name} {student.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {student.grade?.name || 'No Grade'} {student.admission_number && `• ${student.admission_number}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-600 dark:text-gray-400">No students listed</p>
                            )}
                        </div>

                        {/* Staff Involved */}
                        {report.staff_involved && report.staff_involved.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Staff Involved
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {report.staff_involved.map((staffId, index) => {
                                        const staffMember = staff?.find(s => s.id == staffId);
                                        return staffMember ? (
                                            <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <Users className="w-5 h-5 text-gray-400 mr-3" />
                                                <div>
                                                    <p className="text-gray-900 dark:text-white font-medium">
                                                        {staffMember.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {staffMember.role} {staffMember.email && `• ${staffMember.email}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Parents/Guardians */}
                        {guardians && guardians.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Parents/Guardians of Involved Students
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {guardians.map((guardian, index) => (
                                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="flex items-start">
                                                <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-gray-900 dark:text-white font-medium">
                                                        {guardian.name}
                                                    </p>
                                                    {guardian.relationship && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                            {guardian.relationship}
                                                        </p>
                                                    )}
                                                    {guardian.students && guardian.students.length > 0 && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                                            Parent of: {guardian.students.map(s => `${s.first_name} ${s.last_name}`).join(', ')}
                                                        </p>
                                                    )}
                                                    <div className="space-y-1">
                                                        {guardian.phone && (
                                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                                <Phone className="w-3 h-3 mr-2" />
                                                                {guardian.phone}
                                                            </div>
                                                        )}
                                                        {guardian.email && (
                                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                                <Mail className="w-3 h-3 mr-2" />
                                                                {guardian.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Description
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {report.description}
                            </p>
                        </div>

                        {/* Action Taken */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Immediate Action Taken
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {report.action_taken}
                            </p>
                        </div>

                        {/* Witnesses */}
                        {report.witnesses && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Witnesses
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {report.witnesses}
                                </p>
                            </div>
                        )}

                        {/* Disciplinary Action */}
                        {report.disciplinary_action && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Disciplinary Action
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {report.disciplinary_action}
                                </p>
                            </div>
                        )}

                        {/* Parent Contact */}
                        {report.parent_contacted && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <Phone className="w-5 h-5 mr-2" />
                                    Parent Contact
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {report.parent_contacted_at && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Contact Date & Time</p>
                                            <p className="text-gray-900 dark:text-white font-medium">
                                                {new Date(report.parent_contacted_at).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                    {report.parent_contact_method && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Contact Method</p>
                                            <p className="text-gray-900 dark:text-white font-medium">
                                                {report.parent_contact_method}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Police Involvement */}
                        {report.police_involved && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <Shield className="w-5 h-5 mr-2" />
                                    Police Involvement
                                </h2>
                                {report.police_report_number && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Police Report Number</p>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {report.police_report_number}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Follow-up */}
                        {report.follow_up_required && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Follow-up Required
                                </h2>
                                {report.follow_up_notes && (
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {report.follow_up_notes}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Resolution */}
                        {(report.status === 'resolved' || report.status === 'closed') && report.resolution && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Resolution
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
                                    {report.resolution}
                                </p>
                                {report.resolved_date && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Resolved Date</p>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {new Date(report.resolved_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                {report.handler && (
                                    <div className="mt-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Handled By</p>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {report.handler.name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Attachments */}
                        {report.attachments && report.attachments.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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

                        {/* Metadata */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Report Information
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600 dark:text-gray-400">Created</p>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {new Date(report.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600 dark:text-gray-400">Last Updated</p>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {new Date(report.updated_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Update Incident Status
                        </h3>
                        <form onSubmit={handleStatusUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="open">Open</option>
                                    <option value="investigating">Investigating</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            {(data.status === 'resolved' || data.status === 'closed') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Resolution
                                        </label>
                                        <textarea
                                            value={data.resolution}
                                            onChange={e => setData('resolution', e.target.value)}
                                            rows={4}
                                            placeholder="Describe how the incident was resolved..."
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Resolved Date
                                        </label>
                                        <input
                                            type="date"
                                            value={data.resolved_date}
                                            onChange={e => setData('resolved_date', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                                >
                                    {processing ? 'Updating...' : 'Update Status'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowStatusModal(false)}
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Delete Incident Report
                            </h3>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            Are you sure you want to delete this incident report? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDelete}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
                            >
                                Delete Report
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
