import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, User, CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft, TrendingUp, Filter } from 'lucide-react';
import { useState } from 'react';

export default function StudentHistory({ 
    student, 
    attendances, 
    stats,
    startDate,
    endDate,
}) {
    const [localStartDate, setLocalStartDate] = useState(startDate);
    const [localEndDate, setLocalEndDate] = useState(endDate);

    // Handle date filter
    const handleFilterChange = () => {
        router.get(`/attendance/student/${student.id}`, {
            start_date: localStartDate,
            end_date: localEndDate,
        }, {
            preserveState: true,
        });
    };

    // Get status badge styling
    const getStatusBadge = (status) => {
        const styles = {
            present: 'bg-green-100 text-green-800',
            absent: 'bg-red-100 text-red-800',
            late: 'bg-yellow-100 text-yellow-800',
            excused: 'bg-blue-100 text-blue-800',
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        const icons = {
            present: CheckCircle,
            absent: XCircle,
            late: Clock,
            excused: AlertCircle,
        };
        const Icon = icons[status] || CheckCircle;
        return <Icon className="w-4 h-4" />;
    };

    return (
        <AuthenticatedLayout header={`Attendance History - ${student.first_name} ${student.last_name}`}>
            <Head title={`Attendance - ${student.first_name} ${student.last_name}`} />

            <div className="space-y-6">
    {/* Back Button */}
    {(['admin', 'teacher'].includes(student.auth_role)) ? (
        <Link
            href="/attendance"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-orange transition-colors"
        >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Attendance
        </Link>
    ) : (
        <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-orange transition-colors"
        >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
        </Link>
    )}


                {/* Student Info Card */}
                <div className="bg-gradient-to-r from-navy to-navy-dark rounded-xl shadow-sm p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 rounded-full bg-orange flex items-center justify-center text-2xl font-bold">
                                {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-1">
                                    {student.first_name} {student.last_name}
                                </h2>
                                <p className="text-navy-light text-sm">
                                    Admission No: {student.admission_number}
                                </p>
                                <p className="text-navy-light text-sm">
                                    Grade: {student.grade?.name} ({student.grade?.level})
                                </p>
                                {student.guardian && (
                                    <p className="text-navy-light text-sm">
                                        Guardian: {student.guardian.user.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-navy mb-4 flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Filter by Date Range
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={localStartDate}
                                    onChange={(e) => setLocalStartDate(e.target.value)}
                                    max={localEndDate}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={localEndDate}
                                    onChange={(e) => setLocalEndDate(e.target.value)}
                                    min={localStartDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Apply Button */}
                        <div className="flex items-end">
                            <button
                                onClick={handleFilterChange}
                                className="w-full px-6 py-2.5 bg-orange text-white rounded-lg hover:bg-orange-dark transition-all font-medium"
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 mb-1">Total Days</p>
                        <p className="text-2xl font-bold text-navy">{stats.total}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-4 text-white">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-green-100">Present</p>
                            <CheckCircle className="w-5 h-5 text-green-200" />
                        </div>
                        <p className="text-2xl font-bold">{stats.present}</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-sm p-4 text-white">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-red-100">Absent</p>
                            <XCircle className="w-5 h-5 text-red-200" />
                        </div>
                        <p className="text-2xl font-bold">{stats.absent}</p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-sm p-4 text-white">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-yellow-100">Late</p>
                            <Clock className="w-5 h-5 text-yellow-200" />
                        </div>
                        <p className="text-2xl font-bold">{stats.late}</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-4 text-white">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-blue-100">Excused</p>
                            <AlertCircle className="w-5 h-5 text-blue-200" />
                        </div>
                        <p className="text-2xl font-bold">{stats.excused}</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange to-orange-dark rounded-xl shadow-sm p-4 text-white">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-orange-100">Rate</p>
                            <TrendingUp className="w-5 h-5 text-orange-200" />
                        </div>
                        <p className="text-2xl font-bold">{stats.attendance_rate}%</p>
                    </div>
                </div>

                {/* Attendance History Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h4 className="text-lg font-semibold text-navy">
                            Attendance Records
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()})
                            </span>
                        </h4>
                    </div>

                    {attendances.data && attendances.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Day
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Remarks
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Marked By
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {attendances.data.map((attendance) => {
                                            const date = new Date(attendance.attendance_date);
                                            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                                            
                                            return (
                                                <tr key={attendance.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {date.toLocaleDateString('en-US', { 
                                                                month: 'short', 
                                                                day: 'numeric', 
                                                                year: 'numeric' 
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{dayName}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(attendance.status)}`}>
                                                            {getStatusIcon(attendance.status)}
                                                            <span className="ml-1.5 capitalize">{attendance.status}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-500 max-w-xs truncate">
                                                            {attendance.remarks || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">
                                                            {attendance.marked_by?.name || 'Unknown'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {attendances.links && (
                                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Showing page {attendances.current_page} of {attendances.last_page}
                                        </div>
                                        <div className="flex space-x-2">
                                            {attendances.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    preserveState
                                                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                                                        link.active
                                                            ? 'bg-orange text-white font-medium'
                                                            : link.url
                                                            ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-12 text-center">
                            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Attendance Records
                            </h3>
                            <p className="text-gray-500">
                                No attendance has been marked for this student in the selected date range.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}