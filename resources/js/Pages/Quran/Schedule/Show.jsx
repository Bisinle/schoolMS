import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, User, Edit, Trash2, Power, PowerOff, TrendingUp, BookOpen, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import ProgressBar from '@/Components/UI/ProgressBar';

const STATUS_BADGES = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'graded': 'bg-green-100 text-green-800',
    'absent': 'bg-red-100 text-red-800',
    'not_prepared': 'bg-pink-100 text-pink-800',
};

const STATUS_LABELS = {
    'pending': 'Pending',
    'graded': 'Graded',
    'absent': 'Absent',
    'not_prepared': 'Not Prepared',
};

const getStatusIcon = (status) => {
    if (status === 'graded') return CheckCircle;
    if (status === 'absent') return XCircle;
    if (status === 'not_prepared') return AlertTriangle;
    return Clock;
};

export default function Show({ auth, schedule, homeworkRecords }) {
    const handleActivate = () => {
        if (confirm('Activate this schedule? This will deactivate any other active schedules for this student.')) {
            router.post(`/quran-schedule/${schedule.id}/activate`);
        }
    };

    const handleDeactivate = () => {
        if (confirm('Deactivate this schedule?')) {
            router.post(`/quran-schedule/${schedule.id}/deactivate`);
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
            router.delete(`/quran-schedule/${schedule.id}`);
        }
    };

    const getStatusBadge = () => {
        if (!schedule.is_active) {
            return { color: 'bg-gray-100 text-gray-800', label: 'Inactive' };
        }

        const status = schedule.status_badge;
        if (status == null) {
            return { color: 'bg-gray-100 text-gray-800', label: 'Not available' };
        }

        const badges = {
            completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
            on_track: { color: 'bg-blue-100 text-blue-800', label: 'On Track' },
            behind: { color: 'bg-yellow-100 text-yellow-800', label: 'Behind' },
            significantly_behind: { color: 'bg-orange-100 text-orange-800', label: 'Significantly Behind' },
            overdue: { color: 'bg-red-100 text-red-800', label: 'Overdue' },
        };

        return badges[status] || { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    };

    const statusBadge = getStatusBadge();

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Schedule Details" />

            <div className="py-6 sm:py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                                Schedule Details
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Long-term memorization target tracking
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {schedule.is_active ? (
                                <button
                                    onClick={handleDeactivate}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    <PowerOff className="w-4 h-4" />
                                    Deactivate
                                </button>
                            ) : (
                                <button
                                    onClick={handleActivate}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Power className="w-4 h-4" />
                                    Activate
                                </button>
                            )}
                            <Link
                                href={`/quran-schedule/${schedule.id}/edit`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Status</h2>
                            <div className="flex gap-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.color}`}>
                                    {statusBadge.label}
                                </span>
                                {schedule.is_active && (
                                    <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                        <Power className="w-3 h-3 mr-1" />
                                        Active
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {schedule.target_total_pages && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Overall Memorization Progress</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {schedule.current_progress} / {schedule.target_total_pages} pages ({schedule.progress_percentage}%)
                                    </span>
                                </div>
                                <ProgressBar
                                    value={schedule.current_progress}
                                    max={schedule.target_total_pages}
                                    color="orange"
                                    size="lg"
                                />
                            </div>
                        )}
                    </div>

                    {/* Student Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Student Information</h2>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange to-orange-dark rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {schedule.student.first_name} {schedule.student.last_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {schedule.student.grade?.name || 'N/A'} • {schedule.student.admission_number}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Details Card */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl shadow-sm border border-orange-200/50 p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Schedule Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Memorization Range</label>
                                <div dir="rtl" className="flex items-center justify-end gap-2">
                                    <p dir="ltr" className="text-lg font-bold text-gray-900">
                                        Surah {schedule.surah_from}:{schedule.verse_from} → Surah {schedule.surah_to}:{schedule.verse_to}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Total Target</label>
                                <p className="text-lg font-bold text-gray-900">
                                    {schedule.target_total_pages ? `${schedule.target_total_pages} pages` : 'Not available'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-orange" />
                                    <p className="font-semibold text-gray-900">
                                        {new Date(schedule.start_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-orange" />
                                    <p className="font-semibold text-gray-900">
                                        {schedule.end_date
                                            ? new Date(schedule.end_date).toLocaleDateString()
                                            : 'Open-ended'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Progress</label>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-orange" />
                                    <p className="font-semibold text-gray-900">
                                        {schedule.progress_percentage != null ? `${schedule.progress_percentage}% Complete` : 'Not available'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Days Elapsed</label>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-orange" />
                                    <p className="font-semibold text-gray-900">
                                        {schedule.days_elapsed != null ? `${schedule.days_elapsed} days` : 'Not available'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Days Remaining</label>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-orange" />
                                    <p className="font-semibold text-gray-900">
                                        {schedule.days_remaining != null ? `${schedule.days_remaining} days` : 'No deadline'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {schedule.notes && (
                            <div className="mt-6 pt-6 border-t border-orange-200">
                                <label className="block text-sm font-medium text-gray-600 mb-2">Notes</label>
                                <p className="text-gray-700 whitespace-pre-wrap">{schedule.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Homework Records */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            Homework Entries
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                (Chained from this schedule)
                            </span>
                        </h2>

                        {homeworkRecords.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                No homework entries have been assigned from this schedule yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {homeworkRecords.map((record) => {
                                    const StatusIcon = getStatusIcon(record.status);
                                    return (
                                        <Link
                                            key={record.id}
                                            href={`/quran-homework/${record.id}`}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-orange to-orange-dark rounded-full flex items-center justify-center">
                                                    <BookOpen className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {record.reading_type_label}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Surah {record.surah_from}:{record.verse_from} -
                                                        Surah {record.surah_to}:{record.verse_to}
                                                    </p>
                                                    {record.status === 'graded' && record.pages_memorized > 0 && (
                                                        <p className="text-xs text-gray-500">
                                                            {record.pages_memorized} pages memorized
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_BADGES[record.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {STATUS_LABELS[record.status] || record.status_label}
                                                </span>
                                                <p className="text-sm font-medium text-gray-900 mt-1">
                                                    {new Date(record.assigned_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Back Button */}
                    <div className="mt-6">
                        <Link
                            href="/quran-schedule"
                            className="inline-flex items-center text-orange hover:text-orange-dark font-medium"
                        >
                            ← Back to Schedules
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
