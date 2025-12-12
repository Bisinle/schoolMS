import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Calendar, User, TrendingUp, CheckCircle, AlertCircle, Power, PowerOff } from 'lucide-react';
import ProgressBar from '@/Components/UI/ProgressBar';

export default function Index({ auth, schedules, students, filters }) {
    const handleActivate = (scheduleId) => {
        if (confirm('Activate this schedule? This will deactivate any other active schedules for this student.')) {
            router.post(`/quran-schedule/${scheduleId}/activate`);
        }
    };

    const handleDeactivate = (scheduleId) => {
        if (confirm('Deactivate this schedule?')) {
            router.post(`/quran-schedule/${scheduleId}/deactivate`);
        }
    };

    const handleDelete = (scheduleId) => {
        if (confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
            router.delete(`/quran-schedule/${scheduleId}`);
        }
    };

    const getStatusBadge = (schedule) => {
        if (!schedule.is_active) {
            return { color: 'bg-gray-100 text-gray-800', label: 'Inactive' };
        }

        const status = schedule.status_badge;
        const badges = {
            completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
            on_track: { color: 'bg-blue-100 text-blue-800', label: 'On Track' },
            behind: { color: 'bg-yellow-100 text-yellow-800', label: 'Behind' },
            significantly_behind: { color: 'bg-orange-100 text-orange-800', label: 'Significantly Behind' },
            overdue: { color: 'bg-red-100 text-red-800', label: 'Overdue' },
        };

        return badges[status] || { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Quran Schedules" />

            <div className="py-6 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                                Quran Schedules
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Set and track long-term memorization targets
                            </p>
                        </div>

                        <Link
                            href="/quran-schedule/create"
                            className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-orange text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-orange-dark transition-colors shadow-lg"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            Create Schedule
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Student Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Student
                                </label>
                                <select
                                    value={filters.student_id || ''}
                                    onChange={(e) => router.get('/quran-schedule', { 
                                        ...filters, 
                                        student_id: e.target.value 
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange"
                                >
                                    <option value="">All Students</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.first_name} {student.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Schedule Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Schedule Type
                                </label>
                                <select
                                    value={filters.schedule_type || ''}
                                    onChange={(e) => router.get('/quran-schedule', { 
                                        ...filters, 
                                        schedule_type: e.target.value 
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange"
                                >
                                    <option value="">All Types</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={filters.status || ''}
                                    onChange={(e) => router.get('/quran-schedule', { 
                                        ...filters, 
                                        status: e.target.value 
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Schedules List */}
                    <div className="space-y-4">
                        {schedules.data.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                                <p className="text-gray-500">No schedules found.</p>
                            </div>
                        ) : (
                            schedules.data.map((schedule) => {
                                const statusBadge = getStatusBadge(schedule);

                                return (
                                    <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-orange to-orange-dark rounded-full flex items-center justify-center">
                                                    <User className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">
                                                        {schedule.student.first_name} {schedule.student.last_name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">
                                                        {schedule.student.grade?.name || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
                                                    {statusBadge.label}
                                                </span>
                                                {schedule.is_active && (
                                                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                                        <Power className="w-3 h-3 mr-1" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {schedule.target_total_pages && (
                                            <div className="mb-4">
                                                <ProgressBar
                                                    current={schedule.current_progress}
                                                    target={schedule.target_total_pages}
                                                    label="Memorization Progress"
                                                    showPercentage={true}
                                                    showStatus={true}
                                                    size="md"
                                                />
                                            </div>
                                        )}

                                        {/* Schedule Details */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Schedule Type</p>
                                                <p className="font-semibold text-gray-900">{schedule.schedule_type_label}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Target per Period</p>
                                                <p className="font-semibold text-gray-900">
                                                    {schedule.target_pages_per_period || schedule.target_verses_per_period || 'N/A'}
                                                    {schedule.target_pages_per_period ? ' pages' : ' verses'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Days Elapsed</p>
                                                <p className="font-semibold text-gray-900">{schedule.days_elapsed} days</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Days Remaining</p>
                                                <p className="font-semibold text-gray-900">
                                                    {schedule.days_remaining !== null ? `${schedule.days_remaining} days` : 'No deadline'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                            <Link
                                                href={`/quran-schedule/${schedule.id}`}
                                                className="text-sm text-orange hover:text-orange-dark font-medium"
                                            >
                                                View Details →
                                            </Link>

                                            <div className="flex gap-2">
                                                {schedule.is_active ? (
                                                    <button
                                                        onClick={() => handleDeactivate(schedule.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200"
                                                    >
                                                        <PowerOff className="w-3 h-3" />
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleActivate(schedule.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200"
                                                    >
                                                        <Power className="w-3 h-3" />
                                                        Activate
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/quran-schedule/${schedule.id}/edit`}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(schedule.id)}
                                                    className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {schedules.links && schedules.links.length > 3 && (
                        <div className="mt-6 flex justify-center gap-2">
                            {schedules.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                        ${link.active
                                            ? 'bg-orange text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                        }
                                        ${!link.url && 'opacity-50 cursor-not-allowed'}
                                    `}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}


